# 晚安王國 Windows 電腦版（下載版）的小商店（綠界）

2026-10-26 起。負責人：葉宸佑。程式：小商店 `shop/src/index.js`（Cloudflare Worker＋D1＋R2）、電腦版 `desktop/`（Electron＋安裝程式）、網頁版的購買按鈕 `src/platform/webShop.ts`、存檔備份 `src/game/backup.ts`。
寫法和綠界的規定、踩過的坑跟《音樂家的人生》電腦版商店一樣（music-game 專案的 `apps/mozart-shop`、`apps/mozart-desktop`、`docs/musician-life/desktop-sales.md`）。

## 已定案
- 2026-10-26 下午：綠界付款只放網頁版；App 版用 Apple／Google 的付款（Apple 3.1.1）；數位內容必勾同意框；HashKey／HashIV 負責人自己設；先測試環境；購買頁標示綠界驗證的信箱。
- **2026-10-26 晚上改方向（負責人：四題都照建議）**：
  1. **電腦上賣「Windows 下載版」**（安裝程式、桌面圖示、離線可玩），不賣「網頁版解鎖碼」。原因：網頁輸入解鎖碼、「加到桌面」大家不熟悉，下載版像一般電腦遊戲。
  2. **忘記下載連結：買家自己在「重寄下載連結」頁輸入 email，自動寄新連結**，負責人不用處理。
  3. **進度帶到新電腦：「設定 → 匯出存檔／匯入存檔」**（小檔案）；雲端自動存檔放第二版清單。
  4. **網頁版是免費試玩**（世界 1–3），世界 4 的「買 Windows 電腦版 NT$100」開購買頁。
- 價格 NT$100（同 App）；同一個解鎖碼的裝置上限那題已不適用（沒有解鎖碼了）。
- Steam：之後有人買了再考慮（上架費 US$100、抽 30%，第三方資料，未查證官方）。

## 規則（一定要遵守）
- **App 版（iPhone、iPad、之後的 Android）裡不能出現綠界、電腦版、「去網站買」**（Apple 3.1.1）。
  - App 打包（`app/scripts/build-web.mjs`）和電腦版打包（`desktop/scripts/pack.mjs`）都設 `VITE_APP=1`：網頁版的購買按鈕、商店網址整個不會進去；兩個打包腳本都會搜打包出來的程式，有商店網址就讓打包失敗。
  - 網頁版的程式萬一跑在 App 裡（有 `ReactNativeWebView`），購買按鈕也不出現。
  - App 會用 Safari 開 `support.html`、`privacy.html`、`licenses.html`：**這三頁不能寫電腦版的購買方式或商店網址。**
- 數位內容：付款按鈕上方必勾「我了解本商品為數位內容，付款後立即提供，依規定不適用七日解除權」，沒勾不能付款，勾選時間記在訂單（`consent_at`）。
- 購買頁標示負責人在綠界驗證的信箱（`wrangler.toml` 的 `CONTACT_EMAIL`），不能拿掉。購買頁有「個人資料」說明（個資法第 8 條告知；上線前最好請會計師或律師看一下）。
- 金鑰（HashKey／HashIV、TOKEN_SECRET、管理密碼、寄信密語）不寫在程式或對話裡：由負責人在 Cloudflare 網站設（見下面）。
- **測試環境（`ECPAY_ENV=stage`）R2 只能放假檔**：測試特店的金鑰是公開的，任何人都能偽造付款通知。程式也會擋：stage 時檔案超過 20 MB 不給下載；換正式後，測試環境的訂單（`env` 欄位）不能下載正式檔案。
- 測試環境只真的寄信給 `CONTACT_EMAIL`（其他人的信存進 outbox），不讓負責人的 Gmail 被拿來寄信給陌生人。

## 流程
1. 網頁版（免費試玩）世界 4 →「買 Windows 電腦版 NT$100」→ 新分頁開小商店 `/buy`。
2. 填 email、勾同意框 →「前往付款（綠界）」→ 綠界付款頁（只開信用卡）。
3. 綠界通知 `/ecpay/return`（伺服器，回 `1|OK`）、買家回到 `/ecpay/result` → `/thanks` 付款完成頁出現「下載安裝程式」，同時寄信。
4. `/dl/<代碼>`：下載 `Goodnight-Kingdom-Setup.exe`，7 天、5 次（分段下載只算一次）。
5. 安裝：雙擊 → 下一步 → 安裝 → 桌面「晚安王國」。教學 `/help`（Edge／Chrome 下載警告、「Windows 已保護您的電腦」的示意圖）。
6. **買家自己重寄 `/resend`**：輸入 email → 找最近一筆已付款訂單 → 換新連結（舊的作廢）寄出。不管有沒有買過都顯示同一句話；同一個 email 一小時 3 次、全站一小時 60 次。
7. 換電腦：舊電腦「設定 → 匯出存檔」→ 新電腦安裝 → 「設定 → 匯入存檔」。購買紀錄不放進存檔檔案。
8. 管理頁 `/admin`（要有 ADMIN_PASSWORD）：查訂單、看「收到付款但沒出貨」的紀錄、重寄。

## 網址與設定
- 小商店：https://goodnight-shop.mozart-shop.workers.dev （D1 `goodnight-shop`、R2 `goodnight-files`）
- 網頁版：https://chenyuyeh92.github.io/goodnight-kingdom/ ；`SHOP_OPEN`（`src/platform/webShop.ts`）是 `false` 時照舊寫「完整版即將推出」，網址加 `?shop=1` 才看得到購買按鈕。
- 電腦版存檔：`%APPDATA%\goodnight-kingdom-desktop`（解除安裝不會刪，重新安裝還在）。

## 負責人要做的事（Cloudflare 網站 → Workers 和 Pages → goodnight-shop → 設定 → 變數和祕密 → 新增，類型選 Secret；可以把 `KEY=值` 整段貼在 Key 欄）
- [x] 2026-10-26 測試環境的 5 個（ECPAY_MERCHANT_ID 3002607、ECPAY_HASH_KEY、ECPAY_HASH_IV、TOKEN_SECRET、ADMIN_PASSWORD）
- [x] 2026-10-27 **寄信** `MAIL_URL`、`MAIL_SECRET`（跟莫札特商店一樣的值）：用負責人信箱測重寄，真的寄出（第一次貼錯密語時寄信程式回 denied，重貼後好了）。
- [ ] **換正式**：綠界廠商後台「系統開發管理 → 系統介接設定」的正式 MerchantID、HashKey、HashIV，蓋掉那三個 → 告訴 Claude「換正式」：Claude 上傳正式安裝程式到 R2、`ECPAY_ENV` 改 prod 部署、網頁版 `SHOP_OPEN=true` 推上 GitHub。
- [ ] 換正式後自己買一次 NT$100：下載、安裝、玩，再到綠界後台退款。
- [ ] 問綠界客服：多賣一個商品（晚安王國電腦版），要不要報備販售網址（未查證）。

## 本機測試
1. `npm install`、`cp .dev.vars.example .dev.vars`（TOKEN_SECRET、ADMIN_PASSWORD 換成亂數）、`npm run db:local`、放假檔：`npx wrangler r2 object put goodnight-files/Goodnight-Kingdom-Setup.exe --file=tests/fake-setup.bin --local`
2. `npm run test:unit`（6 項：官方檢查碼範例、測試環境只寄給負責人）；`npm run dev`（埠 8789）→ 另一個終端機 `npm test`（單元＋流程 42 項）
3. 遊戲接本機商店：`node shop/dev-game.cjs`（vite 埠 5173），打開 `http://localhost:5173/goodnight-kingdom/?shop=1`
4. 部署後：`npm run smoke`（只對測試環境；建單前先確認是測試環境），跑完照最後一行刪掉測試訂單
- 換了 `wrangler.toml` 的 database_id，或資料表改了：本機刪 `.wrangler/state` 重跑 `npm run db:local`。
- 電腦版：`desktop/` 跑 `node scripts/pack.mjs`（`--game-only` 只做 game/ 給 `npx electron .`）；成品 `desktop/dist/Goodnight-Kingdom-Setup.exe`（約 110 MB，不進版本紀錄）。

## 進度
- 2026-10-26 下午：第一版（網頁版解鎖碼）做完並在綠界測試環境走通，晚上改方向後拿掉。紀錄：綠界測試付款頁接受我們的檢查碼、OrderResultURL 回本機、部署後 ReturnURL 連得到 workers.dev（return_at 有值）。
- 2026-10-26 晚上：**電腦版**（`desktop/`）：自訂網址 `app://game/` 載入遊戲（Vite 的模組程式不能從 file:// 開）、完整版、沒有購買按鈕、預設全螢幕、說明頁用系統瀏覽器。自動測試 12 項（Playwright 開 Electron：開得起來、世界 4 打開、進 4-1 玩、主控台沒錯誤、存檔重開還在；打包後的 exe 也跑過）。安裝程式安靜安裝測過：桌面與開始選單捷徑指向正確的 exe、移除乾淨。
- 2026-10-26 晚上：**匯出／匯入存檔**（設定畫面，網頁版和電腦版有，App 版不放）：單元 5 項、e2e 4 項。踩過的坑：Playwright 等選檔視窗要先 `page.on('filechooser')`，太晚開始攔會偶爾等不到（不是遊戲的問題）。
- 2026-10-26 晚上：**小商店改賣下載版**：本機 42 項全過；雲端資料表重建、R2 `goodnight-files` 建好放 5 KB 假檔、部署到測試環境、`npm run smoke` 通過。
- 2026-10-26 晚上：**網頁版改免費試玩**：世界 4「買 Windows 電腦版」、過關畫面「買電腦版(3)」；e2e 4 項。
- 之後要開 ATM：`CHOOSE_PAYMENT` 改 `ALL` 時要排除超商代碼、條碼（`IgnorePayment`，參數以綠界文件為準）。
