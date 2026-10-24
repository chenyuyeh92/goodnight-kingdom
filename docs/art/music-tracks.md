# 十個世界的配樂音檔（給遊戲組）

2026-10-24 由美術／配樂這邊交付。每個世界 3 首（白天、黃昏、晚上），**晚上那首同時用在深夜關主戰**；只有世界 1 的關主戰另外有一首（`w01-boss.mp3`）。共 31 個檔案，放在 `public/assets/music/`。2026-10-25 另外補交主選單 `menu.mp3`（見「怎麼接進遊戲」最後的「主選單」）。

## 檔案規格

- MP3、**單聲道、128 kbps、48 kHz**（符合 `public/assets/music/README.md` 的建議）。總共約 19 MB。
- 每個檔案就是**剛好一輪**，頭尾可以無縫接上（錄的是第二輪的穩定狀態，已經包含上一輪殘響的尾巴）。
- 每個檔案最前面有一個 **Info／LAME 標頭**，記錄 MP3 編碼器的延遲（標頭寫 576，解碼器再加 529，總共開頭多出 1105 個樣本）與尾端的補零。Chrome 的 `decodeAudioData` 會依這個標頭自動裁掉，解碼後長度跟原始樣本數完全相同（已用 Chrome 全部驗證，見 `docs/art/music-render-report.json` 的 `decodedSamples`）。所以照現在 `src/audio/audio.ts` 的 `source.loop = true` 直接循環就會無縫。
- **iPhone 也驗證過**（2026-10-24，負責人的 iPhone，iOS 18.7 Safari）：測試的三首解碼長度都等於原始樣本數、開頭沒有空白，取樣率 48000，循環播放接縫正常。所以 iPhone 上也不用設定 loopStart／loopEnd。
  - 備案（萬一之後遇到不會裁的瀏覽器，解碼長度比下表多）：用秒數設定 `source.loopStart = 1105 / 48000`（若該瀏覽器不認得 Info 標頭則用 `2257 / 48000`）、`source.loopEnd = loopStart + 樣本數 / 48000`，並用 `source.start(0, source.loopStart)` 開始播。
- 音量：只有超過 −1 dBFS 的地方才壓低（世界 2 白天、黃昏、世界 5 晚上），其餘保持各首原本的大小，所以晚上的曲子本來就比白天小聲一點，是刻意的。

## 檔案對照

| 世界 | 用在哪裡 | 檔名 | 一輪秒數 | 樣本數（48 kHz） | 大小 |
|---|---|---|---|---|---|
| w01 失眠森林 | 白天 | `w01-day.mp3` | 35.5556 | 1706667 | 556 KB |
| w01 失眠森林 | 黃昏 | `w01-dusk.mp3` | 40 | 1920000 | 625 KB |
| w01 失眠森林 | 晚上 | `w01-night.mp3` | 41.7391 | 2003478 | 653 KB |
| w01 失眠森林 | 深夜關主戰 | `w01-boss.mp3` | 38.4 | 1843200 | 600 KB |
| w02 沙漠金字塔王國 | 白天 | `w02-day.mp3` | 34.2857 | 1645714 | 536 KB |
| w02 沙漠金字塔王國 | 黃昏 | `w02-dusk.mp3` | 38.4 | 1843200 | 600 KB |
| w02 沙漠金字塔王國 | 晚上、深夜關主戰 | `w02-night.mp3` | 45.7143 | 2194286 | 715 KB |
| w03 海底王國 | 白天 | `w03-day.mp3` | 30 | 1440000 | 469 KB |
| w03 海底王國 | 黃昏 | `w03-dusk.mp3` | 34.2857 | 1645714 | 536 KB |
| w03 海底王國 | 晚上、深夜關主戰 | `w03-night.mp3` | 40 | 1920000 | 625 KB |
| w04 冰雪極地 | 白天 | `w04-day.mp3` | 29.0909 | 1396364 | 455 KB |
| w04 冰雪極地 | 黃昏 | `w04-dusk.mp3` | 35.5556 | 1706667 | 556 KB |
| w04 冰雪極地 | 晚上、深夜關主戰 | `w04-night.mp3` | 41.7391 | 2003478 | 653 KB |
| w05 火山島 | 白天 | `w05-day.mp3` | 34.2857 | 1645714 | 536 KB |
| w05 火山島 | 黃昏 | `w05-dusk.mp3` | 34.2857 | 1645714 | 536 KB |
| w05 火山島 | 晚上、深夜關主戰 | `w05-night.mp3` | 34.2857 | 1645714 | 536 KB |
| w06 熱帶雨林 | 白天 | `w06-day.mp3` | 24 | 1152000 | 375 KB |
| w06 熱帶雨林 | 黃昏 | `w06-dusk.mp3` | 24 | 1152000 | 375 KB |
| w06 熱帶雨林 | 晚上、深夜關主戰 | `w06-night.mp3` | 24 | 1152000 | 375 KB |
| w07 非洲大草原 | 白天 | `w07-day.mp3` | 33.1034 | 1588966 | 518 KB |
| w07 非洲大草原 | 黃昏 | `w07-dusk.mp3` | 33.1034 | 1588966 | 518 KB |
| w07 非洲大草原 | 晚上、深夜關主戰 | `w07-night.mp3` | 43.6364 | 2094545 | 682 KB |
| w08 雲端高山 | 白天 | `w08-day.mp3` | 53.3333 | 2560000 | 834 KB |
| w08 雲端高山 | 黃昏 | `w08-dusk.mp3` | 53.3333 | 2560000 | 834 KB |
| w08 雲端高山 | 晚上、深夜關主戰 | `w08-night.mp3` | 53.3333 | 2560000 | 834 KB |
| w09 地底洞窟 | 白天 | `w09-day.mp3` | 40 | 1920000 | 625 KB |
| w09 地底洞窟 | 黃昏 | `w09-dusk.mp3` | 24 | 1152000 | 375 KB |
| w09 地底洞窟 | 晚上、深夜關主戰 | `w09-night.mp3` | 64 | 3072000 | 1000 KB |
| w10 月亮城堡 | 白天 | `w10-day.mp3` | 48 | 2304000 | 750 KB |
| w10 月亮城堡 | 黃昏 | `w10-dusk.mp3` | 48 | 2304000 | 750 KB |
| w10 月亮城堡 | 晚上、深夜關主戰 | `w10-night.mp3` | 48 | 2304000 | 750 KB |
| 主選單 | 主頁、選關、背包、守衛房間、設定、開頭動畫、結尾動畫 | `menu.mp3` | 43.6364 | 2094545 | 683 KB |

## 怎麼接進遊戲

現在的 `tracks.json` 只有 `menu`、`day`、`dusk`、`night`、`boss` 五個名稱，是全遊戲共用的；這次的配樂是**每個世界各自一套**。建議遊戲組把曲目名稱擴充成「世界＋時段」，例如：

```json
{
  "w01-day": "w01-day.mp3", "w01-dusk": "w01-dusk.mp3", "w01-night": "w01-night.mp3", "w01-boss": "w01-boss.mp3",
  "w02-day": "w02-day.mp3", "w02-dusk": "w02-dusk.mp3", "w02-night": "w02-night.mp3", "w02-boss": "w02-night.mp3"
}
```

（世界 2–10 的 `boss` 都指向該世界的 `night` 檔。）（2026-10-25 更新：遊戲組已經接上——main 的 `tunes.ts` 有 `WorldTrackId`，`tracks.json` 也已登記 40 筆世界曲目。）美術這邊沒有改 `tracks.json` 和 `src/`。

**主選單 `menu.mp3`（2026-10-25 補交）**：負責人選定「冒險前的晚安」（C 大調 ♩88、柔和鋼琴＋法國號，每四小節用月亮城堡號角的節奏起句）。負責人指定用在**主選單（主頁、選關、背包、守衛房間、設定）以及開頭動畫、結尾動畫**。`StoryScene` 開頭已經是 `audio.music('menu')`、`menu` 也已在 `TUNES` 裡，所以只要在 `tracks.json` 加一行 `"menu": "menu.mp3"` 就會換掉原本的合成搖籃曲（美術這邊沒動 `tracks.json`，避免跟 main 衝突）。錄音時整首加大 4 dB，跟各世界的音量差不多。

## 來源與重做

- 曲子都是這次原創、用程式即時合成（Web Audio），沒有用任何取樣或別人的錄音。試聽頁原始檔在 `docs/art/music-sources/`。
- 錄音工具在 `docs/art/tools/music/`：`server.js`＋`harness.html`，用無頭 Chrome 的 OfflineAudioContext 離線算出聲音，再用 lamejs（npm `lamejs@1.2.1`）編成 MP3。重做方法：在該資料夾 `npm install lamejs@1.2.1`，執行 `node server.js ../../../../public/assets/music`（只重錄主選單：`node server.js ../../../../public/assets/music "?only=menu"`）（`server.js` 裡的 Chrome 路徑是 Windows 的預設位置）。產生的 `_render-report.json` 要搬到 `docs/art/music-render-report.json`，不要留在音樂資料夾（只重錄部分曲子時，報告裡只有那幾筆，要**合併**進去、不要整個覆蓋）；`node_modules`、`chrome-profile`、`render-log.txt`、`package*.json` 已列進 `.gitignore`。
- 各首的定案過程記在工作室的 `CLAUDE.md`「配樂」一節。
