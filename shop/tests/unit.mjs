// 小商店的單元測試（不用開 wrangler dev）：node tests/unit.mjs
// 測：檢查碼用綠界官方範例算出官方答案、測試環境只寄信給負責人自己、解鎖碼的格式整理。
import { checkMac, normalizeCode, reallySend } from '../src/index.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } };

// 綠界官方範例（https://developers.ecpay.com.tw/?p=2902 ），答案抄自官方文件
const sample = { TradeDesc: '促銷方案', PaymentType: 'aio', MerchantTradeDate: '2023/03/12 15:30:23', MerchantTradeNo: 'ecpay20230312153023', MerchantID: '3002607', ReturnURL: 'https://www.ecpay.com.tw/receive.php', ItemName: 'Apple iphone 15', TotalAmount: '30000', ChoosePayment: 'ALL', EncryptType: '1' };
ok(await checkMac(sample, 'pwFHCqoQZGmho4w6', 'EkRm7iFT261dpevs') === '6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840', '檢查碼：官方範例算出官方答案');
ok(await checkMac({ ...sample, CheckMacValue: 'X' }, 'pwFHCqoQZGmho4w6', 'EkRm7iFT261dpevs') === '6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840', '檢查碼：算的時候不含 CheckMacValue 欄位');

const owner = 'owner@example.com';
const stage = { ECPAY_ENV: 'stage', MAIL_URL: 'https://mail.example', CONTACT_EMAIL: owner };
ok(reallySend(stage, ' Owner@Example.com ') === true, '測試環境：寄給負責人自己的信箱（大小寫、空白不管）會真的寄');
ok(reallySend(stage, 'stranger@example.com') === false, '測試環境：寄給別人只存進 outbox，不真的寄');
ok(reallySend({ ...stage, ECPAY_ENV: 'prod' }, 'buyer@example.com') === true, '正式環境：寄給買家');
ok(reallySend({ ...stage, ECPAY_ENV: 'prod', MAIL_URL: '' }, 'buyer@example.com') === false, '沒設寄信網址：都存進 outbox');

ok(normalizeCode(' z7xg-8nwh 2pfy ') === 'Z7XG8NWH2PFY', '解鎖碼：大小寫、空白、橫線都不管');

console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
process.exit(fail ? 1 : 0);
