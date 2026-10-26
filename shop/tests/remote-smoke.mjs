// 部署後的快速檢查（負責人設好 Secrets 之後跑）：node tests/remote-smoke.mjs
// 只能對「測試環境」跑：發現不是綠界測試特店（3002607）或不是 payment-stage 就停下來。
// 不偽造付款通知；會留下一筆「待付款」的 smoke-test@example.com 訂單，跑完照最後印的指令刪掉。
// 檢查：商店不是「暫停營業」（Secrets 都設了）、購買頁有同意框和信箱、建單送往綠界測試環境、
//       送綠界的檢查碼用公開的測試金鑰驗得過（＝HashKey／HashIV 沒打錯）、遊戲的網址可以跨網域問解鎖碼。
import crypto from 'node:crypto';

const BASE = process.env.BASE || 'https://goodnight-shop.mozart-shop.workers.dev';
const GAME_ORIGIN = 'https://chenyuyeh92.github.io';
const KEY = 'pwFHCqoQZGmho4w6', IV = 'EkRm7iFT261dpevs', MID = '3002607';
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };
function cmv(p) {
  const keys = Object.keys(p).filter(k => k !== 'CheckMacValue').sort((a, b) => { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; });
  const raw = 'HashKey=' + KEY + '&' + keys.map(k => k + '=' + p[k]).join('&') + '&HashIV=' + IV;
  const e = encodeURIComponent(raw).replace(/%20/g, '+').replace(/'/g, '%27').replace(/~/g, '%7e').toLowerCase();
  return crypto.createHash('sha256').update(e).digest('hex').toUpperCase();
}

console.log('檢查 ' + BASE);
let r = await fetch(BASE + '/buy'); let t = await r.text();
if (r.status === 503) { console.log('  ✗ 商店還是「暫停營業」：Secrets 還沒設完（要有 ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV、TOKEN_SECRET；ADMIN_PASSWORD 有設的話要 12 字以上）'); process.exit(1); }
ok(r.status === 200 && t.includes('即將開賣') && t.includes('NT$100'), '購買頁打得開；測試環境一般訪客看到「即將開賣」');
r = await fetch(BASE + '/buy?test=1'); t = await r.text();
// 建單之前先確定是測試環境（只有測試環境有「測試環境：」橫幅），不然不在正式的資料庫留下測試訂單
if (!t.includes('<div class="test">測試環境：')) { console.log('  ✗ 這不是綠界測試環境，停止（沒有建任何訂單）。正式環境請負責人自己付一筆真的錢來測。'); process.exit(1); }
ok(t.includes('我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權') && t.includes('id="go" disabled'), '加 ?test=1：有必勾的同意框，沒勾不能按');
ok(t.includes('@gmail.com'), '購買頁標示聯絡信箱');

r = await fetch(BASE + '/api/order', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=smoke-test%40example.com&consent=yes' });
t = await r.text();
const f = {}; for (const m of t.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)) f[m[1]] = m[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
if (f.MerchantID !== MID || !t.includes('payment-stage.ecpay.com.tw')) { console.log('  ✗ 這不是綠界測試環境（特店 ' + f.MerchantID + '），停止。正式環境請負責人自己付一筆真的錢來測。'); process.exit(1); }
ok(/^GK\d{12}[A-Za-z0-9]{6}$/.test(f.MerchantTradeNo || ''), '建單成功：' + f.MerchantTradeNo);
ok(f.CheckMacValue === cmv(f), '送綠界的檢查碼對（HashKey／HashIV 沒打錯）');
ok(f.ReturnURL === BASE + '/ecpay/return' && f.TotalAmount === '100', '通知網址、金額正確');

r = await fetch(BASE + '/api/redeem', { method: 'OPTIONS', headers: { origin: GAME_ORIGIN, 'access-control-request-method': 'POST' } });
ok(r.status === 204 && r.headers.get('access-control-allow-origin') === GAME_ORIGIN, '遊戲（GitHub Pages）可以跨網域問解鎖碼');
r = await fetch(BASE + '/api/redeem', { method: 'POST', headers: { 'content-type': 'application/json', origin: GAME_ORIGIN }, body: JSON.stringify({ code: 'ABCD-EFGH-JKLM' }) });
ok((await r.json()).error === 'notfound', '亂打的解鎖碼：找不到');

console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
console.log('清掉這次留下的測試訂單：npx wrangler d1 execute goodnight-shop --remote --command "DELETE FROM orders WHERE email=\'smoke-test@example.com\'"');
process.exit(fail ? 1 : 0);
