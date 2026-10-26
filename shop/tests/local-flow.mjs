// 小商店本機完整流程測試：先在 shop/ 跑 `npm run dev`（wrangler dev，埠 8789），再跑 `npm test`
// 模擬綠界送來的通知（用綠界官方公開的測試特店 HashKey／HashIV 算檢查碼），測：建單、同意框、檢查碼、出貨只一次、狀態查詢要訂單密碼、
// 解鎖碼（遊戲來問、跨網域、裝置上限、測試環境標記）、ATM 取號＋測試環境模擬付款、金額不對不出貨、管理頁換新碼。
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:8789';
const GAME = 'http://localhost:5173';
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = 'pwFHCqoQZGmho4w6', IV = 'EkRm7iFT261dpevs', MID = '3002607';
const vars = Object.fromEntries(fs.readFileSync(path.join(DIR, '.dev.vars'), 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
// 查資料庫（sql）要好幾秒，回來時舊的連線可能已被 wrangler dev 關掉（ECONNRESET）：連線錯誤重試一次
const rawFetch = globalThis.fetch;
globalThis.fetch = async (...a) => { try { return await rawFetch(...a); } catch (e) { if (e.cause?.code !== 'ECONNRESET') throw e; return rawFetch(...a); } };
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };

function cmv(p) {
  const keys = Object.keys(p).filter(k => k !== 'CheckMacValue').sort((a, b) => { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; });
  const raw = 'HashKey=' + KEY + '&' + keys.map(k => k + '=' + p[k]).join('&') + '&HashIV=' + IV;
  const e = encodeURIComponent(raw).replace(/%20/g, '+').replace(/'/g, '%27').replace(/~/g, '%7e').toLowerCase();
  return crypto.createHash('sha256').update(e).digest('hex').toUpperCase();
}
const form = o => new URLSearchParams(o).toString();
const post = (p, body, extra = {}) => fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, redirect: 'manual', ...extra });
// 直接查本機資料庫（Windows 上 npx 要經過 shell，SQL 有空格會被拆開 → 寫成暫存檔再用 --file）
function sql(q) {
  const f = path.join(os.tmpdir(), 'goodnight-shop-test-' + process.pid + '.sql'); fs.writeFileSync(f, q);
  const out = execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['wrangler', 'd1', 'execute', 'goodnight-shop', '--local', '--json', '--file', f], { cwd: DIR, encoding: 'utf8', shell: process.platform === 'win32' });
  return JSON.parse(out)[0].results;
}
async function newOrder(email = 'buyer@example.com') {
  const html = await (await post('/api/order', form({ email, consent: 'yes' }))).text();
  const f = {}; for (const m of html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)) f[m[1]] = m[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const back = new URL(f.OrderResultURL);
  return { f, html, id: f.MerchantTradeNo, k: back.searchParams.get('k') };
}
function notify(id, extra = {}) {
  const p = { MerchantID: MID, MerchantTradeNo: id, RtnCode: '1', RtnMsg: '交易成功', TradeNo: '2310' + Math.floor(Math.random() * 1e9), TradeAmt: '100',
    PaymentDate: '2026/10/26 12:00:00', PaymentType: 'Credit_CreditCard', PaymentTypeChargeFee: '5', TradeDate: '2026/10/26 11:59:00', SimulatePaid: '0', CustomField1: '', CustomField2: '', CustomField3: '', CustomField4: '', StoreID: '', ...extra };
  p.CheckMacValue = cmv(p); return p;
}
const status = (id, k) => fetch(`${BASE}/api/status?o=${id}&k=${k}`).then(async r => ({ code: r.status, ...(await r.json()) }));
const redeem = (code, origin = GAME) => fetch(BASE + '/api/redeem', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify({ code }) });

console.log('1. 購買頁與建單');
let r = await fetch(BASE + '/buy'); let t = await r.text();
ok(r.status === 200 && t.includes('即將開賣') && t.includes('id="f" hidden') && t.includes('NT$100') && !t.includes('測試環境：用綠界'), '測試環境：一般訪客看到「即將開賣」和價格，付款表單和測試橫幅藏起來');
ok(t.includes('chenyouye493@gmail.com') || t.includes(vars.CONTACT_EMAIL || '@'), '購買頁標示聯絡信箱');
ok(t.includes('不包含 iPhone') , '購買頁寫明不包含 App 版');
r = await fetch(BASE + '/buy?test=1'); t = await r.text();
ok(r.status === 200 && !t.includes('即將開賣') && !t.includes('id="f" hidden') && t.includes('測試環境：用綠界'), '測試環境加 ?test=1：看得到付款表單和測試橫幅');
ok(t.includes('name="consent"') && t.includes('我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權'), '付款按鈕上方有必勾的同意框（文字一字不差）');
ok(t.indexOf('name="consent"') < t.indexOf('id="go"') && t.includes('id="go" disabled'), '同意框在付款按鈕上方，沒勾之前按鈕不能按');
t = await (await post('/api/order', form({ email: 'a@example.com' }))).text();
ok(t.includes('請先勾選'), '沒勾同意框不能建單');
t = await (await post('/api/order', form({ email: 'not-an-email', consent: 'yes' }))).text();
ok(t.includes('email 格式'), 'email 格式不對不能建單');
const A = await newOrder();
ok(/^GK\d{12}[A-Za-z0-9]{6}$/.test(A.id) && A.id.length === 20, '訂單編號 20 字英數字：' + A.id);
ok(A.f.CheckMacValue === cmv(A.f), '送綠界的檢查碼正確');
ok(A.f.TotalAmount === '100' && A.f.ChoosePayment === 'Credit', '金額 100、只用信用卡');
ok(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(A.f.MerchantTradeDate || ''), '交易時間格式 ' + A.f.MerchantTradeDate);
ok(A.html.includes('payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'), '送往綠界測試環境');
ok(A.k && A.k.length === 32, '回程網址帶 32 字的訂單密碼');
ok(sql(`SELECT consent_at, env FROM orders WHERE id='${A.id}'`)[0].consent_at.length > 10, '訂單記下勾選同意的時間');

console.log('2. 狀態查詢要訂單密碼');
ok((await status(A.id, A.k)).status === 'pending', '正確密碼：待付款');
ok((await status(A.id, 'x'.repeat(32))).code === 404, '錯的密碼：查不到');
ok((await status(A.id, A.k)).code === 200, '還沒付款：沒有解鎖碼');   /* status() 的 code 先放 HTTP 狀態，回應裡有解鎖碼才會蓋掉 */

console.log('3. 綠界付款通知（ReturnURL）');
const bad = notify(A.id); bad.CheckMacValue = bad.CheckMacValue.replace(/.$/, c => (c === 'A' ? 'B' : 'A'));
r = await post('/ecpay/return', form(bad)); ok(r.status === 400, '檢查碼錯：拒絕（' + r.status + '）');
const otherShop = notify(A.id, { MerchantID: '2000132' }); r = await post('/ecpay/return', form(otherShop)); ok(r.status === 400, '別家特店的通知：拒絕');
ok((await status(A.id, A.k)).status === 'pending', '檢查碼錯：不出貨');
r = await post('/ecpay/return', form(notify(A.id))); t = await r.text();
ok(t === '1|OK', '正確通知回 1|OK');
let s = await status(A.id, A.k);
ok(s.status === 'paid' && /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(s.code) && !/[IO01]/.test(s.code), '已付款、有 12 字解鎖碼（沒有 I、O、0、1）：' + s.code);
ok(s.link === vars.GAME_URL + '#unlock=' + s.code.replace(/-/g, ''), '「回到遊戲」連結帶著解鎖碼');
r = await post('/ecpay/return', form(notify(A.id))); ok((await r.text()) === '1|OK', '重複通知也回 1|OK');
r = await post(`/ecpay/result?o=${A.id}&k=${A.k}`, form(notify(A.id)));
ok(r.status === 303 && (r.headers.get('location') || '').includes('/thanks?o=' + A.id), '買家回到本站 → 轉到付款完成頁');
const mails = sql(`SELECT count(*) AS n FROM outbox WHERE html LIKE '%${A.id}%'`)[0].n;
ok(mails === 1, '同一筆只寄一封信（' + mails + '）');
ok(sql(`SELECT html FROM outbox WHERE html LIKE '%${A.id}%'`)[0].html.includes(s.code), '信裡有解鎖碼');
ok(sql(`SELECT code_hash FROM orders WHERE id='${A.id}'`)[0].code_hash !== s.code, '資料庫不存解鎖碼原文');
t = await (await fetch(`${BASE}/thanks?o=${A.id}&k=${A.k}`)).text(); ok(t.includes('回到遊戲並解鎖'), '付款完成頁有「回到遊戲並解鎖」');
t = await (await fetch(`${BASE}/thanks?o=${A.id}&k=${encodeURIComponent("<script>")}`)).text(); ok(t.includes('找不到這筆訂單') && !t.includes('<script>"'), '付款完成頁亂帶訂單密碼：擋下');

console.log('4. 遊戲來問解鎖碼');
r = await fetch(BASE + '/api/redeem', { method: 'OPTIONS', headers: { origin: GAME, 'access-control-request-method': 'POST' } });
ok(r.status === 204 && r.headers.get('access-control-allow-origin') === GAME, '遊戲的網址可以跨網域來問');
r = await redeem(s.code, 'https://evil.example'); ok(!r.headers.get('access-control-allow-origin'), '別的網站不給跨網域');
let j = await (await redeem(s.code.toLowerCase().replace(/-/g, ' '))).json();
ok(j.ok === true && j.stage === true, '小寫、空白也認得；測試環境的訂單標記 stage');
ok((await (await redeem('ABCD-EFGH-JKLM')).json()).error === 'notfound', '亂打的碼：找不到');
ok((await (await redeem('123')).json()).error === 'format', '字數不對：格式錯');
sql(`UPDATE orders SET activations=19 WHERE id='${A.id}'`);
ok((await (await redeem(s.code)).json()).ok === true, '第 20 台裝置：可以');
ok((await (await redeem(s.code)).json()).error === 'limit', '第 21 台裝置：超過上限');
sql(`UPDATE orders SET env='prod', activations=0 WHERE id='${A.id}'`);
ok((await (await redeem(s.code)).json()).stage === false, '正式環境的訂單：stage=false（遊戲會存起來）');

console.log('5. 金額不對、付款失敗、ATM');
const B = await newOrder();
r = await post('/ecpay/return', form(notify(B.id, { TradeAmt: '1' }))); ok((await r.text()) === '1|OK' && (await status(B.id, B.k)).status === 'pending', '金額不對：不出貨');
const C = await newOrder();
await post(`/ecpay/result?o=${C.id}&k=${C.k}`, form(notify(C.id, { RtnCode: '10100248', RtnMsg: '拒絕交易' })));
ok((await status(C.id, C.k)).status === 'failed', '信用卡失敗：顯示沒有成功');
r = await post('/ecpay/return', form(notify(C.id))); ok((await status(C.id, C.k)).status === 'paid', '失敗後又付款成功：照樣出貨');
const D = await newOrder();
await post('/ecpay/payinfo', form(notify(D.id, { RtnCode: '2', PaymentType: 'ATM_TAISHIN', BankCode: '812', vAccount: '9103522175887271', ExpireDate: '2026/10/29' })));
s = await status(D.id, D.k); ok(s.status === 'atm' && s.account === '9103522175887271', 'ATM 取號：付款完成頁看得到帳號');
await post('/ecpay/return', form(notify(D.id, { PaymentType: 'ATM_TAISHIN', SimulatePaid: '1' })));
ok((await status(D.id, D.k)).status === 'paid', '測試環境：後台模擬付款會出貨');

console.log('6. 管理頁');
r = await post('/admin', form({ pw: 'wrong-password-123', q: A.id })); ok((await r.text()).includes('管理密碼不對'), '密碼錯：不給看');
const oldCode = (await status(A.id, A.k)).code;
t = await (await post('/admin', form({ pw: vars.ADMIN_PASSWORD, q: A.id, renew: 'yes' }))).text();
const newCode = (await status(A.id, A.k)).code;
ok(t.includes('已寄出') && newCode !== oldCode && t.includes(newCode), '換新碼並重寄');
ok((await (await redeem(oldCode)).json()).error === 'notfound' && (await (await redeem(newCode)).json()).ok, '舊碼作廢、新碼可以用');

console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
process.exit(fail ? 1 : 0);
