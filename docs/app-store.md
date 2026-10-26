# 上架 App Store(iPhone、iPad)

2026-10-26 準備。照葉宸佑之前上架 App 的流程(Expo + EAS)整理,加上這款遊戲自己要注意的地方。

## 定案

| 項目 | 內容 |
|---|---|
| App 名稱 | 晚安王國(英文介面顯示 Goodnight Kingdom) |
| Bundle ID | `com.chenyuyeh.goodnightkingdom` |
| 版本 | 1.0.0(build 號碼由 EAS 自動加) |
| 價格 | 免費下載;世界 1–3 免費 |
| 內購 | 「完整版」非消耗型,**NT$100**(價格等級選台幣 100 元那一級),產品 ID **`goodnight_kingdom_full`**,買一次解鎖世界 4–10 和結局 |
| 類別 | 主要:遊戲 → 動作;次要:遊戲 → 家庭(**不放「兒童」分類**) |
| 裝置 | iPhone、iPad(只能橫向;iPad 不支援分割畫面) |
| 內購方式 | 直接用 Apple 內購(expo-iap),不用 RevenueCat,也沒有自己的伺服器 |

## App 是怎麼做的(給之後改程式的人)

- `app/` 是 App 的外殼(Expo SDK 58)。整個畫面是一個 WebView,裡面跑的就是網頁版的遊戲。
- 遊戲檔案打包在 App 裡,由 `app/modules/game-server/`(Swift 寫的小伺服器,只有這支手機自己連得到)從 `http://127.0.0.1:47291/goodnight-kingdom/` 提供。網址固定,存檔才不會不見;不需要網路就能玩(線上雙人除外)。
- 打包時 `app/scripts/build-web.mjs` 會先打包網頁版,只複製遊戲真的會用到的檔案(約 35 MB,美術原檔不放)。EAS 雲端打包會自動執行(`eas-build-pre-install`)。
- 遊戲和 App 用訊息溝通(`src/platform/native.ts`、`app/App.tsx`):
  - 遊戲 → App:`ready`、`buy`(解鎖完整版)、`restore`(恢復購買)、`openUrl`(用 Safari 開說明頁)、`shareImage`(分享畫的守衛)。
  - App → 遊戲:`store`(買過沒有、價格)、`purchase`(購買結果:成功、恢復、等家長同意、取消、失敗、這個帳號沒買過)。
- 買過的人:App 每次打開都問 Apple;另外也記在手機裡,沒有網路時照樣能玩完整版。
- 網頁版沒有購買按鈕(還是寫「完整版即將推出」)。

## 第一次上架的步驟

### 1. App Store Connect 先建好 App 和內購

1. **合約**:App Store Connect →「商務」(Business),「付費 App」合約要簽好,**銀行帳戶和稅務資料都要填完**。沒有這一步,內購在審核時會抓不到商品,會被退件。
2. 「App」→「+」→「新增 App」:
   - 平台:iOS;名稱:晚安王國;主要語言:繁體中文;Bundle ID:`com.chenyuyeh.goodnightkingdom`(清單裡沒有的話,先到 developer.apple.com 的 Identifiers 新增一個,或第一次 EAS build 時讓它自動建立);SKU:`goodnight-kingdom`。
3. 建好後,在「App 資訊」頁看到的 **Apple ID(一串數字)**,填進 `app/eas.json` 的 `ascAppId`。
4. 「營利」(Monetization)→「App 內購買項目」→「+」:
   - 類型:**非消耗型**;參考名稱:完整版;產品 ID:`goodnight_kingdom_full`(一定要一模一樣)。
   - 價格:台幣 100 元那一級(其他國家讓 Apple 自動換算)。
   - 本地化:
     - 繁體中文 — 顯示名稱「完整版」;描述「解鎖世界 4–10 和結局,一次購買永久遊玩」。
     - 英文 — 「Full Version」;「Unlock Worlds 4–10 and the ending. Buy once, play forever.」
   - 審核用截圖:`iap-review.jpg`(App 裡世界 4 的購買畫面;截圖檔怎麼產生見下面「截圖」)。
   - 審核備註:「在選關畫面切到世界 4(或打完 3-3 按『解鎖完整版』),按『解鎖完整版』購買;『恢復購買』在同一個畫面。」
5. 「App 隱私權」(App Privacy):
   - 隱私權政策網址:`https://chenyuyeh92.github.io/goodnight-kingdom/privacy.html`
   - 「你或第三方合作夥伴是否從這個 App 收集資料?」→ **否**(沒有帳號、廣告、分析;購買由 Apple 處理;線上雙人的連線資訊不會被我們保存,也不會連到身分)。

### 2. 準備電腦(Windows)

照之前的做法,在 PowerShell:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd 晚安王國的資料夾\app
npm install
npx.cmd expo login
```

### 3. 第一次打包(要葉宸佑自己跑,會問 Apple 帳號)

```powershell
npx.cmd eas-cli@latest build --platform ios --profile production
```

- 第一次會問要不要建立 EAS 專案、要不要登入 Apple、要不要讓 EAS 管理憑證(Distribution Certificate、Provisioning Profile):都回答 **Y**,照提示登入 Apple 開發者帳號。
- 雲端打包時會自動打包網頁版的遊戲放進 App(看紀錄裡有「遊戲檔案放進 App:… MB」)。
- 之後再打包,Claude 可以幫忙跑。

### 4. 送到 TestFlight

```powershell
npx.cmd eas-cli@latest submit --platform ios --latest
```

- 送上去後約 10–30 分鐘,App Store Connect 的 TestFlight 會出現這個 build。
- 「出口合規」已經在 App 設定裡宣告「沒有使用非豁免的加密」(`usesNonExemptEncryption: false`),通常不會再問;如果問,選「沒有使用加密」或「只用標準加密」。
- **先在自己的 iPhone、iPad 用 TestFlight 裝起來試玩**,檢查:
  - [ ] 打開就是遊戲,有聲音、可以玩世界 1–3,關掉再開存檔還在。
  - [ ] 世界 4 的「解鎖完整版」會跳出 Apple 的購買視窗,顯示 NT$100。TestFlight 的購買是測試用的,**不會真的扣錢**。
  - [ ] 買完世界 4–10 打開;刪掉 App 重裝後,按「恢復購買」又會打開。
  - [ ] 設定裡的「支援與說明」「隱私權政策」用 Safari 打開網站。
  - [ ] 畫一隻守衛,按「下載圖片」會跳出分享選單,可以存到照片。
  - [ ] 兩支手機開房間、加入房間可以一起玩。
  - [ ] 切到背景(回主畫面)過一陣子再回來,遊戲還能繼續、換世界還會載入。

### 5. 填上架資料、送審

App Store Connect →「App Store」分頁 → 1.0 版:

1. **建置版本**:選剛剛 TestFlight 那個 build。
2. **截圖**(中文、英文各一套,每套 5 張:主選單、哄睡魔物、畫守衛、寶箱武器、最後的魔王):
   - iPhone 6.9 吋:`iphone-zh-1-menu.jpg`…`iphone-zh-5-boss.jpg`(2868×1320,橫式);英文版是 `iphone-en-…`。
   - iPad 13 吋:`ipad-zh-1-menu.jpg`…(2752×2064,橫式)。
   - 重新產生:`npm run build:e2e`、`npx vite preview --port 4173`,再 `node tools/promo/screens.cjs <輸出資料夾>`。
   - App 預覽影片(選填):只收 30 秒以內,用 `appstore-zh-iphone.mp4`、`appstore-zh-ipad.mp4`(見 `docs/store-assets.md`)。
3. **文字**:副標題、描述(已經寫好價格那一段)、關鍵字照 `docs/store-listing.md`。
   - 支援網址:`https://chenyuyeh92.github.io/goodnight-kingdom/support.html`
   - 行銷網址(選填):`https://chenyuyeh92.github.io/goodnight-kingdom/`
4. **年齡分級**問卷:卡通或奇幻暴力 →「不常/輕微」;其他(恐怖、成人內容、賭博、醫療等)都選「無」;「無限制網頁存取」→ 否;「使用者產生的內容/聊天」→ 否(線上雙人沒有文字或語音聊天)。結果預期是 4+。**不要勾「兒童」分類**(Made for Kids)。
5. **App 內購買項目**:在版本頁的「App 內購買項目和訂閱項目」區塊,把「完整版」加進這次送審(第一個內購一定要跟 App 一起送)。
6. **App 審核資訊**:
   - 聯絡人:葉宸佑、電話、email `chenyouye493@gmail.com`。
   - 不需要登入帳號。
   - 備註(可以直接貼):

     > 晚安王國是可愛風格的 2D 橫向射擊遊戲,沒有帳號、沒有廣告。世界 1–3 免費;要測試內購:在主選單按「開始遊戲」(第一次會先播開場故事,點畫面就會往下)→ 選關畫面按右上的「世界 N →」三次,切到世界 4 → 按「解鎖完整版」(「恢復購買」在旁邊)。線上雙人要兩台裝置:一台按「雙人遊戲 → 開房間」,另一台「加入房間」輸入六位數房號。
     >
     > Goodnight Kingdom is a cute 2D side-scrolling shooter. No account and no ads. Worlds 1–3 are free. To test the in-app purchase: tap Start (the first time, a short opening story plays; tap to advance) → on the level select screen tap the top-right "World N →" button three times to reach World 4 → "Unlock full version" ("Restore purchase" is next to it). Online co-op needs two devices: one taps Two Players → Open a room, the other Join a room and enters the 6-digit room number.

7. **版本發佈**:選「**手動發佈此版本**」。
8. 按「**提交以供審核**」(這一步葉宸佑自己按)。

送審前一天:用網頁版開一次「雙人遊戲 → 開房間」,確定 Supabase 連線服務沒有被暫停(免費方案一週沒人用會暫停,審核員測線上雙人時會連不上;見 `docs/release-checklist.md`)。

## 被退件時

- **Guideline 2.1(資訊不足、找不到內購)**:在「解決方案中心」回覆,說明內購的位置(上面那段備註),必要時附上購買畫面的截圖或錄影;不用重新打包就可以「重新送審」。
- **內購抓不到商品**:多半是「付費 App 合約」或銀行、稅務資料還沒生效,或內購項目沒有一起送審。
- 趕時間可以申請「加急審查」(https://developer.apple.com/contact/app-store/?topic=expedite),說明理由。

## 之後更新版本

1. 改好遊戲(網頁版照常部署)。
2. `app/app.json` 的 `version` 改成新版本(例如 1.0.1);build 號碼 EAS 會自動加。
3. `npx.cmd eas-cli@latest build --platform ios --profile production` → `npx.cmd eas-cli@latest submit --platform ios --latest`。
4. App Store Connect 新增版本、選 build、填「此版本的新功能」、送審。

## 在 Mac 上自己打包(選用)

```sh
cd app
npm install
npm run web          # 打包網頁版遊戲放進 App
npx expo run:ios     # 需要 Xcode;在模擬器或接上的 iPhone 執行
```

模擬器上買東西要用 StoreKit 測試或沙箱帳號;最簡單還是用 TestFlight 測。

## Google Play(之後)

`app/` 目前只做 iOS。要上 Google Play 時,`modules/game-server` 要再加 Android 版(Kotlin),內購的產品 ID 用同一個 `goodnight_kingdom_full`。
