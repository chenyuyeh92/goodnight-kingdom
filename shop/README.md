# 晚安王國 網頁版完整版的小商店（綠界）

2026-10-26 起。負責人：葉宸佑。程式 `shop/src/index.js`（Cloudflare Worker＋D1），遊戲那一邊 `src/platform/webShop.ts`、`src/scenes/webStoreButtons.ts`。
寫法和綠界的規定、踩過的坑跟《音樂家的人生》電腦版商店一樣（music-game 專案的 `apps/mozart-shop`、`docs/musician-life/desktop-sales.md`）。

## 規則（一定要遵守）
- **只放網頁版。** App 版（iPhone、iPad、之後的 Android）裡的解鎖只能用 Apple／Google 的付款（Apple 審查準則 3.1.1）：App 裡不能出現綠界、解鎖碼、「去網站買」。
  - App 打包時 `app/scripts/build-web.mjs` 設 `VITE_APP=1`，網頁版的購買程式、網址、文字整個不會進 App（已檢查打包出來的檔案裡沒有 `goodnight-shop`、`解鎖碼`、`綠界`）。
  - 就算網頁版的程式跑在 App 裡（有 `ReactNativeWebView`），網頁版的按鈕也不出現、解鎖碼也不算。
  - App 會用 Safari 開 `support.html`、`privacy.html`、`licenses.html`：**這三頁不能寫網頁版的購買方式或商店網址。**
- 數位內容：付款按鈕上方必勾「我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權」，沒勾不能付款，勾選時間記在訂單（`consent_at`）。
- 購買頁標示負責人在綠界驗證的信箱（`wrangler.toml` 的 `CONTACT_EMAIL`），不能拿掉。
- HashKey／HashIV、TOKEN_SECRET、管理密碼、寄信密語都不寫在程式或對話裡：正式的由負責人用 `wrangler secret put` 自己輸入。
- **測試環境（`ECPAY_ENV=stage`）買到的解鎖碼，遊戲只在當次打開時解鎖、不存起來**：測試特店的金鑰是公開的，任何人都能偽造付款通知。換正式後，舊的測試訂單照樣是「測試」（訂單的 `env` 欄位），不會變成真的解鎖。

## 流程
1. 遊戲（網頁版）選關畫面切到世界 4 →「解鎖完整版 NT$100」→ 到小商店 `/buy`。
2. 填 email、勾同意框 →「前往付款（綠界）」→ 綠界付款頁（只開信用卡）。
3. 綠界通知 `/ecpay/return`（伺服器，回 `1|OK`）、買家回到 `/ecpay/result` → `/thanks` 付款完成頁顯示**解鎖碼**（12 個字，像 `Z7XG-8NWH-2PFY`）和「回到遊戲並解鎖」，同時寄信。
4. 「回到遊戲並解鎖」打開 `遊戲網址#unlock=解鎖碼` → 遊戲問小商店 `/api/redeem` → 對了就記在這台裝置（`gk.webfull.v1`）。
5. 換裝置、換瀏覽器：世界 4 按「輸入解鎖碼」。同一個解鎖碼最多 20 台（`MAX_DEVICES`）。
6. 管理頁 `/admin`（要設 ADMIN_PASSWORD）：用訂單編號或 email 查訂單、重寄解鎖碼、換新碼（舊碼作廢，解鎖碼外流時用）。

## 網址與設定
- 小商店：https://goodnight-shop.mozart-shop.workers.dev （D1 `goodnight-shop`，APAC）
- 遊戲：https://chenyuyeh92.github.io/goodnight-kingdom/
- 遊戲裡的 `SHOP_OPEN`（`src/platform/webShop.ts`）：`false` 時網頁版照舊寫「完整版即將推出」，網址加 `?shop=1` 才看得到購買按鈕（測試用）。

## 負責人要自己做的事（終端機，先 `cd` 到 `shop` 資料夾）
每一行輸入後，會問 `Enter a secret value:`，把值貼上按 Enter（畫面不會顯示）。

### A. 先用測試環境（綠界公開的測試特店）
```
npx wrangler secret put ECPAY_MERCHANT_ID   ← 貼 3002607
npx wrangler secret put ECPAY_HASH_KEY      ← 貼 pwFHCqoQZGmho4w6
npx wrangler secret put ECPAY_HASH_IV       ← 貼 EkRm7iFT261dpevs
npx wrangler secret put TOKEN_SECRET        ← 貼一串 30 字以上的亂碼（自己打，不用記）
npx wrangler secret put ADMIN_PASSWORD      ← 管理頁密碼（20 字以上，自己記好）
```
寄信（用跟莫札特商店同一個 Gmail 寄信程式）：
```
npx wrangler secret put MAIL_URL            ← 跟莫札特商店設的一樣
npx wrangler secret put MAIL_SECRET         ← 跟莫札特商店設的一樣
```
（測試特店的三個值是綠界官網公開的資料，不是負責人的金鑰。）

### B. 換正式（綠界正式環境）
1. 綠界廠商後台 →「系統開發管理」→「系統介接設定」看 MerchantID、HashKey、HashIV。
2. 終端機輸入正式的三個值：
```
npx wrangler secret put ECPAY_MERCHANT_ID
npx wrangler secret put ECPAY_HASH_KEY
npx wrangler secret put ECPAY_HASH_IV
```
3. 告訴 Claude「換正式」：Claude 把 `wrangler.toml` 的 `ECPAY_ENV` 改成 `prod` 並部署、遊戲的 `SHOP_OPEN` 改成 `true` 並推上 GitHub。
   （程式會擋：正式環境還用測試特店 3002607 時，整個商店「暫停營業」。）
4. 負責人用自己的信用卡買一次 NT$100，確認解鎖、收到信，再到綠界後台退款。

## 本機測試
1. `npm install`、`cp .dev.vars.example .dev.vars`（TOKEN_SECRET、ADMIN_PASSWORD 換成亂數）、`npm run db:local`
4. 負責人設好 Secrets 後：`npm run smoke`（只對測試環境；確認不是暫停營業、金鑰沒打錯、遊戲網址能跨網域），跑完照最後一行刪掉測試訂單
2. `npm run test:unit`（7 項，不用開伺服器：官方檢查碼範例、測試環境只寄給負責人）；`npm run dev`（埠 8789）→ 另一個終端機 `npm test`（單元 7 項＋流程 47 項）
3. 遊戲接本機商店：`node shop/dev-game.cjs`（vite 埠 5173，`VITE_SHOP_URL=http://localhost:8789`），打開 `http://localhost:5173/goodnight-kingdom/?shop=1`
- 換了 `wrangler.toml` 的 database_id 後，本機 `.wrangler` 會變成另一個空資料庫 → 重跑 `npm run db:local`。

## 進度
- 2026-10-26：第一版完成。本機自動測試 47 項全過（同意框、檢查碼、出貨只一次、解鎖碼、跨網域、裝置上限、測試環境標記、ATM 取號＋模擬付款、管理頁換新碼）；遊戲的單元測試和 e2e（`e2e/webShop.spec.ts` 7 項）通過。
- 2026-10-26：**真的走了一次綠界測試環境**（瀏覽器窗格）：遊戲世界 4 →「解鎖完整版」→ 購買頁 → 綠界 payment-stage 接受我們的檢查碼 → 測試卡 4311-9522-2222-2222、OTP 1234 → 回到本機付款完成頁（驗過綠界真實送來的檢查碼）→ 顯示解鎖碼 →「回到遊戲並解鎖」→ 遊戲跳出「測試解鎖」、世界 4 打開。
- 2026-10-26：部署到 Cloudflare（測試環境），資料表建好。**還沒設 Secrets（負責人做，見上面 A），所以現在網址打開是「商店設定未完成，暫停營業」。** 設好後要再付一次測試款，確認綠界伺服器通知連得到（看訂單的 `return_at` 有值）。
- 待確認：綠界的「販售網址」申請時填的是莫札特的網站；多賣一個商品（晚安王國網頁版）要不要跟綠界報備或另外申請（未查證，問綠界客服）。
- 之後要開 ATM：`CHOOSE_PAYMENT` 改 `ALL` 時要排除超商代碼、條碼（`IgnorePayment`，參數以綠界文件為準），它們的取號代碼不是 2，買家會看不到繳費資訊。
