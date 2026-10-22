# 世界 4「冰雪極地」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（透明 PNG、遊戲內 1 倍大小、魔物朝左、地面 y=480）。魔物名單是美術擬的，**請程式那邊確認**。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w4-sleepy-penguin.png` | 熬夜企鵝（小怪） | 50×56 | |
| `public/assets/enemies/w4-sleepy-penguin-sleep.png` | 熬夜企鵝（小怪） 睡著 | 50×56 | |
| `public/assets/enemies/w4-coffee-snowman.png` | 咖啡雪人精靈（小怪） | 51×60 | |
| `public/assets/enemies/w4-coffee-snowman-sleep.png` | 咖啡雪人精靈（小怪） 睡著 | 52×60 | |
| `public/assets/enemies/w4-noisy-puffin.png` | 吵鬧海鸚（小怪） | 54×56 | |
| `public/assets/enemies/w4-noisy-puffin-sleep.png` | 吵鬧海鸚（小怪） 睡著 | 55×56 | |
| `public/assets/enemies/w4-walrus.png` | 失眠海象（中階） | 63×72 | |
| `public/assets/enemies/w4-walrus-sleep.png` | 失眠海象（中階） 睡著 | 63×72 | |
| `public/assets/enemies/w4-yeti-boss.png` | 失眠雪怪（關主） | 227×220 | |
| `public/assets/enemies/w4-yeti-boss-phase2.png` | 失眠雪怪（關主） 第二階段 | 228×220 | |
| `public/assets/enemies/w4-yeti-boss-phase3.png` | 失眠雪怪（關主） 第三階段 | 230×217 | |
| `public/assets/enemies/w4-yeti-boss-sleep.png` | 失眠雪怪（關主） 睡著 | 227×220 | |
| `public/assets/items/w4-ice-floor.png` | 很滑的冰地面 | 96×24 | 程式畫；橫向重複接續，放在地面 y=480 |
| `public/assets/items/w4-icicle.png` | 會掉下來的冰柱 | 24×56 | 程式畫 |
| `public/assets/items/w4-snow-platform.png` | 雪堆平台 | 96×28 | 程式畫；上面是可以站的平面 |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 雪原（白天） | `w4-s1-far.png` 1440×540 | `w4-s1-mid.png` 1440×540 | `w4-s1-near.png` 1440×540 |
| 2 | 過渡 | `w4-t12-far.png` 1440×540 | `w4-t12-mid.png` 1440×540 | `w4-t12-near.png` 1440×540 |
| 3 | 結冰的湖（黃昏） | `w4-s2-far.png` 1440×540 | `w4-s2-mid.png` 1440×540 | `w4-s2-near.png` 1440×540 |
| 4 | 過渡 | `w4-t23-far.png` 1440×540 | `w4-t23-mid.png` 1440×540 | `w4-t23-near.png` 1440×540 |
| 5 | 極光冰川（晚上） | `w4-s3-far.png` 1440×540 | `w4-s3-mid.png` 1440×540 | `w4-s3-near.png` 1440×540 |
| 6 | 過渡 | `w4-t34-far.png` 1440×540 | `w4-t34-mid.png` 1440×540 | `w4-t34-near.png` 1440×540 |
| 7 | 雪怪冰洞（深夜，關主戰） | `w4-s4-far.png` 1440×540 | `w4-s4-mid.png` 1440×540 | `w4-s4-near.png` 1440×540 |

## 已知問題

- 中景（雪松、蘆葦、冰晶、冰柱）和近景都是程式畫的，比較簡單；雪松是扁平三角形，和遠景畫風有落差。
- 白天雪原、深夜冰洞的遠景裡，模型自己加的小動物已經用旁邊的畫面蓋掉。
- 雪怪三個階段的差別在表情和周圍的雪花、冰塊，身形差不多，程式可以加變色或抖動。
- 海鸚是正面展翅（同蝙蝠），飛行時底部要高於 y=452，讓玩家蹲下能閃過。
