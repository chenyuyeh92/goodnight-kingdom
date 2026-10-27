// 小商店本機完整流程測試：先在 shop/ 跑 `npm run dev`（wrangler dev，埠 8789），再跑 `npm test`
// 第一次要先 `npm run db:local` 建資料表、放 5 KB 假檔：npx wrangler r2 object put goodnight-files/Goodnight-Kingdom-Setup.exe --file=tests/fake-setup.bin --local
// 模擬綠界送來的通知（用綠界官方公開的測試特店 HashKey／HashIV 算檢查碼），測：建單、同意框、檢查碼、出貨只一次、狀態查詢要訂單密碼、
// 下載 5 次與第 6 次被擋、分段下載、過期、買家自己重寄（舊連結作廢、不洩漏誰買過、防亂按）、管理頁重寄、ATM＋測試環境模擬付款、金額不對不出貨。
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:8789';
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
const status = (id, k) => fetch(`${BASE}/api/status?o=${id}&k=${k}`).then(async r => ({ http: r.status, ...(await r.json()) }));
const local = link => link.replace(/^https?:\/\/[^/]+/, BASE);
const mailsTo = (email, like = '') => sql(`SELECT html FROM outbox WHERE to_email='${email}'${like ? ` AND html LIKE '%${like}%'` : ''} ORDER BY id`).map(r => r.html);
sql("DELETE FROM orders; DELETE FROM outbox; DELETE FROM resends;");

console.log('1. 購買頁與建單');
let r = await fetch(BASE + '/buy'); let t = await r.text();
ok(r.status === 200 && t.includes('即將開賣') && t.includes('id="f" hidden') && t.includes('NT$100') && !t.includes('測試環境：用綠界'), '測試環境：一般訪客看到「即將開賣」和價格，付款表單和測試橫幅藏起來');
ok(t.includes(vars.CONTACT_EMAIL || 'chenyouye493@gmail.com'), '購買頁標示聯絡信箱');
ok(t.includes('Windows 10 或 11') && t.includes('不包含手機版') && t.includes('/resend') && t.includes('個人資料'), '購買頁有系統需求、不含手機版、重寄連結、個資說明');
r = await fetch(BASE + '/buy?test=1'); t = await r.text();
ok(!t.includes('即將開賣') && !t.includes('id="f" hidden') && t.includes('測試環境：用綠界'), '測試環境加 ?test=1：看得到付款表單和測試橫幅');
ok(t.includes('我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權') && t.indexOf('name="consent"') < t.indexOf('id="go"') && t.includes('id="go" disabled'), '付款按鈕上方有必勾的同意框，沒勾不能按');
ok((await post('/api/order', form({ email: 'a@example.com' })).then(x => x.text())).includes('請先勾選'), '沒勾同意框不能建單');
ok((await post('/api/order', form({ email: 'not-an-email', consent: 'yes' })).then(x => x.text())).includes('email 格式'), 'email 格式不對不能建單');
const A = await newOrder();
ok(/^GK\d{12}[A-Za-z0-9]{6}$/.test(A.id), '訂單編號 20 字英數字：' + A.id);
ok(A.f.CheckMacValue === cmv(A.f) && A.f.TotalAmount === '100' && A.f.ChoosePayment === 'Credit' && A.html.includes('payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'), '送綠界：檢查碼正確、金額 100、信用卡、測試環境');
ok(sql(`SELECT consent_at FROM orders WHERE id='${A.id}'`)[0].consent_at.length > 10, '訂單記下勾選同意的時間');
ok((await fetch(BASE + '/help').then(x => x.text())).includes('Windows 已保護您的電腦'), '安裝教學頁');

console.log('2. 付款通知（ReturnURL）與出貨');
ok((await status(A.id, A.k)).status === 'pending' && (await status(A.id, 'x'.repeat(32))).http === 404, '狀態查詢要訂單密碼');
const bad = notify(A.id); bad.CheckMacValue = bad.CheckMacValue.replace(/.$/, c => (c === 'A' ? 'B' : 'A'));
ok((await post('/ecpay/return', form(bad))).status === 400 && (await post('/ecpay/return', form(notify(A.id, { MerchantID: '2000132' })))).status === 400, '檢查碼錯、別家特店：拒絕');
ok((await post('/ecpay/return', form(notify(A.id))).then(x => x.text())) === '1|OK', '正確通知回 1|OK');
let s = await status(A.id, A.k); ok(s.status === 'paid' && s.link && s.left === 5, '已付款、有下載連結、剩 5 次');
ok((await post('/ecpay/return', form(notify(A.id))).then(x => x.text())) === '1|OK', '重複通知也回 1|OK');
r = await post(`/ecpay/result?o=${A.id}&k=${A.k}`, form(notify(A.id)));
ok(r.status === 303 && (r.headers.get('location') || '').includes('/thanks?o=' + A.id), '買家回到本站 → 付款完成頁');
ok(mailsTo('buyer@example.com', A.id).length === 1, '同一筆只寄一封信');
ok(mailsTo('buyer@example.com', A.id)[0].includes('/resend') && mailsTo('buyer@example.com', A.id)[0].includes('匯出存檔'), '信裡有重寄網址、換電腦帶進度的說明');

console.log('3. 下載：5 次、分段、第 6 次擋');
const link = local(s.link);
r = await fetch(link, { headers: { range: 'bytes=0-99' } }); ok(r.status === 206 && (await r.arrayBuffer()).byteLength === 100, '分段下載從 0 開始：206、100 bytes（算 1 次）');
r = await fetch(link, { headers: { range: 'bytes=100-' } }); ok(r.status === 206, '接著下載剩下的（不算次數）');
ok((await fetch(link, { method: 'HEAD' })).status === 405, 'HEAD 不扣次數');
for (let i = 0; i < 4; i++) { r = await fetch(link); await r.arrayBuffer(); }
ok(r.status === 200 && (await status(A.id, A.k)).left === 0, '第 2–5 次可以下載');
t = await (await fetch(link)).text(); ok(t.includes('已經下載 5 次') && t.includes('/resend'), '第 6 次被擋，提示去重寄頁');

console.log('4. 買家自己重寄（/resend）');
t = await fetch(BASE + '/resend').then(x => x.text()); ok(t.includes('購買時填的 email'), '重寄頁打得開');
const before = mailsTo('buyer@example.com').length;
t = await post('/resend', form({ email: 'Buyer@Example.com' })).then(x => x.text());
ok(t.includes('如果這個 email 買過'), '輸入 email（大小寫不同也認得）→ 顯示已寄出');
ok(mailsTo('buyer@example.com').length === before + 1, '真的寄出新的下載連結');
s = await status(A.id, A.k); ok(s.left === 5 && local(s.link) !== link, '換了新連結、次數重算');
ok((await fetch(link).then(x => x.text())).includes('已經失效'), '舊連結作廢');
ok((await fetch(local(s.link))).status === 200, '新連結可以下載');
t = await post('/resend', form({ email: 'nobody@example.com' })).then(x => x.text());
ok(t.includes('如果這個 email 買過') && mailsTo('nobody@example.com').length === 0, '沒買過的 email：顯示同一句話（不洩漏誰買過），也不寄信');
await post('/resend', form({ email: 'buyer@example.com' })); await post('/resend', form({ email: 'buyer@example.com' }));
t = await post('/resend', form({ email: 'buyer@example.com' })).then(x => x.text());
ok(t.includes('剛剛已經寄過了'), '同一個 email 一小時第 4 次：擋下');

console.log('5. 過期、金額不對、付款失敗、ATM、測試訂單');
sql(`UPDATE orders SET token_expires=1 WHERE id='${A.id}'`);
ok((await fetch(local((await status(A.id, A.k)).link)).then(x => x.text())).includes('已經過期'), '過期：擋下');
const B = await newOrder('b@example.com');
await post('/ecpay/return', form(notify(B.id, { TradeAmt: '1' })));
ok((await status(B.id, B.k)).status === 'pending' && /金額 1/.test(sql(`SELECT note FROM orders WHERE id='${B.id}'`)[0].note || ''), '金額不對：不出貨，記下紀錄');
const C = await newOrder('c@example.com');
await post(`/ecpay/result?o=${C.id}&k=${C.k}`, form(notify(C.id, { RtnCode: '10100248', RtnMsg: '拒絕交易' })));
ok((await status(C.id, C.k)).status === 'failed', '信用卡失敗：顯示沒有成功');
await post('/ecpay/return', form(notify(C.id))); ok((await status(C.id, C.k)).status === 'paid', '失敗後又付款成功：照樣出貨');
const D = await newOrder('d@example.com');
await post('/ecpay/payinfo', form(notify(D.id, { RtnCode: '2', PaymentType: 'ATM_TAISHIN', BankCode: '812', vAccount: '9103522175887271', ExpireDate: '2026/10/29' })));
s = await status(D.id, D.k); ok(s.status === 'atm' && s.account === '9103522175887271', 'ATM 取號：付款完成頁看得到帳號');
ok(mailsTo('d@example.com').length === 0, 'ATM 取號不寄信');
await post('/ecpay/return', form(notify(D.id, { PaymentType: 'ATM_TAISHIN', SimulatePaid: '1' })));
ok((await status(D.id, D.k)).status === 'paid', '測試環境：後台模擬付款會出貨');

console.log('6. 管理頁、防亂建單');
ok((await post('/admin', form({ pw: 'wrong-password-123', q: C.id })).then(x => x.text())).includes('管理密碼不對'), '密碼錯：不給看');
const oldC = (await status(C.id, C.k)).link;
t = await post('/admin', form({ pw: vars.ADMIN_PASSWORD, q: C.id, send: 'yes' })).then(x => x.text());
ok(t.includes('已寄出') && (await status(C.id, C.k)).link !== oldC, '管理頁重寄：新連結');
const linkC = (await status(C.id, C.k)).link;
t = await post('/admin', form({ pw: vars.ADMIN_PASSWORD, q: C.id, refund: 'yes' })).then(x => x.text());
ok(t.includes('已標記退款') && (await status(C.id, C.k)).status === 'refunded', '管理頁標記已退款');
ok((await fetch(local(linkC)).then(x => x.text())).includes('失效'), '退款後：原本的下載連結失效');
t = await post('/admin', form({ pw: vars.ADMIN_PASSWORD, q: C.id, send: 'yes' })).then(x => x.text());
ok(t.includes('已退款，不能寄'), '退款後：管理頁不能重寄');
const mailsC = mailsTo('c@example.com').length;
await post('/resend', form({ email: 'c@example.com' }));
ok(mailsTo('c@example.com').length === mailsC, '退款後：買家自己重寄也不會寄出');
await post('/ecpay/return', form(notify(C.id)));
ok((await status(C.id, C.k)).status === 'refunded' && mailsTo('c@example.com').length === mailsC && !/沒出貨/.test(sql(`SELECT note FROM orders WHERE id='${C.id}'`)[0].note || ''), '退款後：綠界重送付款通知也不會再出貨、不寄信、不記「沒出貨」');
t = await post('/admin', form({ pw: vars.ADMIN_PASSWORD, q: B.id, refund: 'yes' })).then(x => x.text());
ok(t.includes('沒有標記'), '沒付款的訂單不能標記退款');
for (let i = 0; i < 5; i++) await newOrder('spam@example.com');
ok((await post('/api/order', form({ email: 'spam@example.com', consent: 'yes' })).then(x => x.text())).includes('下單次數太多'), '同一個 email 一小時第 6 筆：擋下');

console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
process.exit(fail ? 1 : 0);
