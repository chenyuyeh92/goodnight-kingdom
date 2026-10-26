# 上架用的宣傳影片與圖片

2026-10-25 製作。影片和截圖由 `tools/promo/record.cjs`(錄遊戲畫面)與 `tools/promo/assemble.py`(剪接、配樂、字幕)產生;遊戲改版後可以照下面的步驟重錄。

## 影片內容(60 秒版)

| 時間 | 畫面 | 配樂 | 字幕 |
|---|---|---|---|
| 0:00–0:03 | 標題卡(封面、標誌) | 主選單〈冒險前的晚安〉 | 魔物都失眠了! |
| 0:03–0:09 | 開場繪本:魔物睡不著、吵翻王國、守衛出發 | 主選單 | (繪本自己的字) |
| 0:09–0:15 | 世界 1:哈欠泡泡把魔物哄睡 | 世界 1 白天 | 用哈欠泡泡,把失眠的魔物一隻一隻哄睡 |
| 0:15–0:21 | 畫守衛:畫一隻白色小兔、上色、取名、存起來(加快) | 世界 2 白天 | 畫一個自己的守衛 |
| 0:21–0:26 | 用剛畫的小兔在世界 2(沙漠)冒險 | 世界 2 白天 | 帶著它一起去冒險! |
| 0:26–0:33 | 世界 3(海底):開寶箱、換各種武器 | 世界 3 白天 | 寶箱裡藏著十種神奇武器 |
| 0:33–0:50 | 世界 4–10 各 2.5 秒(冰面、火山、藤蔓、獸群、強風、黃昏的黑暗洞窟 9-2、月亮城堡) | 各世界自己的配樂 | 世界名稱;上方「十個世界的冒險」 |
| 0:50–0:54 | 兩個人一起玩 | 世界 1 關主曲 | 兩支手機連線,一起玩 |
| 0:54–0:57 | 最後的魔王夢貘 | 世界 10 晚上 | 是誰偷走了大家的睡意? |
| 0:57–1:00 | 結尾卡 | 主選單 | 免費玩世界 1–3 · 完整版解鎖十個世界;網址;即將上架 |

30 秒版(App Store 預覽)是同樣的順序,每段縮短,沒有開頭標題卡和魔王。

## 檔案與用途

| 檔案 | 規格 | 用在哪裡 |
|---|---|---|
| `promo-zh-1080p.mp4`、`promo-en-1080p.mp4` | 60 秒,1920×1080,H.264,AAC 立體聲 | 上傳 YouTube(Google Play 只收 YouTube 連結)、網站 |
| `appstore-zh-iphone.mp4`、`appstore-en-iphone.mp4` | 30 秒,1920×886,30 fps(遊戲畫面縮小放中間,左右補夜空色,才不會切到愛心或角色的腳) | App Store「App 預覽」iPhone 6.5/6.9 吋(橫式) |
| `appstore-zh-ipad.mp4`、`appstore-en-ipad.mp4` | 30 秒,1600×1200,30 fps | App Store「App 預覽」iPad 13 吋(橫式) |
| `promo-zh-vertical.mp4`、`promo-en-vertical.mp4` | 60 秒,1080×1920 | 社群(Reels/Shorts)、家教網作品卡(跟其他作品的直式影片一樣) |

### App Store「App 預覽」的規定(重點)
- 長度 15–30 秒,每種語言最多 3 支;畫面要是 App 裡真的畫面(可以加字幕、旁白)。
- 尺寸要剛好:iPhone 6.5/6.9 吋橫式 1920×886;iPad 13 吋橫式 1600×1200。
- 30 fps 以下、H.264、AAC 立體聲。
- App 有內購時,畫面裡出現要買才能玩的內容(世界 4–10),要讓人看得出來要另外購買:結尾卡寫了「免費玩世界 1–3 · 完整版解鎖十個世界」。

### Google Play
- 宣傳影片只收 YouTube 網址:把 `promo-zh-1080p.mp4` 上傳到 YouTube(可以設「不公開」),關掉廣告,把網址貼到 Play Console。
- 另外要準備:App 圖示 512×512、主題圖片(橫幅)1024×500、手機截圖至少 2 張(16:9)。

## 重錄的步驟

```sh
npm run build:e2e
npx vite preview --port 4173 &
node tools/promo/record.cjs /tmp/promo-raw-zh zh
node tools/promo/record.cjs /tmp/promo-raw-en en
python3 tools/promo/assemble.py /tmp/promo-raw-zh <輸出資料夾> zh
python3 tools/promo/assemble.py /tmp/promo-raw-en <輸出資料夾> en
```

`record.cjs` 最後可以加段落名稱只重錄某幾段,例如 `node tools/promo/record.cjs /tmp/promo-raw-zh zh draw,w6`。分鏡(每段從第幾秒剪、多長、配哪首曲子)在 `assemble.py` 的 `LONG`、`SHORT`。
