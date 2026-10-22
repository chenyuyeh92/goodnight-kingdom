# 世界 5「火山島」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（透明 PNG、遊戲內 1 倍大小、魔物朝左、地面 y=480）。魔物名單是美術擬的，**請程式那邊和葉宸佑確認**。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w5-fire-salamander.png` | 熬夜火蜥蜴（小怪） | 58×52 | |
| `public/assets/enemies/w5-fire-salamander-sleep.png` | 熬夜火蜥蜴（小怪） 睡著 | 59×52 | |
| `public/assets/enemies/w5-coffee-lava-blob.png` | 咖啡熔岩團子（小怪） | 50×56 | |
| `public/assets/enemies/w5-coffee-lava-blob-sleep.png` | 咖啡熔岩團子（小怪） 睡著 | 50×56 | |
| `public/assets/enemies/w5-noisy-volcano-bird.png` | 吵鬧火山鳥（小怪） | 60×50 | |
| `public/assets/enemies/w5-noisy-volcano-bird-sleep.png` | 吵鬧火山鳥（小怪） 睡著 | 60×49 | |
| `public/assets/enemies/w5-armadillo.png` | 失眠犰狳（中階） | 59×72 | |
| `public/assets/enemies/w5-armadillo-sleep.png` | 失眠犰狳（中階） 睡著 | 57×72 | |
| `public/assets/enemies/w5-fire-dragon-boss.png` | 熬夜火龍（關主） | 197×220 | |
| `public/assets/enemies/w5-fire-dragon-boss-phase2.png` | 熬夜火龍（關主） 第二階段 | 189×220 | |
| `public/assets/enemies/w5-fire-dragon-boss-phase3.png` | 熬夜火龍（關主） 第三階段 | 204×220 | |
| `public/assets/enemies/w5-fire-dragon-boss-sleep.png` | 熬夜火龍（關主） 睡著 | 193×220 | |
| `public/assets/items/w5-lava-floor.png` | 熔岩地面 | 96×24 | 程式畫；橫向重複接續，碰到會受傷 |
| `public/assets/items/w5-falling-rock.png` | 噴發落石 | 36×36 | 程式畫 |
| `public/assets/items/w5-rock-platform.png` | 岩石平台 | 96×28 | 程式畫 |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 黑沙灘（白天） | `w5-s1-far.png` 1440×540 | `w5-s1-mid.png` 1440×540 | `w5-s1-near.png` 1440×540 |
| 2 | 過渡 | `w5-t12-far.png` 1440×540 | `w5-t12-mid.png` 1440×540 | `w5-t12-near.png` 1440×540 |
| 3 | 火山森林（黃昏） | `w5-s2-far.png` 1440×540 | `w5-s2-mid.png` 1440×540 | `w5-s2-near.png` 1440×540 |
| 4 | 過渡 | `w5-t23-far.png` 1440×540 | `w5-t23-mid.png` 1440×540 | `w5-t23-near.png` 1440×540 |
| 5 | 熔岩河（晚上） | `w5-s3-far.png` 1440×540 | `w5-s3-mid.png` 1440×540 | `w5-s3-near.png` 1440×540 |
| 6 | 過渡 | `w5-t34-far.png` 1440×540 | `w5-t34-mid.png` 1440×540 | `w5-t34-near.png` 1440×540 |
| 7 | 火山口（深夜，關主戰） | `w5-s4-far.png` 1440×540 | `w5-s4-mid.png` 1440×540 | `w5-s4-near.png` 1440×540 |

## 已知問題

- 中景、近景、機關是程式畫的，比較簡單。
- 關主三個階段差別主要在表情和周圍特效，程式可以加變色或抖動。
- 飛行的小怪飛行時底部要高於 y=452，讓玩家蹲下能閃過。
