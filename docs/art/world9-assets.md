# 世界 9「地底洞窟」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（PNG 原檔、遊戲內 1 倍大小、魔物朝左、地面 y=480）。小怪名單美術擬定，**請程式那邊和葉宸佑確認**。Boss 見 `docs/art/bosses.md`，動畫格見 `docs/art/animations.md`。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w9-mushroom-sprite.png` | 熬夜蘑菇精靈（小怪） | 46×56 | |
| `public/assets/enemies/w9-mushroom-sprite-sleep.png` | 熬夜蘑菇精靈（小怪） 睡著 | 46×56 | |
| `public/assets/enemies/w9-coffee-worm.png` | 咖啡蚯蚓（小怪） | 37×56 | |
| `public/assets/enemies/w9-coffee-worm-sleep.png` | 咖啡蚯蚓（小怪） 睡著 | 36×56 | |
| `public/assets/enemies/w9-noisy-moth.png` | 吵鬧發光蛾（小怪，會飛） | 52×56 | |
| `public/assets/enemies/w9-noisy-moth-sleep.png` | 吵鬧發光蛾（小怪，會飛） 睡著 | 53×56 | |
| `public/assets/enemies/w9-rhino-beetle.png` | 失眠獨角仙（中階，角當盾） | 58×72 | |
| `public/assets/enemies/w9-rhino-beetle-sleep.png` | 失眠獨角仙（中階，角當盾） 睡著 | 55×72 | |
| `public/assets/items/w9-crystal.png` | 發光水晶 | 24×36 | 程式畫；可當照明點；「只看得到附近」的黑暗遮罩請程式做 |
| `public/assets/items/w9-mine-platform.png` | 礦坑木板平台 | 96×24 | 程式畫； |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 礦坑入口（白天） | `w9-s1-far.png` 1440×540 | `w9-s1-mid.png` 1440×540 | `w9-s1-near.png` 1440×540 |
| 2 | 過渡 | `w9-t12-far.png` 1440×540 | `w9-t12-mid.png` 1440×540 | `w9-t12-near.png` 1440×540 |
| 3 | 水晶洞（黃昏） | `w9-s2-far.png` 1440×540 | `w9-s2-mid.png` 1440×540 | `w9-s2-near.png` 1440×540 |
| 4 | 過渡 | `w9-t23-far.png` 1440×540 | `w9-t23-mid.png` 1440×540 | `w9-t23-near.png` 1440×540 |
| 5 | 地下河（晚上） | `w9-s3-far.png` 1440×540 | `w9-s3-mid.png` 1440×540 | `w9-s3-near.png` 1440×540 |
| 6 | 過渡 | `w9-t34-far.png` 1440×540 | `w9-t34-mid.png` 1440×540 | `w9-t34-near.png` 1440×540 |
| 7 | 鼴鼠巢穴（深夜，關主戰） | `w9-s4-far.png` 1440×540 | `w9-s4-mid.png` 1440×540 | `w9-s4-near.png` 1440×540 |

## 已知問題

- 中景、近景、機關是程式畫的，比較簡單。
- 蘑菇精靈的睡著版眼睛只有半閉；身體偏人形。
- 飛行的小怪飛行時底部要高於 y=452，讓玩家蹲下能閃過。
