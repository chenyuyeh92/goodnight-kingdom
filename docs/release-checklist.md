# 公開上市前檢查清單

上市(正式公開、宣傳)之前要做的事。做完一項打勾。

- [ ] **拿掉測試按鈕:** `src/config/testTools.ts` 的 `TEST_TOOLS` 改成 `false`(選關畫面的「測試模式」按鈕、Shift+數字直接打關主都會消失)。改完跑 `npm test` 與 `npx playwright test`(測試模式的 e2e 會自動略過)。
- [ ] 世界 1 的暫代小頭目(大鬧鐘蟲、刺蝟隊長)換成美術畫的松鼠、河狸。
- [ ] 程式畫的暫代造型(駱駝、耳廓狐等,`src/art/placeholders.ts`)都換成美術的圖。
- [ ] 配樂定案(葉宸佑要改)。
