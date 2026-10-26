# 交接:在 App Store Connect 建立《晚安王國》(2026-10-26)

給另一個對話(有瀏覽器的 Claude)用。程式和說明都已經做好,這份只講 **App Store Connect 網頁上要做的事**。完整版說明在 `docs/app-store.md`。

- 專案:GitHub `chenyuyeh92/goodnight-kingdom`(main 分支;開發分支 `claude/ai-game-dev-workflow-dqbe1t` 內容相同)。
- 使用者:葉宸佑(鋼琴老師),請用繁體中文溝通。
- **登入 Apple、雙重認證、簽合約、填銀行與稅務資料,一律由葉宸佑本人操作**;Claude 只協助看畫面、填一般表單,不要經手密碼。
- 美術規定:不要放人或小孩的臉。

## 已經決定的事

| 項目 | 內容 |
|---|---|
| App 名稱 | 晚安王國(英文介面顯示 Goodnight Kingdom) |
| Bundle ID | `com.chenyuyeh.goodnightkingdom` |
| SKU | `goodnight-kingdom` |
| 主要語言 | 繁體中文;另加英文(美國)本地化 |
| 價格 | App 免費下載;世界 1–3 免費 |
| 內購 | 非消耗型,參考名稱「完整版」,產品 ID **`goodnight_kingdom_full`**(一字不差),價格**台幣 100 元那一級** |
| 類別 | 主要:遊戲 → 動作;次要:遊戲 → 家庭。**不要放「兒童」分類**(不勾 Made for Kids) |
| 裝置 | iPhone、iPad,只能橫向 |
| 內購技術 | 直接用 Apple 內購(App 裡用 expo-iap),沒有 RevenueCat、沒有自己的伺服器 |

## 要在 App Store Connect 做的事(照順序)

1. **商務(Business)**:簽「付費 App」合約,填好銀行帳戶、稅務資料(本人操作)。沒生效的話,審核時抓不到內購會被退件。
2. **App → + → 新增 App**:平台 iOS、名稱「晚安王國」、主要語言繁體中文、Bundle ID 上表那個(清單裡沒有的話,到 developer.apple.com → Identifiers 新增,或之後第一次 EAS 打包時自動建立)、SKU `goodnight-kingdom`。
3. 記下「App 資訊」頁的 **Apple ID(一串數字)** → 要填進 `app/eas.json` 的 `submit.production.ios.ascAppId`(目前是一段中文說明的佔位文字),改完 commit。
4. **營利 → App 內購買項目 → +**:
   - 非消耗型;參考名稱「完整版」;產品 ID `goodnight_kingdom_full`;價格台幣 100 元。
   - 繁中:顯示名稱「完整版」,描述「解鎖世界 4–10 和結局,一次購買永久遊玩」。
   - 英文:「Full Version」,「Unlock Worlds 4–10 and the ending. Buy once, play forever.」
   - 審核截圖:`iap-review.jpg`(葉宸佑在先前的對話收到的截圖壓縮檔裡;也可以用 `node tools/promo/screens.cjs` 重新產生)。
   - 審核備註:「在選關畫面切到世界 4(或打完 3-3 按『解鎖完整版』),按『解鎖完整版』購買;『恢復購買』在同一個畫面。」
5. **App 隱私權**:隱私權政策網址 `https://chenyuyeh92.github.io/goodnight-kingdom/privacy.html`;「是否收集資料」→ **否**(沒有帳號、廣告、分析;購買由 Apple 處理;線上雙人的連線資訊不保存、不連到身分)。
6. **App 資訊**:類別照上表;支援網址 `https://chenyuyeh92.github.io/goodnight-kingdom/support.html`;行銷網址(選填)`https://chenyuyeh92.github.io/goodnight-kingdom/`。
7. **年齡分級問卷**:卡通或奇幻暴力 →「不常/輕微」;其他都「無」;無限制網頁存取 → 否;使用者產生內容/聊天 → 否。預期 4+。
8. 1.0 版頁面的文字(副標題、描述、關鍵字)在 `docs/store-listing.md`(中英文都有,價格段落已寫好)。截圖檔名:`iphone-zh-1-menu.jpg`… 放 iPhone 6.9 吋,`ipad-zh-1-menu.jpg`… 放 iPad 13 吋;英文版用 `-en-`。

**「建置版本」「提交以供審核」現在還不能做**:要等第一次 EAS 打包、送到 TestFlight 之後(`docs/app-store.md` 第 3–5 步)。第一次打包要葉宸佑在自己電腦的 `app/` 資料夾執行 `npx.cmd eas-cli@latest build --platform ios --profile production`,會要求登入 Apple。

## 送審時要貼的審核備註

> 晚安王國是可愛風格的 2D 橫向射擊遊戲,沒有帳號、沒有廣告。世界 1–3 免費;要測試內購:在主選單按「開始遊戲」(第一次會先播開場故事,點畫面就會往下)→ 選關畫面按右上的「世界 N →」三次,切到世界 4 → 按「解鎖完整版」(「恢復購買」在旁邊)。線上雙人要兩台裝置:一台按「雙人遊戲 → 開房間」,另一台「加入房間」輸入六位數房號。
>
> Goodnight Kingdom is a cute 2D side-scrolling shooter. No account and no ads. Worlds 1–3 are free. To test the in-app purchase: tap Start (the first time, a short opening story plays; tap to advance) → on the level select screen tap the top-right "World N →" button three times to reach World 4 → "Unlock full version" ("Restore purchase" is next to it). Online co-op needs two devices: one taps Two Players → Open a room, the other Join a room and enters the 6-digit room number.

## 還沒驗證、要注意的

- App 裡的 Swift 本機伺服器(`app/modules/game-server/ios/`)在雲端無法編譯,**第一次 EAS 打包才是真正的檢查**;打包失敗時把錯誤訊息帶回來修。
- 送審前一天用網頁版開一次「雙人遊戲 → 開房間」,確認 Supabase 免費專案沒有被暫停(一週沒人用會暫停)。
