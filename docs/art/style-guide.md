# 《晚安王國》美術風格指南（草案 v0.1）

2026-10-21 建立。所有美術素材都照這份文件生成；改這份文件＝改全遊戲的風格，要先經葉宸佑同意。

## 1. 一句話風格

**粉彩水彩感的可愛夜晚世界**：清楚的深紫色外框、平塗加淡淡水彩暈染、圓滾滾的造型、腮紅。搞笑、療癒、溫暖，但線條乾淨、配色統一，避免廉價感。

## 2. 固定調色盤

| 名稱 | 色碼 | 用途 |
|---|---|---|
| 夜空藍紫（深） | `#2B2A6B` | 天空、遠景暗部 |
| 夜空藍紫（淺） | `#7B6BC9` | 遠山、霧、陰影 |
| 月光黃 | `#F8E08E` | 光源、月亮、重點高光、道具 |
| 奶油白 | `#FFF6E5` | 主體亮面、泡泡、枕頭 |
| 粉嫩腮紅 | `#F7A8C4` | 腮紅、可愛重點色 |
| 外框深紫 | `#3A2A5A` | 所有角色、武器、道具的外框 |

- 上面六色是**主色**。輔助色（天藍、青綠、淡橘等）可以用，但飽和度要比主色低，面積不要比主色大。
- 光源固定在**左上方**（月光）。
- 魔物、武器、道具的飽和度要**比背景高**，背景在遊戲區（地面附近）要比較安靜，讓玩家看得清楚。

## 3. 造型規則

- 外框：深紫色、粗細一致的實線；縮到遊戲大小後約 2 px（關主約 3 px）。
- 上色：平塗為主，暗部用淡淡的水彩暈染；不要寫實的光影、不要 3D 感。
- 比例：圓滾滾、大頭、短手短腳；臉部五官簡單，常帶腮紅。
- 魔物個性：「沒睡飽、很煩躁」，但不可怕（半閉眼、黑眼圈、嘟嘴）。
- 朝向：**魔物面向左**（朝玩家走來），**武器面向右**（裝在玩家右側）。

## 4. 素材尺寸（配合遊戲畫面 960×540，地面 y=480）

| 類型 | 遊戲內大小（參考） | 備註 |
|---|---|---|
| 小怪（鬧鐘蟲、咖啡豆精靈） | 高 48–64 px | 玩家站立判定 28×48，小怪不要比玩家大太多 |
| 熬夜蝙蝠 | 寬 48–56 px | 從上方飛來；要讓玩家「蹲下（判定 28×28）就能閃過」，所以飛行時身體底部不能低於地面上方 28 px（y < 452） |
| 中階怪（失眠刺蝟） | 高 64–80 px | |
| 關主（熬夜貓頭鷹） | 高 160–240 px | |
| 武器 | 寬 36–48 px | 顯示在角色右側 |
| 道具、寶箱 | 24–40 px | |
| 練習靶 | 40×40 | |
| 背景 | 960×540 起，橫向可延伸 | 分「遠景／中景／前景」三層，做視差捲動 |

生成時用大尺寸（1024×1024 或 1344×768），去背後縮小。素材一律存 PNG；背景以外的素材要透明背景。

## 4.5 介面（待補）

企劃 8.2 要求字型、按鈕、背包畫面也照這份指南做。等遊戲素材風格確認後再補這一節。

## 5. 生成方式（本機 ComfyUI）

- 模型：Animagine XL 4.0 opt（授權 CreativeML Open RAIL++-M，允許商用生成圖）
- 設定：28 步、CFG 5、euler_ancestral、normal

**共用風格詞（每張都加在最後）：**
```
watercolor (medium), thick outlines, dark purple outline, flat color, pastel colors, cute, chibi, round, blush, moonlight yellow and cream white and lavender, masterpiece, high score, great score, absurdres
```

**共用負面詞：**
```
lowres, worst quality, low quality, bad anatomy, text, signature, watermark, username, blurry, jpeg artifacts, realistic, photo, 3d, scary, gore, human, 1girl, 1boy, book, open book, paper
```

**各類型開頭：**
- 魔物：`no humans, <物種與特徵>, grumpy, sleepy eyes, eye bags, blush stickers, full body, from side, white background, simple background, ...`
- 武器／道具：`no humans, object focus, weapon, <外型>, from side, white background, simple background, ...`
- 背景：`no humans, scenery, <場景>, night, side view, wide shot, landscape, ...`（負面另加 `character, creature`）

注意：Animagine 是看「標籤」的模型，要用英文短詞、逗號分開；寫「storybook」之類的字會被當成真的「書」畫進去。

## 6. 去背與檔名

- 魔物、武器、道具都在白底生成，用「從四角填色去背」處理（適合有清楚外框的圖），再裁掉空白。
- 檔名用英文小寫加連字號，例如 `enemies/clockbug.png`、`weapons/pillow-cannon.png`、`backgrounds/insomnia-forest-far.png`。
- 遊戲要用的素材放在 `public/assets/` 底下（會跟著遊戲上線，記得縮到遊戲大小、控制檔案大小）；參考用的圖放 `docs/art/`。來源與授權記在 `docs/assets-licenses.md`。

## 7. 風格樣板圖（v0.1）的檢討

檔案：`docs/art/style-sample/`（只是參考，不進遊戲）
- `style-sample-closeup.png`：放大看細節
- `style-sample-gamescale.png`：照遊戲實際大小（白框＝玩家判定 28×48，白線＝地面 y=480）

看出來的問題（量產前要修）：
1. 背景是「往畫面深處走的小路」，不是橫向捲軸的側面視角；量產時要改成分層、側面的背景。
2. 地面附近的蘑菇太花、太亮，魔物會跟背景混在一起；遊戲區的前景要比較安靜。
3. 武器（枕頭砲）是疊起來的枕頭加砲管，造型還可以更像「砲」；外框偏紅棕色（約 `#4F2836`），不是規定的深紫，重做時提示詞要強調 dark purple outline。原圖砲口朝左，已左右翻轉成朝右。
