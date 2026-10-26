// 晚安王國 Windows 電腦版（下載版）的小商店（Cloudflare Worker＋D1＋R2）。設計：shop/README.md
// 2026-10-26 負責人定案：電腦上賣下載版（安裝程式），網頁版是免費試玩。App 版一律用 Apple／Google 的付款（Apple 3.1.1），App 裡不提這裡。
// 寫法、綠界規定與踩過的坑跟《音樂家的人生》電腦版商店一樣（music-game 專案 apps/mozart-shop、docs/musician-life/desktop-sales.md）。
// 網址：/buy 購買頁 → POST /api/order 建單並轉到綠界 → 綠界通知 /ecpay/return（伺服器）、/ecpay/payinfo（ATM 取號）
//      → 買家回到 /ecpay/result → /thanks（每幾秒問 /api/status；付款成功顯示下載按鈕）→ /dl/<代碼> 下載安裝程式
//      /resend 買家自己重寄下載連結（輸入 email）；/help 安裝教學；/admin 給負責人查訂單、重寄
// 金鑰都從 env 讀（本機 .dev.vars；正式由負責人在 Cloudflare 網站「變數和祕密」設成 Secret）：
//   ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV、TOKEN_SECRET、ADMIN_PASSWORD、MAIL_URL、MAIL_SECRET

const ECPAY_HOST = { stage: 'https://payment-stage.ecpay.com.tw', prod: 'https://payment.ecpay.com.tw' };
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function hmac(key, s) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(s)));
}
// 固定時間比較：不讓人從回應快慢猜出檢查碼
function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const ABC = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function rand(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(b => ABC[b % ABC.length]).join(''); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
// 綠界要台灣時間（Worker 是 UTC，加 8 小時）
function twDate(ms = Date.now()) {
  const d = new Date(ms + 8 * 3600e3);
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/* ---------- 綠界 CheckMacValue（https://developers.ecpay.com.tw/?p=2902 ） ---------- */
export async function checkMac(params, key, iv) {
  const keys = Object.keys(params).filter(k => k !== 'CheckMacValue')
    .sort((a, b) => { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; });
  const raw = 'HashKey=' + key + '&' + keys.map(k => k + '=' + params[k]).join('&') + '&HashIV=' + iv;
  const e = encodeURIComponent(raw).replace(/%20/g, '+').replace(/'/g, '%27').replace(/~/g, '%7e').toLowerCase();
  return (await sha256(e)).toUpperCase();
}
async function readForm(req) {
  const t = await req.text(); const o = {};
  for (const [k, v] of new URLSearchParams(t)) o[k] = v;
  return o;
}
async function verifyEcpay(env, p) {
  if (!p.CheckMacValue || p.MerchantID !== env.ECPAY_MERCHANT_ID) return false;
  return same(await checkMac(p, env.ECPAY_HASH_KEY, env.ECPAY_HASH_IV), String(p.CheckMacValue).toUpperCase());
}

/* ---------- 訂單、下載代碼 ---------- */
const getOrder = (env, id) => env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();
async function orderByKey(env, id, k) {
  if (!id || !k || !/^[A-Za-z0-9]{1,20}$/.test(id)) return null;
  const o = await getOrder(env, id);
  return o && same(o.k_hash, await sha256(k)) ? o : null;
}
// 下載代碼＝訂單編號.第幾代.簽章（伺服器密鑰算出來，資料庫不存原文）；重寄時「第幾代」加一，舊連結失效
const sig = (env, id, gen) => hmac(env.TOKEN_SECRET, id + '.' + gen).then(h => h.slice(0, 32));
async function dlUrl(env, origin, o) { return origin + '/dl/' + o.id + '.' + o.token_gen + '.' + (await sig(env, o.id, o.token_gen)); }
const days = env => +env.DOWNLOAD_DAYS || 7;
const times = env => +env.DOWNLOAD_TIMES || 5;

// 測試環境：測試特店金鑰是公開的，任何人都能偽造付款通知 → 只真的寄給負責人自己的信箱，其他的存進 outbox（不讓負責人的 Gmail 被拿來寄信給陌生人）
export const reallySend = (env, to) => !!env.MAIL_URL && (env.ECPAY_ENV === 'prod' || !!env.CONTACT_EMAIL && String(to).trim().toLowerCase() === String(env.CONTACT_EMAIL).trim().toLowerCase());
async function sendMail(env, to, subject, html) {
  try {
    if (!reallySend(env, to)) {
      await env.DB.prepare('INSERT INTO outbox(at,to_email,subject,html) VALUES(?,?,?,?)').bind(new Date().toISOString(), to, subject, html).run();
      return true;
    }
    const r = await fetch(env.MAIL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: env.MAIL_SECRET, to, subject, html }) });
    return r.ok && (await r.text()).trim() === 'ok';
  } catch (_) { return false; }
}
function mailHtml(env, origin, o, link) {
  return `<p>感謝購買《晚安王國》Windows 電腦版！</p>
<p>訂單編號：${esc(o.id)}</p>
<p><a href="${esc(link)}">按這裡下載安裝程式</a>（${days(env)} 天內有效、最多下載 ${times(env)} 次）</p>
<p><b>安裝只要 3 步：</b>①下載「${esc(env.FILE_KEY)}」②雙擊它，按「下一步」→「安裝」③桌面出現「晚安王國」圖示，點兩下就能玩。<br>
瀏覽器或 Windows 跳出藍色警告是正常的（我們是個人開發者，還沒買程式簽章），圖解教學：<a href="${esc(origin)}/help">安裝教學</a></p>
<p>換電腦時：在舊電腦的遊戲「設定」按「匯出存檔」，到新電腦裝好遊戲後按「匯入存檔」。<br>
連結過期或用完了：到 <a href="${esc(origin)}/resend">${esc(origin)}/resend</a> 輸入這個 email，會自動寄新的下載連結給你。</p>
<p>有任何問題，直接回覆這封信，或寫信到 ${esc(env.CONTACT_EMAIL)}，請附上訂單編號。</p>
<p>葉宸佑</p>`;
}

// 出貨：ReturnURL 和 /ecpay/result 共用。只有「這一次把待付款改成已付款」的那一次會產生連結、寄信。
async function ship(env, origin, p, ctx) {
  if (p.SimulatePaid === '1' && env.ECPAY_ENV !== 'stage') return false;   // 正式環境：後台模擬付款一律不出貨
  const o0 = await getOrder(env, p.MerchantTradeNo || '');
  if (!o0) { console.error('付款通知找不到訂單：' + p.MerchantTradeNo + '（綠界交易 ' + p.TradeNo + '）'); return false; }
  const r = await env.DB.prepare(`UPDATE orders SET status='paid', paid_at=?, trade_no=?, pay_type=?, simulate=?, token_expires=?
      WHERE id=? AND status IN ('pending','atm','failed') AND amount=?`)
    .bind(new Date().toISOString(), p.TradeNo || '', p.PaymentType || '', p.SimulatePaid === '1' ? 1 : 0, Date.now() + days(env) * 864e5,
      o0.id, parseInt(p.TradeAmt, 10)).run();
  if (!r.meta || !r.meta.changes) {   // 已經出過貨：什麼都不做；金額不對：記下來讓負責人在管理頁看到（買家付了錢卻沒拿到遊戲）
    if (o0.status !== 'paid') {
      console.error('付款沒有出貨：' + o0.id + ' 金額 ' + p.TradeAmt + '／訂單 ' + o0.amount + '／狀態 ' + o0.status);
      await env.DB.prepare('UPDATE orders SET note=? WHERE id=?').bind('收到付款通知但沒出貨：金額 ' + p.TradeAmt + '（訂單 ' + o0.amount + '）', o0.id).run();
    }
    return false;
  }
  const o = await getOrder(env, o0.id), link = await dlUrl(env, origin, o);
  const job = (async () => {   /* 寄信放到背景：不讓綠界和買家等 Gmail */
    const ok = await sendMail(env, o.email, '《晚安王國》電腦版下載連結（訂單 ' + o.id + '）', mailHtml(env, origin, o, link));
    await env.DB.prepare('UPDATE orders SET mail_status=? WHERE id=?').bind(ok ? 'sent' : 'failed', o.id).run();
  })();
  if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
  return true;
}
async function atmInfo(env, p) {
  if (p.RtnCode !== '2') return;
  await env.DB.prepare(`UPDATE orders SET status='atm', atm_bank=?, atm_account=?, atm_expire=? WHERE id=? AND status='pending'`)
    .bind(p.BankCode || '', p.vAccount || '', p.ExpireDate || '', p.MerchantTradeNo).run();
  /* 不寄繳費信：有人可以亂填別人的 email 在綠界取號，讓負責人的 Gmail 寄信給陌生人；繳費資訊顯示在付款完成頁（綠界的頁面也會顯示） */
}
// 換一組新的下載連結（舊的作廢、次數重算、重新算天數）並寄出：買家自己重寄（/resend）和管理頁共用
async function renewAndMail(env, origin, o) {
  await env.DB.prepare('UPDATE orders SET token_gen=token_gen+1, token_expires=?, dl_count=0, dl_bytes=0 WHERE id=?').bind(Date.now() + days(env) * 864e5, o.id).run();
  const n = await getOrder(env, o.id), link = await dlUrl(env, origin, n);
  const ok = await sendMail(env, n.email, '《晚安王國》電腦版新的下載連結（訂單 ' + n.id + '）', mailHtml(env, origin, n, link));
  await env.DB.prepare('UPDATE orders SET mail_status=? WHERE id=?').bind(ok ? 'sent' : 'failed', n.id).run();
  return { ok, link };
}

/* ---------- 設定檢查：金鑰沒設好、或照抄範本的 change-me，就什麼都不做（不然可以偽造付款或下載代碼） ---------- */
function configProblems(env) {
  const bad = [];
  for (const k of ['ECPAY_MERCHANT_ID', 'ECPAY_HASH_KEY', 'ECPAY_HASH_IV', 'GAME_URL', 'CONTACT_EMAIL', 'ITEM_NAME', 'FILE_KEY']) if (!env[k]) bad.push(k);
  if (!(parseInt(env.PRICE, 10) > 0)) bad.push('PRICE');
  if (!env.TOKEN_SECRET || env.TOKEN_SECRET.length < 24 || /change-me/i.test(env.TOKEN_SECRET)) bad.push('TOKEN_SECRET');
  if (env.ADMIN_PASSWORD && (env.ADMIN_PASSWORD.length < 12 || /change-me/i.test(env.ADMIN_PASSWORD))) bad.push('ADMIN_PASSWORD');
  if (env.ECPAY_ENV !== 'stage' && env.ECPAY_ENV !== 'prod') bad.push('ECPAY_ENV');
  // 正式環境還用著綠界公開的測試特店：一定是忘了換
  if (env.ECPAY_ENV === 'prod' && env.ECPAY_MERCHANT_ID === '3002607') bad.push('ECPAY_MERCHANT_ID');
  return bad;
}

/* ---------- 頁面 ---------- */
function page(env, title, body, hideTest = false) {
  const test = env.ECPAY_ENV === 'stage' && !hideTest ? '<div class="test">測試環境：用綠界的測試卡號付款，不會真的扣款；下載到的是測試用的假檔案。</div>' : '';
  return new Response(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title><style>
:root{--bg:#1d1a3f;--panel:#2a2550;--line:#4b4386;--gold:#ffe08a;--cream:#f6f0ff;--muted:#bdb4e6}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--cream);font:16px/1.7 "Noto Sans TC",system-ui,sans-serif}
main{max-width:640px;margin:0 auto;padding:24px 16px 48px}h1{color:var(--gold);font-size:26px;line-height:1.35;margin:8px 0 4px}
h2{color:var(--gold);font-size:18px;margin:24px 0 6px}p,li{color:var(--cream)}.muted{color:var(--muted);font-size:14px}a{color:var(--gold)}
.box{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;margin:16px 0}
.price{font-size:28px;font-weight:700;color:var(--gold)}label{display:block;margin:10px 0}
input[type=email],input[type=text],input[type=password]{width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);background:#151232;color:var(--cream);font-size:16px}
.consent{display:flex;gap:10px;align-items:flex-start;background:#3a2f6a;border:2px solid var(--gold);border-radius:10px;padding:12px}
.consent input{width:22px;height:22px;flex:none;margin-top:3px}
button,.btn{display:inline-block;background:var(--gold);color:#2b2a6b;border:0;border-radius:999px;padding:12px 28px;font-size:18px;font-weight:700;cursor:pointer;text-decoration:none}
button:disabled{opacity:.4;cursor:not-allowed}.err{color:#ff9b8a;font-weight:700}.test{background:#7a2e2e;color:#fff;text-align:center;padding:6px;font-size:14px}
.step{border:1px solid var(--line);border-radius:12px;padding:14px;margin:14px 0}.step h2{margin:0 0 8px}
.mock{border:1px solid #bbb;border-radius:8px;margin:10px 0;font-size:14px;overflow:hidden;max-width:460px;background:#fff;color:#222}.mock .bar{background:#f3f3f3;padding:6px 10px;color:#555;font-size:12px}.mock .in{padding:12px}
.ss{background:#0063b1;color:#fff}.ss .in{padding:16px}.ss h3{margin:0 0 8px;font-size:20px;font-weight:400}.hl{outline:3px solid #f5a623;outline-offset:2px;border-radius:3px}
.btn2{display:inline-block;border:1px solid #888;border-radius:4px;padding:4px 12px;margin:6px 6px 0 0;background:#fff;color:#222}.ss .btn2{background:#0063b1;color:#fff;border-color:#fff}
</style></head><body>${test}<main>${body}</main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

function buyPage(env, err = '', email = '', test = true) {
  const soon = env.ECPAY_ENV !== 'prod' && !test;   /* 測試環境：一般訪客只看得到介紹，不能付款（網址加 ?test=1 才能測） */
  return page(env, '購買《晚安王國》Windows 電腦版', `
<p class="muted"><a href="${esc(env.GAME_URL)}">← 先玩免費試玩（網頁版）</a></p>
<h1>晚安王國 Goodnight Kingdom<br><small>Windows 電腦版（下載版）</small></h1>
<p class="price">NT$${esc(env.PRICE)}</p>
<p>可愛風格的 2D 橫向射擊冒險：在夢裡把吵鬧的魔物「哄睡」，一路走到王國的城堡。十個世界和結局全部可以玩，買一次永久擁有，沒有其他付費、沒有廣告。可以一個人玩，也可以兩個人用同一台電腦玩（鍵盤或手把）；線上雙人要網路。</p>
<div class="box">
<h2>購買須知</h2>
<ul>
<li><b>系統需求</b>：Windows 10 或 11（64 位元），約 300 MB 硬碟空間（安裝程式約 110 MB）。目前沒有 Mac 版。</li>
<li><b>怎麼拿到遊戲</b>：付款成功後，付款完成頁會出現下載按鈕，同時寄到你填的 email。下載連結 ${esc(days(env))} 天內有效、最多下載 ${esc(times(env))} 次。</li>
<li><b>安裝</b>：下載安裝程式 → 雙擊 → 按「下一步」→「安裝」，桌面就會出現「晚安王國」圖示。瀏覽器或 Windows 跳出警告是正常的，請看 <a href="/help">安裝教學（有圖）</a>。</li>
<li><b>換電腦、電腦壞了</b>：到 <a href="/resend">重寄下載連結</a> 輸入購買時的 email，就會自動寄新的下載連結，不用等我們回信。進度用遊戲「設定」裡的「匯出存檔／匯入存檔」帶過去。</li>
<li><b>手機版是另一個商品</b>：iPhone 版請到 App Store 購買；這裡買的是 Windows 電腦版，不包含手機版。</li>
<li><b>付款方式</b>：綠界科技（信用卡）。我們不會看到、也不會保存你的卡號。</li>
<li><b>退款</b>：本商品是下載版數位內容，付款後立即提供下載，依《通訊交易解除權合理例外情事適用準則》第 2 條第 5 款，經你事先同意後，不適用七日解除權。若檔案損壞，或在符合系統需求的電腦上無法執行，請來信，我們會協助處理；無法解決時退款。</li>
<li><b>個人資料</b>：我們只收你填的 email（和綠界回傳的付款結果），用來寄下載連結、重寄連結、回覆你的問題與處理退款；不會給別人，也不會寄廣告。付款由綠界科技處理。訂單紀錄依稅法需要保存；想查詢或刪除你的資料，請寫信給我們。</li>
<li><b>購買與付款問題</b>：<a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>（葉宸佑）</li>
</ul>
</div>
${soon ? '<p class="err">即將開賣：準備中，開賣後就能在這裡購買。</p>' : ''}
<form method="post" action="/api/order" id="f"${soon ? ' hidden' : ''}>
${err ? `<p class="err">${esc(err)}</p>` : ''}
<label>收下載連結的 email<input type="email" name="email" required maxlength="200" autocomplete="email" value="${esc(email)}"></label>
<label class="consent"><input type="checkbox" name="consent" value="yes" id="c"><span><b>我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權</b></span></label>
<p><button type="submit" id="go" disabled>前往付款（綠界）</button></p>
</form>
<script>const c=document.getElementById('c'),g=document.getElementById('go'),u=()=>{g.disabled=!c.checked;};c.addEventListener('change',u);addEventListener('pageshow',u);u();</script>`, soon);
}

/* ---------- 安裝教學：用 HTML 畫示意圖，標明「示意圖」（照莫札特商店） ---------- */
function helpPage(env) {
  return page(env, '安裝教學', `<h1>安裝教學</h1>
<p class="muted">下面的畫面是示意圖，實際畫面可能因 Windows、瀏覽器版本略有不同。</p>
<div class="step"><h2>① 下載安裝程式</h2>
<p>在付款完成頁或信裡按「下載安裝程式」，會下載一個檔案：<b>${esc(env.FILE_KEY)}</b>（約 110 MB）。</p>
<p>如果瀏覽器說「<b>不常下載</b>」或「可能有害」：這是因為我們是個人開發者、下載的人還不多，不是病毒。</p>
<div class="mock"><div class="bar">Edge 瀏覽器右上角的「下載」（示意圖）</div><div class="in">${esc(env.FILE_KEY)} 通常不會下載。<br><span class="btn2 hl">⋯</span> → <span class="btn2 hl">保留</span> → <span class="btn2 hl">顯示更多 → 仍要保留</span></div></div>
<div class="mock"><div class="bar">Chrome 瀏覽器（示意圖）</div><div class="in">「這個檔案可能有害」<br><span class="btn2 hl">保留</span>（或在下載清單按「仍要下載」）</div></div>
</div>
<div class="step"><h2>② 雙擊安裝程式</h2>
<p>打開「下載」資料夾，雙擊 <b>${esc(env.FILE_KEY)}</b>。</p>
<p>如果跳出藍色的「<b>Windows 已保護您的電腦</b>」：</p>
<div class="mock ss"><div class="in"><h3>Windows 已保護您的電腦</h3>Microsoft Defender SmartScreen 已防止某個無法辨識的應用程式啟動……<br><u class="hl">其他資訊</u><br><br>（按了「其他資訊」之後，右下角會多一個按鈕）<br><span class="btn2 hl">仍要執行</span> <span class="btn2">不要執行</span></div></div>
<p>先按左邊的「<b>其他資訊</b>」，再按「<b>仍要執行</b>」。</p>
<p>接著按「<b>下一步</b>」→「<b>安裝</b>」→「<b>完成</b>」。不用改任何設定。</p>
</div>
<div class="step"><h2>③ 開始玩</h2>
<p>桌面和開始選單會出現「<b>晚安王國</b>」，點兩下就能玩。單人遊戲不用上網；線上雙人要網路。</p>
<p class="muted">F11 切換全螢幕，Alt+F4 離開。不想玩了：Windows「設定 → 應用程式」找「晚安王國」→ 解除安裝（存檔會留著，重新安裝還在）。</p>
</div>
<div class="step"><h2>常見問題</h2>
<p><b>下載連結過期、次數用完，或換了新電腦？</b>到 <a href="/resend">重寄下載連結</a> 輸入購買時的 email，會自動寄新的連結。</p>
<p><b>進度怎麼帶到新電腦？</b>舊電腦：遊戲「設定」→「匯出存檔」，存成一個小檔案；新電腦裝好後：「設定」→「匯入存檔」選那個檔案。</p>
<p><b>Mac 可以玩嗎？</b>目前只有 Windows 10／11（64 位元）。</p>
<p><b>安裝後打不開？</b>寫信到 ${esc(env.CONTACT_EMAIL)}，附上畫面截圖，我們會協助；無法解決時退款。</p>
</div>
<p><a href="/buy">← 回購買頁</a></p>`, true);
}

/* ---------- 買家自己重寄下載連結（2026-10-26 負責人：忘記連結不要變成負責人的工作） ----------
   輸入 email → 找這個 email 最近一筆已付款的訂單 → 換新連結（舊的作廢）寄到那個 email。
   不管有沒有找到都顯示同一句話（不讓人查出誰買過）；同一個 email 一小時最多 3 次、全站一小時最多 60 次（防亂按讓 Gmail 被拿來寄信）。 */
async function resend(env, req, origin) {
  const form = (msg = '', email = '') => page(env, '重寄下載連結', `<h1>重寄下載連結</h1>
<p>下載連結過期、次數用完、換了新電腦，或找不到當初的信？輸入購買時填的 email，我們會自動寄一個新的下載連結給你（舊的連結會作廢）。</p>
${msg}
<form method="post"><label>購買時填的 email<input type="email" name="email" required maxlength="200" autocomplete="email" value="${esc(email)}"></label>
<p><button type="submit">寄新的下載連結</button></p></form>
<p class="muted">幾分鐘內沒收到：看看「垃圾郵件」或「促銷內容」資料夾；還是沒有，請寫信到 <a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>。</p>
<p><a href="/buy">← 回購買頁</a>　<a href="/help">安裝教學</a></p>`, true);
  if (req.method !== 'POST') return form();
  const email = String((await readForm(req)).email || '').trim();
  if (!EMAIL_RE.test(email)) return form('<p class="err">email 格式看起來不對，請再檢查一次。</p>', email);
  const hourAgo = new Date(Date.now() - 3600e3).toISOString();
  const mine = await env.DB.prepare('SELECT COUNT(*) AS n FROM resends WHERE email=? AND at>?').bind(email.toLowerCase(), hourAgo).first();
  const all = await env.DB.prepare('SELECT COUNT(*) AS n FROM resends WHERE at>?').bind(hourAgo).first();
  if ((mine?.n ?? 0) >= 3 || (all?.n ?? 0) >= 60) return form('<p class="err">剛剛已經寄過了，請先看看信箱（包括垃圾郵件）；一小時後可以再試。</p>', email);
  await env.DB.prepare('INSERT INTO resends(email,at) VALUES(?,?)').bind(email.toLowerCase(), new Date().toISOString()).run();
  const o = await env.DB.prepare("SELECT * FROM orders WHERE lower(email)=? AND status='paid' ORDER BY paid_at DESC LIMIT 1").bind(email.toLowerCase()).first();
  if (o) await renewAndMail(env, origin, o);
  return form(`<p><b>如果這個 email 買過《晚安王國》電腦版，新的下載連結已經寄出了。</b>請到 ${esc(email)} 的信箱收信。</p>`, email);
}

/* ---------- 路由 ---------- */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), origin = url.origin, path = url.pathname;
    const bad = configProblems(env);
    if (bad.length) { console.error('設定未完成：' + bad.join(', ')); return new Response(path.startsWith('/ecpay/') ? '0|ConfigError' : '商店設定未完成，暫停營業。', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    try {
      if (path === '/' || path === '/buy') return buyPage(env, '', '', url.searchParams.get('test') === '1');
      if (path === '/help') return helpPage(env);
      if (path === '/resend') return resend(env, req, origin);

      if (path === '/api/order' && req.method === 'POST') {
        const f = await readForm(req), email = String(f.email || '').trim();
        if (f.consent !== 'yes') return buyPage(env, '請先勾選「我了解本商品為數位內容……」才能付款。', email);
        if (!EMAIL_RE.test(email)) return buyPage(env, 'email 格式看起來不對，請再檢查一次。', email);
        /* 防亂建單：同一個 email 一小時內最多 5 筆、全站 10 分鐘內最多 30 筆未付款（照莫札特商店） */
        const hourAgo = new Date(Date.now() - 3600e3).toISOString(), tenAgo = new Date(Date.now() - 600e3).toISOString();
        const mine = await env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE lower(email)=? AND created_at>?').bind(email.toLowerCase(), hourAgo).first();
        const all = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE status='pending' AND created_at>?").bind(tenAgo).first();
        if ((mine?.n ?? 0) >= 5 || (all?.n ?? 0) >= 30) return buyPage(env, '下單次數太多，請過一段時間再試；有問題請寫信給我們。', email);
        const d = new Date(Date.now() + 8 * 3600e3);
        const id = 'GK' + String(d.getUTCFullYear()).slice(2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + rand(6);
        const k = rand(32), now = new Date().toISOString(), amount = parseInt(env.PRICE, 10);
        await env.DB.prepare('INSERT INTO orders(id,k_hash,email,amount,status,consent_at,created_at,env) VALUES(?,?,?,?,?,?,?,?)')
          .bind(id, await sha256(k), email, amount, 'pending', now, now, env.ECPAY_ENV).run();
        const back = origin + '/ecpay/result?o=' + id + '&k=' + k;
        const p = {
          MerchantID: env.ECPAY_MERCHANT_ID, MerchantTradeNo: id, MerchantTradeDate: twDate(), PaymentType: 'aio',
          TotalAmount: String(amount), TradeDesc: '晚安王國電腦版', ItemName: env.ITEM_NAME,
          ReturnURL: origin + '/ecpay/return', ChoosePayment: env.CHOOSE_PAYMENT || 'Credit', EncryptType: '1',
          OrderResultURL: back, ClientBackURL: origin + (env.ECPAY_ENV === 'prod' ? '/buy' : '/buy?test=1'),
        };
        if (p.ChoosePayment === 'ATM' || p.ChoosePayment === 'ALL') { p.PaymentInfoURL = origin + '/ecpay/payinfo'; p.ClientRedirectURL = back; p.ExpireDate = '3'; }
        p.CheckMacValue = await checkMac(p, env.ECPAY_HASH_KEY, env.ECPAY_HASH_IV);
        const action = ECPAY_HOST[env.ECPAY_ENV === 'prod' ? 'prod' : 'stage'] + '/Cashier/AioCheckOut/V5';
        const inputs = Object.entries(p).map(([n, v]) => `<input type="hidden" name="${esc(n)}" value="${esc(v)}">`).join('');
        return page(env, '前往綠界付款……', `<p>正在前往綠界付款頁……</p>
<form method="post" action="${esc(action)}" id="ec">${inputs}<button type="submit">如果沒有自動前往，請按這裡</button></form>
<p class="muted">訂單編號：${esc(id)}。付款完成後會自動回到本站，下載連結也會寄到 ${esc(email)}。</p>
<script>document.getElementById('ec').submit();</script>`);
      }

      if (path === '/ecpay/return' && req.method === 'POST') {   // 綠界伺服器通知（付款結果）
        const p = await readForm(req);
        if (!(await verifyEcpay(env, p))) return new Response('0|CheckMacValue Error', { status: 400 });
        if (p.RtnCode === '1') await ship(env, origin, p, ctx);
        try { await env.DB.prepare('UPDATE orders SET return_at=? WHERE id=?').bind(new Date().toISOString(), p.MerchantTradeNo || '').run(); } catch (_) {}   /* 只是記錄綠界伺服器有連到本站（診斷用）：出錯也不能影響出貨 */
        return new Response('1|OK');
      }
      if (path === '/ecpay/payinfo' && req.method === 'POST') {  // ATM 取號
        const p = await readForm(req);
        if (!(await verifyEcpay(env, p))) return new Response('0|CheckMacValue Error', { status: 400 });
        await atmInfo(env, p);
        return new Response('1|OK');
      }
      if (path === '/ecpay/result') {   // 買家的瀏覽器回到本站（信用卡 OrderResultURL／ATM ClientRedirectURL）
        const id = url.searchParams.get('o'), k = url.searchParams.get('k');
        const o = await orderByKey(env, id, k);
        if (!o) return page(env, '找不到訂單', '<h1>找不到這筆訂單</h1><p>請檢查信箱裡的下載連結，或到 <a href="/resend">重寄下載連結</a>。</p>');
        if (req.method === 'POST') {
          const p = await readForm(req);
          if (p.MerchantTradeNo === id && await verifyEcpay(env, p)) {
            if (p.RtnCode === '1') await ship(env, origin, p, ctx);
            else if (p.RtnCode === '2') await atmInfo(env, p);
            else await env.DB.prepare("UPDATE orders SET status='failed' WHERE id=? AND status='pending'").bind(id).run();   /* 信用卡失敗：付款完成頁顯示「沒有成功」 */
          }
        }
        return Response.redirect(origin + '/thanks?o=' + encodeURIComponent(id) + '&k=' + encodeURIComponent(k), 303);
      }
      if (path === '/api/status') {
        const o = await orderByKey(env, url.searchParams.get('o'), url.searchParams.get('k'));
        if (!o) return Response.json({ error: 'not found' }, { status: 404 });
        const out = { status: o.status, id: o.id, email: o.email };
        if (o.status === 'paid') Object.assign(out, { link: await dlUrl(env, origin, o), expires: o.token_expires, left: Math.max(0, times(env) - o.dl_count), mail: o.mail_status });
        if (o.status === 'atm') Object.assign(out, { bank: o.atm_bank, account: o.atm_account, expire: o.atm_expire, amount: o.amount });
        return Response.json(out, { headers: { 'cache-control': 'no-store' } });
      }
      if (path === '/thanks') return thanksPage(env, url);
      if (path.startsWith('/dl/')) return download(env, req, path.slice(4));
      if (path === '/admin') return admin(env, req, origin);
      return page(env, '找不到網頁', '<h1>找不到這個網頁</h1><p><a href="/buy">回到購買頁</a></p>');
    } catch (e) {
      console.error(e);
      return page(env, '發生錯誤', `<h1>發生錯誤</h1><p>請稍後再試，或寫信到 <a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>。</p>`);
    }
  },
};

function thanksPage(env, url) {
  const o = url.searchParams.get('o') || '', k = url.searchParams.get('k') || '';
  if (!/^[A-Za-z0-9]{1,20}$/.test(o) || !/^[A-Za-z0-9]{32}$/.test(k)) return page(env, '找不到訂單', '<h1>找不到這筆訂單</h1><p>請檢查信箱裡的下載連結，或到 <a href="/resend">重寄下載連結</a>。</p>');
  const js = v => JSON.stringify(v).replace(/</g, '\\u003c');   /* 放進 <script> 的字串：不讓 </script> 提早結束 */
  return page(env, '付款完成', `<h1>謝謝你的購買</h1>
<p class="muted">訂單編號：${esc(o)}</p>
<div class="box" id="s"><p>正在確認付款……（通常幾秒鐘，請不要關掉這一頁）</p></div>
<p class="muted">下載連結也會寄到你的信箱；沒收到的話，請看看「垃圾郵件」或「促銷內容」資料夾。之後連結過期或換電腦，到 <a href="/resend">重寄下載連結</a> 就好。有問題請寫信到 <a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>。</p>
<script>
const o=${js(o)}, k=${js(k)}, box=document.getElementById('s'); let n=0;
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function poll(){ n++;
  try{ const r=await fetch('/api/status?o='+encodeURIComponent(o)+'&k='+encodeURIComponent(k),{cache:'no-store'}); const j=await r.json();
    if(j.status==='paid'){ box.innerHTML='<p><b>付款成功！</b></p><p><a class="btn" href="'+e(j.link)+'">下載安裝程式</a></p><p class="muted">這個連結到 '+new Date(j.expires).toLocaleString('zh-TW')+' 前有效，還可以下載 '+j.left+' 次。下載後雙擊安裝程式，按「下一步」→「安裝」，桌面就會出現「晚安王國」。跳出警告時請看 <a href="/help" target="_blank">安裝教學（有圖）</a>。</p>'; return; }
    if(j.status==='atm'){ box.innerHTML='<p><b>已取得 ATM 繳費帳號</b></p><p>請在 '+e(j.expire)+' 以前轉帳 NT$'+e(j.amount)+'。<br>銀行代碼：'+e(j.bank)+'<br>帳號：'+e(j.account)+'</p><p class="muted">轉帳完成後這一頁會自動出現下載按鈕，也會寄信給你。</p>'; }
    if(j.status==='failed'){ box.innerHTML='<p><b>付款沒有成功</b>，沒有扣款。</p><p><a class="btn" href="/buy">回到購買頁重新購買</a></p>'; return; }
    if(j.error){ box.innerHTML='<p>找不到這筆訂單，請檢查信箱或寫信給我們。</p>'; return; }
  }catch(_){}
  if(n<600) setTimeout(poll, n<20?3000:15000);
}
poll();
</script>`);
}

async function download(env, req, token) {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });   /* 信箱的連結掃描常用 HEAD 先看：不扣次數 */
  const m = /^([A-Za-z0-9]{1,20})\.(\d{1,6})\.([0-9a-f]{32})$/.exec(token);
  const sorry = msg => page(env, '無法下載', `<h1>無法下載</h1><p>${msg}</p><p>到 <a href="/resend">重寄下載連結</a> 輸入購買時的 email，就會收到新的連結。還是不行，請寫信到 <a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>，附上訂單編號。</p>`);
  if (!m || !same(m[3], await sig(env, m[1], m[2]))) return sorry('這個下載連結不正確。');
  const o = await getOrder(env, m[1]);
  if (!o || o.status !== 'paid' || String(o.token_gen) !== m[2]) return sorry('這個下載連結已經失效（可能已經寄了新的連結給你）。');
  if (Date.now() > o.token_expires) return sorry('這個下載連結已經過期。');
  const head = await env.FILES.head(env.FILE_KEY);
  if (!head) return sorry('檔案暫時找不到。');
  if (env.ECPAY_ENV === 'stage' && head.size > 20 * 1024 * 1024) return sorry('測試環境不提供正式檔案。');   /* 測試特店的金鑰是公開的，任何人都能偽造付款通知：測試環境只能放假檔 */
  if (o.env !== 'prod' && env.ECPAY_ENV === 'prod') return sorry('這是測試環境的訂單，不能下載正式檔案。');   /* 換正式後，以前測試環境「付款」的訂單不能拿到真的遊戲 */
  const size = head.size, n = times(env);
  let start = 0, end = size - 1, partial = false;
  const rh = req.headers.get('range');
  if (rh) {
    const r = /^bytes=(\d*)-(\d*)$/.exec(rh.trim());
    if (!r || (r[1] === '' && r[2] === '')) return new Response('bad range', { status: 416, headers: { 'content-range': 'bytes */' + size } });
    if (r[1] === '') { start = Math.max(0, size - parseInt(r[2], 10)); } else { start = parseInt(r[1], 10); if (r[2] !== '') end = Math.min(size - 1, parseInt(r[2], 10)); }
    if (start > end || start >= size) return new Response('bad range', { status: 416, headers: { 'content-range': 'bytes */' + size } });
    partial = true;
  }
  const len = end - start + 1, fresh = start === 0 ? 1 : 0;   // 從頭開始的請求才算一次下載；總共送出的量另外有上限（檔案大小 × 次數＋1）
  const u = await env.DB.prepare(`UPDATE orders SET dl_count=dl_count+?, dl_bytes=dl_bytes+? WHERE id=? AND token_gen=? AND status='paid' AND token_expires>? AND dl_count+?<=? AND dl_bytes+?<=?`)
    .bind(fresh, len, o.id, o.token_gen, Date.now(), fresh, n, len, size * (n + 1)).run();
  if (!u.meta || !u.meta.changes) return sorry(`這個下載連結已經下載 ${n} 次了。`);
  const obj = await env.FILES.get(env.FILE_KEY, partial ? { range: { offset: start, length: len } } : undefined);
  if (!obj) return sorry('檔案暫時找不到。');
  const h = new Headers({ 'content-type': 'application/octet-stream', 'content-length': String(len), 'accept-ranges': 'bytes',
    'content-disposition': 'attachment; filename="' + env.FILE_KEY + '"', 'cache-control': 'no-store' });
  if (partial) h.set('content-range', `bytes ${start}-${end}/${size}`);
  return new Response(obj.body, { status: partial ? 206 : 200, headers: h });
}

async function admin(env, req, origin) {
  const form = (msg = '', q = '') => page(env, '管理：查訂單、重寄下載連結', `<h1>查訂單、重寄下載連結</h1>${msg}
<form method="post"><label>管理密碼<input type="password" name="pw" required autocomplete="current-password"></label>
<label>訂單編號或 email<input type="text" name="q" value="${esc(q)}" required></label>
<label><input type="checkbox" name="send" value="yes"> 產生新的連結並寄出（舊連結作廢、次數重算；只能用訂單編號）</label>
<p><button type="submit">查詢</button></p></form>`, true);
  if (req.method !== 'POST') return form();
  const f = await readForm(req);
  if (!env.ADMIN_PASSWORD || !same(await sha256(f.pw || ''), await sha256(env.ADMIN_PASSWORD))) return form('<p class="err">管理密碼不對。</p>');
  const q = String(f.q || '').trim();
  const rows = (await env.DB.prepare('SELECT * FROM orders WHERE id=? OR lower(email)=? ORDER BY created_at DESC LIMIT 20').bind(q, q.toLowerCase()).all()).results || [];
  if (!rows.length) return form('<p class="err">找不到訂單。</p>', q);
  let msg = '<div class="box"><ul>' + rows.map(o => `<li>${esc(o.id)}｜${esc(o.email)}｜${esc(o.status)}｜下載 ${o.dl_count} 次｜信：${esc(o.mail_status || '')}${o.simulate ? '｜模擬付款' : ''}${o.env !== 'prod' ? '｜測試環境' : ''}${o.note ? '｜<span class="err">' + esc(o.note) + '</span>' : ''}</li>`).join('') + '</ul></div>';
  if (f.send === 'yes') {
    const o = rows.find(x => x.id === q && x.status === 'paid');
    if (!o) msg += rows.some(x => x.id === q) ? '<p class="err">這筆訂單還沒付款，不能寄下載連結。</p>' : '<p class="err">重寄請輸入「訂單編號」（上面列表裡的 GK 開頭那一串）。</p>';
    else {
      const { ok, link } = await renewAndMail(env, origin, o);
      msg += `<p>${ok ? '已寄出' : '<span class="err">寄信失敗</span>'}新的連結（訂單 ${esc(o.id)}）：<br><a href="${esc(link)}">${esc(link)}</a></p>`;
    }
  }
  return form(msg, q);
}
