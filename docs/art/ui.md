# 封面與主頁（給程式那邊接）

2026-10-22 第一版。字型：jf open 粉圓（`public/assets/fonts/jf-openhuninn-2.1.ttf`，SIL OFL 1.1，可商用、可隨遊戲散布；**散布時要附 `jf-openhuninn-LICENSE.txt`**；不能單獨販售字型）。字型的漢字部分源自 Kosugi Maru（Apache-2.0），官方 release 只附 OFL 授權檔；保險起見散布時也可以附一份 Apache-2.0 全文。

| 檔案 | 內容 |
|---|---|
| `public/assets/ui/cover.png` | 封面完成圖（960×540） |
| `public/assets/ui/cover-bg.png` | 封面背景（1920×1080，不含標題和角色），主頁也用這張 |
| `public/assets/ui/cover-guard.png` | 封面上抱枕頭的小綿羊守衛（透明） |
| `public/assets/ui/logo.png` | 標題「晚安王國 Goodnight Kingdom」（透明，含光暈） |
| `public/assets/ui/button-normal.png`、`button-hover.png`、`button-pressed.png` | 空白按鈕三種狀態（240×64），按下時按鈕面往下 6 px |
| `public/assets/ui/button-<start/duo/draw/backpack/settings>[-hover/-pressed].png` | 帶字按鈕：開始遊戲、雙人遊戲、畫你的守衛、背包、設定，各三種狀態 |
| `public/assets/ui/panel.png` | 面板底（96×96，請用九宮格方式拉伸；底色本來就有一點透明） |
| `docs/art/ui/main-menu-mockup.png` | 主頁排版示意圖（只是參考） |

- 主頁有哪些按鈕由程式那邊決定，缺的按鈕文字可以請美術重跑 `docs/art/tools/make_ui.py`。
- 字型 4.9 MB：如果網頁執行時要用，建議子集化（只留用到的字）並轉 woff2；子集化後依 OFL 規定要改字型名稱（不能使用授權檔保留的名稱：open huninn、huninn、Varela、Varela Round），並仍附授權檔。
