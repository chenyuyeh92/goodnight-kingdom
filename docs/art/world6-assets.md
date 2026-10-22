# 世界 6「熱帶雨林」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（透明 PNG、遊戲內 1 倍大小、魔物朝左、地面 y=480）。魔物名單是美術擬的，**請程式那邊和葉宸佑確認**。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w6-tree-frog.png` | 熬夜樹蛙（小怪） | 52×48 | |
| `public/assets/enemies/w6-tree-frog-sleep.png` | 熬夜樹蛙（小怪） 睡著 | 52×49 | |
| `public/assets/enemies/w6-coffee-chameleon.png` | 咖啡變色龍（小怪） | 51×56 | |
| `public/assets/enemies/w6-coffee-chameleon-sleep.png` | 咖啡變色龍（小怪） 睡著 | 51×56 | |
| `public/assets/enemies/w6-alarm-parrot.png` | 鬧鐘鸚鵡（小怪） | 53×56 | |
| `public/assets/enemies/w6-alarm-parrot-sleep.png` | 鬧鐘鸚鵡（小怪） 睡著 | 53×56 | |
| `public/assets/enemies/w6-pangolin.png` | 失眠穿山甲（中階） | 63×72 | |
| `public/assets/enemies/w6-pangolin-sleep.png` | 失眠穿山甲（中階） 睡著 | 63×72 | |
| `public/assets/enemies/w6-gorilla-boss.png` | 吵鬧大猩猩（關主） | 173×220 | |
| `public/assets/enemies/w6-gorilla-boss-phase2.png` | 吵鬧大猩猩（關主） 第二階段 | 172×220 | |
| `public/assets/enemies/w6-gorilla-boss-phase3.png` | 吵鬧大猩猩（關主） 第三階段 | 170×220 | |
| `public/assets/enemies/w6-gorilla-boss-sleep.png` | 吵鬧大猩猩（關主） 睡著 | 172×220 | |
| `public/assets/items/w6-vine.png` | 可以抓住盪過去的藤蔓 | 20×160 | 程式畫；20×160，頂端掛在上方 |
| `public/assets/items/w6-log-platform.png` | 木頭平台 | 96×28 | 程式畫 |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 河邊雨林（白天） | `w6-s1-far.png` 1440×540 | `w6-s1-mid.png` 1440×540 | `w6-s1-near.png` 1440×540 |
| 2 | 過渡 | `w6-t12-far.png` 1440×540 | `w6-t12-mid.png` 1440×540 | `w6-t12-near.png` 1440×540 |
| 3 | 瀑布（黃昏） | `w6-s2-far.png` 1440×540 | `w6-s2-mid.png` 1440×540 | `w6-s2-near.png` 1440×540 |
| 4 | 過渡 | `w6-t23-far.png` 1440×540 | `w6-t23-mid.png` 1440×540 | `w6-t23-near.png` 1440×540 |
| 5 | 樹冠（晚上） | `w6-s3-far.png` 1440×540 | `w6-s3-mid.png` 1440×540 | `w6-s3-near.png` 1440×540 |
| 6 | 過渡 | `w6-t34-far.png` 1440×540 | `w6-t34-mid.png` 1440×540 | `w6-t34-near.png` 1440×540 |
| 7 | 叢林遺跡（深夜，關主戰） | `w6-s4-far.png` 1440×540 | `w6-s4-mid.png` 1440×540 | `w6-s4-near.png` 1440×540 |

## 已知問題

- 中景、近景、機關是程式畫的，比較簡單。
- 關主三個階段差別主要在表情和周圍特效，程式可以加變色或抖動。
- 飛行的小怪飛行時底部要高於 y=452，讓玩家蹲下能閃過。
- 遠景裡模型自己加的小動物、人影（世界 7 還有多出來的月亮）已用旁邊的畫面蓋掉。
- 穿山甲的睡著版眼睛只有半閉。
