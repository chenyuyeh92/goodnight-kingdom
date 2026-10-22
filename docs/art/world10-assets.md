# 世界 10「月亮城堡」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（PNG 原檔、遊戲內 1 倍大小、魔物朝左、地面 y=480）。小怪名單美術擬定，**請程式那邊和葉宸佑確認**。Boss 見 `docs/art/bosses.md`，動畫格見 `docs/art/animations.md`。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w10-pillow-soldier.png` | 熬夜枕頭兵（小怪） | 44×60 | |
| `public/assets/enemies/w10-pillow-soldier-sleep.png` | 熬夜枕頭兵（小怪） 睡著 | 45×60 | |
| `public/assets/enemies/w10-coffee-teapot.png` | 咖啡茶壺精靈（小怪） | 48×56 | |
| `public/assets/enemies/w10-coffee-teapot-sleep.png` | 咖啡茶壺精靈（小怪） 睡著 | 48×56 | |
| `public/assets/enemies/w10-noisy-star.png` | 吵鬧小星星（小怪，會飛） | 41×56 | |
| `public/assets/enemies/w10-noisy-star-sleep.png` | 吵鬧小星星（小怪，會飛） 睡著 | 41×56 | |
| `public/assets/enemies/w10-clock-guard.png` | 失眠大鐘守衛（中階，拿盾） | 41×80 | |
| `public/assets/enemies/w10-clock-guard-sleep.png` | 失眠大鐘守衛（中階，拿盾） 睡著 | 42×80 | |
| `public/assets/items/w10-moon-platform.png` | 月亮平台 | 96×28 | 程式畫； |
| `public/assets/items/w10-star.png` | 星星（收集用） | 24×24 | 程式畫； |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 城下花園（白天） | `w10-s1-far.png` 1440×540 | `w10-s1-mid.png` 1440×540 | `w10-s1-near.png` 1440×540 |
| 2 | 過渡 | `w10-t12-far.png` 1440×540 | `w10-t12-mid.png` 1440×540 | `w10-t12-near.png` 1440×540 |
| 3 | 城牆（黃昏） | `w10-s2-far.png` 1440×540 | `w10-s2-mid.png` 1440×540 | `w10-s2-near.png` 1440×540 |
| 4 | 過渡 | `w10-t23-far.png` 1440×540 | `w10-t23-mid.png` 1440×540 | `w10-t23-near.png` 1440×540 |
| 5 | 城堡大廳（晚上） | `w10-s3-far.png` 1440×540 | `w10-s3-mid.png` 1440×540 | `w10-s3-near.png` 1440×540 |
| 6 | 過渡 | `w10-t34-far.png` 1440×540 | `w10-t34-mid.png` 1440×540 | `w10-t34-near.png` 1440×540 |
| 7 | 月光王座（深夜，最終魔王戰） | `w10-s4-far.png` 1440×540 | `w10-s4-mid.png` 1440×540 | `w10-s4-near.png` 1440×540 |

## 已知問題

- 中景、近景、機關是程式畫的，比較簡單。
- 吵鬧小星星是「騎在星星上的紫色小精靈」，不是星星本身長臉。
- 枕頭兵、茶壺精靈的睡著版眼睛不太像閉著；大鐘守衛的盾牌上有一張月亮臉。
- 飛行的小怪飛行時底部要高於 y=452，讓玩家蹲下能閃過。
