# 世界 8「雲端高山」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（PNG 原檔、遊戲內 1 倍大小、魔物朝左、地面 y=480）。小怪名單美術擬定，**請程式那邊和葉宸佑確認**。Boss 見 `docs/art/bosses.md`，動畫格見 `docs/art/animations.md`。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w8-pika.png` | 熬夜鼠兔（小怪） | 48×51 | |
| `public/assets/enemies/w8-pika-sleep.png` | 熬夜鼠兔（小怪） 睡著 | 48×52 | |
| `public/assets/enemies/w8-coffee-cloud.png` | 咖啡雲精靈（小怪） | 56×51 | |
| `public/assets/enemies/w8-coffee-cloud-sleep.png` | 咖啡雲精靈（小怪） 睡著 | 55×52 | |
| `public/assets/enemies/w8-noisy-eagle.png` | 吵鬧老鷹（小怪，會飛） | 56×56 | |
| `public/assets/enemies/w8-noisy-eagle-sleep.png` | 吵鬧老鷹（小怪，會飛） 睡著 | 57×56 | |
| `public/assets/enemies/w8-yak.png` | 失眠犛牛（中階，角當盾） | 69×72 | |
| `public/assets/enemies/w8-yak-sleep.png` | 失眠犛牛（中階，角當盾） 睡著 | 65×72 | |
| `public/assets/items/w8-cloud-platform.png` | 雲朵平台 | 96×32 | 程式畫；上面是平的 |
| `public/assets/items/w8-wind.png` | 強風（往左吹） | 48×24 | 程式畫；半透明 |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 高山草甸（白天） | `w8-s1-far.png` 1440×540 | `w8-s1-mid.png` 1440×540 | `w8-s1-near.png` 1440×540 |
| 2 | 過渡 | `w8-t12-far.png` 1440×540 | `w8-t12-mid.png` 1440×540 | `w8-t12-near.png` 1440×540 |
| 3 | 雲海（黃昏） | `w8-s2-far.png` 1440×540 | `w8-s2-mid.png` 1440×540 | `w8-s2-near.png` 1440×540 |
| 4 | 過渡 | `w8-t23-far.png` 1440×540 | `w8-t23-mid.png` 1440×540 | `w8-t23-near.png` 1440×540 |
| 5 | 吊橋山崖（晚上） | `w8-s3-far.png` 1440×540 | `w8-s3-mid.png` 1440×540 | `w8-s3-near.png` 1440×540 |
| 6 | 過渡 | `w8-t34-far.png` 1440×540 | `w8-t34-mid.png` 1440×540 | `w8-t34-near.png` 1440×540 |
| 7 | 雷雲山頂（深夜，關主戰） | `w8-s4-far.png` 1440×540 | `w8-s4-mid.png` 1440×540 | `w8-s4-near.png` 1440×540 |

## 已知問題

- 中景、近景、機關是程式畫的，比較簡單。
- 飛行的小怪飛行時底部要高於 y=452，讓玩家蹲下能閃過。
