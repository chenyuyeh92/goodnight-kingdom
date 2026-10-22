# 世界 7「非洲大草原」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（透明 PNG、遊戲內 1 倍大小、魔物朝左、地面 y=480）。魔物名單是美術擬的，**請程式那邊和葉宸佑確認**。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w7-meerkat.png` | 熬夜狐獴（小怪） | 44×52 | |
| `public/assets/enemies/w7-meerkat-sleep.png` | 熬夜狐獴（小怪） 睡著 | 44×52 | |
| `public/assets/enemies/w7-coffee-warthog.png` | 咖啡疣豬（小怪） | 57×52 | |
| `public/assets/enemies/w7-coffee-warthog-sleep.png` | 咖啡疣豬（小怪） 睡著 | 56×52 | |
| `public/assets/enemies/w7-noisy-hornbill.png` | 吵鬧犀鳥（小怪） | 56×56 | |
| `public/assets/enemies/w7-noisy-hornbill-sleep.png` | 吵鬧犀鳥（小怪） 睡著 | 56×56 | |
| `public/assets/enemies/w7-rhino.png` | 失眠犀牛（中階） | 85×72 | |
| `public/assets/enemies/w7-rhino-sleep.png` | 失眠犀牛（中階） 睡著 | 85×72 | |
| `public/assets/enemies/w7-lion-king-boss.png` | 失眠獅子王（關主） | 218×220 | |
| `public/assets/enemies/w7-lion-king-boss-phase2.png` | 失眠獅子王（關主） 第二階段 | 233×220 | |
| `public/assets/enemies/w7-lion-king-boss-phase3.png` | 失眠獅子王（關主） 第三階段 | 240×220 | |
| `public/assets/enemies/w7-lion-king-boss-sleep.png` | 失眠獅子王（關主） 睡著 | 224×220 | |
| `public/assets/enemies/w7-wildebeest.png` | 奔跑的角馬（獸群用，程式重複排列） | 55×56 | 沒有睡著版 |
| `public/assets/items/w7-dust.png` | 獸群奔跑揚起的沙塵 | 64×32 | 程式畫，半透明 |
| `public/assets/items/w7-rock-platform.png` | 岩石平台 | 96×28 | 程式畫 |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 金合歡草原（白天） | `w7-s1-far.png` 1440×540 | `w7-s1-mid.png` 1440×540 | `w7-s1-near.png` 1440×540 |
| 2 | 過渡 | `w7-t12-far.png` 1440×540 | `w7-t12-mid.png` 1440×540 | `w7-t12-near.png` 1440×540 |
| 3 | 水塘（黃昏） | `w7-s2-far.png` 1440×540 | `w7-s2-mid.png` 1440×540 | `w7-s2-near.png` 1440×540 |
| 4 | 過渡 | `w7-t23-far.png` 1440×540 | `w7-t23-mid.png` 1440×540 | `w7-t23-near.png` 1440×540 |
| 5 | 星空草原（晚上） | `w7-s3-far.png` 1440×540 | `w7-s3-mid.png` 1440×540 | `w7-s3-near.png` 1440×540 |
| 6 | 過渡 | `w7-t34-far.png` 1440×540 | `w7-t34-mid.png` 1440×540 | `w7-t34-near.png` 1440×540 |
| 7 | 榮耀岩（深夜，關主戰） | `w7-s4-far.png` 1440×540 | `w7-s4-mid.png` 1440×540 | `w7-s4-near.png` 1440×540 |

## 已知問題

- 中景、近景、機關是程式畫的，比較簡單。
- 關主三個階段差別主要在表情和周圍特效，程式可以加變色或抖動。
- 飛行的小怪飛行時底部要高於 y=452，讓玩家蹲下能閃過。
