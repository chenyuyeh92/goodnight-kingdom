// 晚安王國「網頁版完整版」的小商店（Cloudflare Worker）。只給網頁版用：App 版一律用 Apple／Google 的付款（Apple 3.1.1），App 裡不會出現這裡的網址。
// 寫法、綠界規定與踩過的坑，跟音樂家的人生電腦版商店一樣（music-game 專案 apps/mozart-shop、docs/musician-life/desktop-sales.md）；設計見 shop/README.md。
// 網址：/buy 購買頁 → POST /api/order 建單並轉到綠界 → 綠界通知 /ecpay/return（伺服器）、/ecpay/payinfo（ATM 取號）
//      → 買家回到 /ecpay/result → /thanks（每幾秒問 /api/status；付款成功顯示解鎖碼和「回到遊戲」）
//      → 遊戲（網頁版）POST /api/redeem 檢查解鎖碼；/admin 給負責人查訂單、重寄解鎖碼
// 金鑰都從 env 讀（本機 .dev.vars；正式由負責人用 wrangler secret put 自己輸入）：
//   ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV、TOKEN_SECRET、ADMIN_PASSWORD、MAIL_URL、MAIL_SECRET

const ECPAY_HOST = { stage: 'https://payment-stage.ecpay.com.tw', prod: 'https://payment.ecpay.com.tw' };
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function hmacBytes(key, s) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(s)));
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

/* ---------- 訂單、解鎖碼 ---------- */
const getOrder = (env, id) => env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();
async function orderByKey(env, id, k) {
  if (!id || !k || !/^[A-Za-z0-9]{1,20}$/.test(id)) return null;
  const o = await getOrder(env, id);
  return o && same(o.k_hash, await sha256(k)) ? o : null;
}
// 解鎖碼：12 個字（大寫英文＋數字，去掉容易看錯的 I、O、0、1），由伺服器密鑰和「訂單編號.第幾代」算出來；資料庫只存雜湊。
// 重寄時可以換新碼（第幾代加一），舊碼就失效。
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function unlockCode(env, id, gen) {
  const b = await hmacBytes(env.TOKEN_SECRET, 'unlock.' + id + '.' + gen);
  let s = ''; for (let i = 0; i < 12; i++) s += CODE_ABC[b[i] % 32];
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
}
// 玩家輸入的碼：大小寫、空白、橫線都不管；容易看錯的 O→0 不換（解鎖碼裡本來就沒有）
export const normalizeCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const codeHash = code => sha256('gk-unlock:' + normalizeCode(code));

// 測試環境：測試特店金鑰是公開的，任何人都能偽造付款通知 → 只真的寄給負責人自己的信箱，其他的存進 outbox（不讓負責人的 Gmail 被拿來寄信給陌生人）
export const reallySend = (env, to) => !!env.MAIL_URL && (env.ECPAY_ENV === 'prod' || String(to).trim().toLowerCase() === String(env.CONTACT_EMAIL).trim().toLowerCase());
async function sendMail(env, to, subject, html) {
  try {
    if (!reallySend(env, to)) {   // 還沒設寄信網址（本機測試、或負責人還沒設定）：信放進 outbox 表
      await env.DB.prepare('INSERT INTO outbox(at,to_email,subject,html) VALUES(?,?,?,?)').bind(new Date().toISOString(), to, subject, html).run();
      return true;
    }
    const r = await fetch(env.MAIL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: env.MAIL_SECRET, to, subject, html }) });
    return r.ok && (await r.text()).trim() === 'ok';
  } catch (_) { return false; }
}
const gameLink = (env, code) => env.GAME_URL + '#unlock=' + normalizeCode(code);
function mailHtml(env, o, code) {
  return `<p>感謝購買《晚安王國》網頁版完整版！</p>
<p>訂單編號：${esc(o.id)}</p>
<p>你的解鎖碼：<b style="font-size:20px;letter-spacing:2px">${esc(code)}</b></p>
<p><a href="${esc(gameLink(env, code))}">按這裡打開遊戲並自動解鎖</a></p>
<p>換一台電腦、手機或瀏覽器時：打開遊戲 → 開始遊戲 → 切到世界 4 → 按「輸入解鎖碼」，輸入上面的解鎖碼就好。<br>
請不要清除瀏覽器的網站資料；清掉的話，再輸入一次解鎖碼就能恢復。</p>
<p>網頁版完整版不包含 App 版（iPhone、iPad）；App 版請在 App 裡購買。</p>
<p>有任何問題，直接回覆這封信，或寫信到 ${esc(env.CONTACT_EMAIL)}，請附上訂單編號。</p>
<p>葉宸佑</p>`;
}

// 出貨：ReturnURL 和 /ecpay/result 共用。只有「這一次把待付款改成已付款」的那一次會產生解鎖碼、寄信。
async function ship(env, p, ctx) {
  if (p.SimulatePaid === '1' && env.ECPAY_ENV !== 'stage') return false;   // 正式環境：後台模擬付款一律不出貨
  const o0 = await getOrder(env, p.MerchantTradeNo || '');
  if (!o0) { console.error('付款通知找不到訂單：' + p.MerchantTradeNo + '（綠界交易 ' + p.TradeNo + '）'); return false; }
  const code = await unlockCode(env, o0.id, o0.code_gen);
  const r = await env.DB.prepare(`UPDATE orders SET status='paid', paid_at=?, trade_no=?, pay_type=?, simulate=?, code_hash=?
      WHERE id=? AND status IN ('pending','atm','failed') AND amount=?`)
    .bind(new Date().toISOString(), p.TradeNo || '', p.PaymentType || '', p.SimulatePaid === '1' ? 1 : 0, await codeHash(code),
      o0.id, parseInt(p.TradeAmt, 10)).run();
  if (!r.meta || !r.meta.changes) {   // 已經出過貨：什麼都不做；金額不對：記下來讓負責人在管理頁看到（買家付了錢卻沒拿到碼）
    if (o0.status !== 'paid') {
      console.error('付款沒有出貨：' + o0.id + ' 金額 ' + p.TradeAmt + '／訂單 ' + o0.amount + '／狀態 ' + o0.status);
      await env.DB.prepare('UPDATE orders SET note=? WHERE id=?').bind('收到付款通知但沒出貨：金額 ' + p.TradeAmt + '（訂單 ' + o0.amount + '）', o0.id).run();
    }
    return false;
  }
  const job = (async () => {   /* 寄信放到背景：不讓綠界和買家等 Gmail */
    const ok = await sendMail(env, o0.email, '《晚安王國》網頁版完整版解鎖碼（訂單 ' + o0.id + '）', mailHtml(env, o0, code));
    await env.DB.prepare('UPDATE orders SET mail_status=? WHERE id=?').bind(ok ? 'sent' : 'failed', o0.id).run();
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

/* ---------- 遊戲來問解鎖碼（跨網域：只接受 GAME_ORIGINS 列出的網址） ---------- */
function cors(env, req) {
  const origin = req.headers.get('origin') || '';
  const allowed = String(env.GAME_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'origin' } : {};
}
async function redeem(env, req) {
  const h = { ...cors(env, req), 'cache-control': 'no-store' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return Response.json({ ok: false, error: 'method' }, { status: 405, headers: h });
  let body = {}; try { body = JSON.parse(await req.text()) || {}; } catch (_) {}
  const c = normalizeCode(body.code);
  if (c.length !== 12) return Response.json({ ok: false, error: 'format' }, { headers: h });
  const max = +env.MAX_DEVICES || 20;
  const hash = await codeHash(c);
  // 一句就完成「找到已付款的訂單＋次數加一（沒超過上限）」：不會兩邊同時按而多算或少算
  const u = await env.DB.prepare(`UPDATE orders SET activations=activations+1 WHERE code_hash=? AND status='paid' AND activations<?`).bind(hash, max).run();
  const o = await env.DB.prepare('SELECT id, status, env, activations FROM orders WHERE code_hash=?').bind(hash).first();
  if (!o || o.status !== 'paid') return Response.json({ ok: false, error: 'notfound' }, { headers: h });
  if (!u.meta || !u.meta.changes) return Response.json({ ok: false, error: 'limit' }, { headers: h });
  // 測試環境（綠界測試特店）買到的碼：遊戲只在這一次打開時解鎖，不存起來（測試特店的金鑰是公開的，任何人都能偽造付款）
  return Response.json({ ok: true, stage: o.env !== 'prod' }, { headers: h });
}

/* ---------- 設定檢查：金鑰沒設好、或照抄範本的 change-me，就什麼都不做（不然可以偽造付款或解鎖碼） ---------- */
function configProblems(env) {
  const bad = [];
  for (const k of ['ECPAY_MERCHANT_ID', 'ECPAY_HASH_KEY', 'ECPAY_HASH_IV', 'GAME_URL', 'GAME_ORIGINS', 'CONTACT_EMAIL', 'ITEM_NAME']) if (!env[k]) bad.push(k);
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
  const test = env.ECPAY_ENV === 'stage' && !hideTest ? '<div class="test">測試環境：用綠界的測試卡號付款，不會真的扣款；買到的解鎖碼只在當次有效。</div>' : '';
  return new Response(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title><style>
:root{--bg:#1d1a3f;--panel:#2a2550;--line:#4b4386;--gold:#ffe08a;--pink:#ff9fc4;--cream:#f6f0ff;--muted:#bdb4e6}
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
.code{font-size:28px;font-weight:700;letter-spacing:3px;color:var(--gold);user-select:all;word-break:break-all}
</style></head><body>${test}<main>${body}</main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

function buyPage(env, err = '', email = '', test = true) {
  const soon = env.ECPAY_ENV !== 'prod' && !test;   /* 測試環境：一般訪客只看得到介紹，不能付款（網址加 ?test=1 才能測） */
  const max = +env.MAX_DEVICES || 20;
  return page(env, '購買《晚安王國》網頁版完整版', `
<p class="muted"><a href="${esc(env.GAME_URL)}">← 回到遊戲</a></p>
<h1>晚安王國 Goodnight Kingdom<br><small>網頁版 完整版</small></h1>
<p class="price">NT$${esc(env.PRICE)}</p>
<p>可愛風格的 2D 橫向射擊冒險：在夢裡把吵鬧的魔物「哄睡」，一路走到王國的城堡。世界 1–3 免費玩；完整版解鎖世界 4–10 和結局，買一次永久遊玩，沒有其他付費、沒有廣告。</p>
<div class="box">
<h2>購買須知</h2>
<ul>
<li><b>怎麼解鎖</b>：付款成功後，付款完成頁會顯示「解鎖碼」和「回到遊戲並解鎖」按鈕，解鎖碼也會寄到你填的 email。</li>
<li><b>換裝置</b>：在另一台電腦、手機或瀏覽器打開遊戲，按「輸入解鎖碼」就能解鎖（同一個解鎖碼最多 ${esc(max)} 台裝置）。</li>
<li><b>網頁版和 App 版是不同的商品</b>：這裡買的是網頁版（用瀏覽器玩），不包含 iPhone、iPad、Android 的 App 版；App 版請在 App 裡購買。</li>
<li><b>付款方式</b>：綠界科技（信用卡）。我們不會看到、也不會保存你的卡號。</li>
<li><b>退款</b>：本商品是數位內容，付款後立即提供，依《通訊交易解除權合理例外情事適用準則》第 2 條第 5 款，經你事先同意後，不適用七日解除權。若解鎖碼無法使用，請來信，我們會協助處理；無法解決時退款。</li>
<li><b>購買與付款問題</b>：<a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>（葉宸佑）</li>
</ul>
</div>
${soon ? '<p class="err">即將開賣：準備中，開賣後就能在這裡購買。</p>' : ''}
<form method="post" action="/api/order" id="f"${soon ? ' hidden' : ''}>
${err ? `<p class="err">${esc(err)}</p>` : ''}
<label>收解鎖碼的 email<input type="email" name="email" required maxlength="200" autocomplete="email" value="${esc(email)}"></label>
<label class="consent"><input type="checkbox" name="consent" value="yes" id="c"><span><b>我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權</b></span></label>
<p><button type="submit" id="go" disabled>前往付款（綠界）</button></p>
</form>
<script>const c=document.getElementById('c'),g=document.getElementById('go'),u=()=>{g.disabled=!c.checked;};c.addEventListener('change',u);addEventListener('pageshow',u);u();</script>`, soon);
}

/* ---------- 路由 ---------- */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), origin = url.origin, path = url.pathname;
    const bad = configProblems(env);
    if (bad.length) { console.error('設定未完成：' + bad.join(', ')); return new Response(path.startsWith('/ecpay/') ? '0|ConfigError' : '商店設定未完成，暫停營業。', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    try {
      if (path === '/' || path === '/buy') return buyPage(env, '', '', url.searchParams.get('test') === '1');

      if (path === '/api/order' && req.method === 'POST') {
        const f = await readForm(req), email = String(f.email || '').trim();
        if (f.consent !== 'yes') return buyPage(env, '請先勾選「我了解本商品為數位內容……」才能付款。', email);
        if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return buyPage(env, 'email 格式看起來不對，請再檢查一次。', email);
        const d = new Date(Date.now() + 8 * 3600e3);
        const id = 'GK' + String(d.getUTCFullYear()).slice(2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + rand(6);
        const k = rand(32), now = new Date().toISOString(), amount = parseInt(env.PRICE, 10);
        await env.DB.prepare('INSERT INTO orders(id,k_hash,email,amount,status,consent_at,created_at,env) VALUES(?,?,?,?,?,?,?,?)')
          .bind(id, await sha256(k), email, amount, 'pending', now, now, env.ECPAY_ENV).run();
        const back = origin + '/ecpay/result?o=' + id + '&k=' + k;
        const p = {
          MerchantID: env.ECPAY_MERCHANT_ID, MerchantTradeNo: id, MerchantTradeDate: twDate(), PaymentType: 'aio',
          TotalAmount: String(amount), TradeDesc: '晚安王國網頁版完整版', ItemName: env.ITEM_NAME,
          ReturnURL: origin + '/ecpay/return', ChoosePayment: env.CHOOSE_PAYMENT || 'Credit', EncryptType: '1',
          OrderResultURL: back, ClientBackURL: origin + (env.ECPAY_ENV === 'prod' ? '/buy' : '/buy?test=1'),
        };
        if (p.ChoosePayment === 'ATM' || p.ChoosePayment === 'ALL') { p.PaymentInfoURL = origin + '/ecpay/payinfo'; p.ClientRedirectURL = back; p.ExpireDate = '3'; }
        p.CheckMacValue = await checkMac(p, env.ECPAY_HASH_KEY, env.ECPAY_HASH_IV);
        const action = ECPAY_HOST[env.ECPAY_ENV === 'prod' ? 'prod' : 'stage'] + '/Cashier/AioCheckOut/V5';
        const inputs = Object.entries(p).map(([n, v]) => `<input type="hidden" name="${esc(n)}" value="${esc(v)}">`).join('');
        return page(env, '前往綠界付款……', `<p>正在前往綠界付款頁……</p>
<form method="post" action="${esc(action)}" id="ec">${inputs}<button type="submit">如果沒有自動前往，請按這裡</button></form>
<p class="muted">訂單編號：${esc(id)}。付款完成後會自動回到本站，解鎖碼也會寄到 ${esc(email)}。</p>
<script>document.getElementById('ec').submit();</script>`);
      }

      if (path === '/ecpay/return' && req.method === 'POST') {   // 綠界伺服器通知（付款結果）
        const p = await readForm(req);
        if (!(await verifyEcpay(env, p))) return new Response('0|CheckMacValue Error', { status: 400 });
        if (p.RtnCode === '1') await ship(env, p, ctx);
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
        if (!o) return page(env, '找不到訂單', '<h1>找不到這筆訂單</h1><p>請檢查信箱裡的解鎖碼，或寫信給我們並附上訂單編號。</p>');
        if (req.method === 'POST') {
          const p = await readForm(req);
          if (p.MerchantTradeNo === id && await verifyEcpay(env, p)) {
            if (p.RtnCode === '1') await ship(env, p, ctx);
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
        if (o.status === 'paid') { const code = await unlockCode(env, o.id, o.code_gen); Object.assign(out, { code, link: gameLink(env, code), mail: o.mail_status }); }
        if (o.status === 'atm') Object.assign(out, { bank: o.atm_bank, account: o.atm_account, expire: o.atm_expire, amount: o.amount });
        return Response.json(out, { headers: { 'cache-control': 'no-store' } });
      }
      if (path === '/api/redeem') return redeem(env, req);
      if (path === '/thanks') return thanksPage(env, url);
      if (path === '/admin') return admin(env, req);
      return page(env, '找不到網頁', '<h1>找不到這個網頁</h1><p><a href="/buy">回到購買頁</a></p>');
    } catch (e) {
      console.error(e);
      return page(env, '發生錯誤', `<h1>發生錯誤</h1><p>請稍後再試，或寫信到 <a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>。</p>`);
    }
  },
};

function thanksPage(env, url) {
  const o = url.searchParams.get('o') || '', k = url.searchParams.get('k') || '';
  if (!/^[A-Za-z0-9]{1,20}$/.test(o) || !/^[A-Za-z0-9]{32}$/.test(k)) return page(env, '找不到訂單', '<h1>找不到這筆訂單</h1><p>請檢查信箱裡的解鎖碼，或寫信給我們並附上訂單編號。</p>');
  const js = v => JSON.stringify(v).replace(/</g, '\\u003c');   /* 放進 <script> 的字串：不讓 </script> 提早結束 */
  return page(env, '付款完成', `<h1>謝謝你的購買</h1>
<p class="muted">訂單編號：${esc(o)}</p>
<div class="box" id="s"><p>正在確認付款……（通常幾秒鐘，請不要關掉這一頁）</p></div>
<p class="muted">解鎖碼也會寄到你的信箱；沒收到的話，請看看「垃圾郵件」或「促銷內容」資料夾。有問題請寫信到 <a href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>。</p>
<script>
const o=${js(o)}, k=${js(k)}, box=document.getElementById('s'); let n=0;
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function poll(){ n++;
  try{ const r=await fetch('/api/status?o='+encodeURIComponent(o)+'&k='+encodeURIComponent(k),{cache:'no-store'}); const j=await r.json();
    if(j.status==='paid'){ box.innerHTML='<p><b>付款成功！</b>你的解鎖碼：</p><p class="code">'+e(j.code)+'</p><p><a class="btn" id="back" href="'+e(j.link)+'">回到遊戲並解鎖</a></p><p class="muted">請把解鎖碼記下來（也會寄到信箱）。換另一台裝置或瀏覽器時，在遊戲的世界 4 按「輸入解鎖碼」就能解鎖。</p>'; return; }
    if(j.status==='atm'){ box.innerHTML='<p><b>已取得 ATM 繳費帳號</b></p><p>請在 '+e(j.expire)+' 以前轉帳 NT$'+e(j.amount)+'。<br>銀行代碼：'+e(j.bank)+'<br>帳號：'+e(j.account)+'</p><p class="muted">轉帳完成後這一頁會自動出現解鎖碼，也會寄信給你。</p>'; }
    if(j.status==='failed'){ box.innerHTML='<p><b>付款沒有成功</b>，沒有扣款。</p><p><a class="btn" href="/buy">回到購買頁重新購買</a></p>'; return; }
    if(j.error){ box.innerHTML='<p>找不到這筆訂單，請檢查信箱或寫信給我們。</p>'; return; }
  }catch(_){}
  if(n<600) setTimeout(poll, n<20?3000:15000);
}
poll();
</script>`);
}

async function admin(env, req) {
  const form = (msg = '', q = '') => page(env, '管理：查訂單、重寄解鎖碼', `<h1>查訂單、重寄解鎖碼</h1>${msg}
<form method="post"><label>管理密碼<input type="password" name="pw" required autocomplete="current-password"></label>
<label>訂單編號或 email<input type="text" name="q" value="${esc(q)}" required></label>
<label><input type="checkbox" name="send" value="yes"> 重寄解鎖碼（只能用訂單編號）</label>
<label><input type="checkbox" name="renew" value="yes"> 換一組新的解鎖碼（舊的作廢、裝置數重算；解鎖碼外流時用）</label>
<p><button type="submit">查詢</button></p></form>`);
  if (req.method !== 'POST') return form();
  const f = await readForm(req);
  if (!env.ADMIN_PASSWORD || !same(await sha256(f.pw || ''), await sha256(env.ADMIN_PASSWORD))) return form('<p class="err">管理密碼不對。</p>');
  const q = String(f.q || '').trim();
  const rows = (await env.DB.prepare('SELECT * FROM orders WHERE id=? OR email=? ORDER BY created_at DESC LIMIT 20').bind(q, q).all()).results || [];
  if (!rows.length) return form('<p class="err">找不到訂單。</p>', q);
  let msg = '<div class="box"><ul>' + rows.map(o => `<li>${esc(o.id)}｜${esc(o.email)}｜${esc(o.status)}｜已解鎖 ${o.activations} 台｜信：${esc(o.mail_status || '')}${o.simulate ? '｜模擬付款' : ''}${o.env !== 'prod' ? '｜測試環境' : ''}${o.note ? '｜<span class="err">' + esc(o.note) + '</span>' : ''}</li>`).join('') + '</ul></div>';
  if (f.send === 'yes' || f.renew === 'yes') {
    let o = rows.find(x => x.id === q && x.status === 'paid');
    if (!o) msg += rows.some(x => x.id === q) ? '<p class="err">這筆訂單還沒付款，不能寄解鎖碼。</p>' : '<p class="err">請輸入「訂單編號」（上面列表裡的 GK 開頭那一串）。</p>';
    else {
      if (f.renew === 'yes') {
        const code = await unlockCode(env, o.id, o.code_gen + 1);
        await env.DB.prepare('UPDATE orders SET code_gen=code_gen+1, code_hash=?, activations=0 WHERE id=?').bind(await codeHash(code), o.id).run();
        o = await getOrder(env, o.id);
      }
      const code = await unlockCode(env, o.id, o.code_gen);
      const ok = await sendMail(env, o.email, '《晚安王國》網頁版完整版解鎖碼（訂單 ' + o.id + '）', mailHtml(env, o, code));
      await env.DB.prepare('UPDATE orders SET mail_status=? WHERE id=?').bind(ok ? 'sent' : 'failed', o.id).run();
      msg += `<p>${ok ? '已寄出' : '<span class="err">寄信失敗</span>'}解鎖碼（訂單 ${esc(o.id)}）：<span class="code">${esc(code)}</span></p>`;
    }
  }
  return form(msg, q);
}
