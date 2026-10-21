# 世界 3「亞特蘭提斯海底王國」素材清單（給程式那邊接）

2026-10-22 第一版。規格同前（透明 PNG、遊戲內 1 倍大小、魔物朝左、地面 y=480）。魔物名單是美術擬的，**請程式那邊確認**。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w3-sleepy-jellyfish.png` | 熬夜水母（小怪） | 46×60 | |
| `public/assets/enemies/w3-sleepy-jellyfish-sleep.png` | 熬夜水母（小怪） 睡著 | 48×56 | |
| `public/assets/enemies/w3-alarm-clownfish.png` | 鬧鐘小丑魚（小怪） | 59×48 | |
| `public/assets/enemies/w3-alarm-clownfish-sleep.png` | 鬧鐘小丑魚（小怪） 睡著 | 57×48 | |
| `public/assets/enemies/w3-coffee-octopus.png` | 咖啡章魚（小怪） | 52×56 | |
| `public/assets/enemies/w3-coffee-octopus-sleep.png` | 咖啡章魚（小怪） 睡著 | 52×56 | |
| `public/assets/enemies/w3-puffer-fish.png` | 氣鼓鼓河豚（中階） | 66×72 | |
| `public/assets/enemies/w3-puffer-fish-sleep.png` | 氣鼓鼓河豚（中階） 睡著 | 66×72 | |
| `public/assets/enemies/w3-nessie-boss.png` | 尼斯湖水怪（關主） | 239×220 | |
| `public/assets/enemies/w3-nessie-boss-phase2.png` | 尼斯湖水怪（關主） 第二階段 | 238×220 | |
| `public/assets/enemies/w3-nessie-boss-phase3.png` | 尼斯湖水怪（關主） 第三階段 | 237×220 | |
| `public/assets/enemies/w3-nessie-boss-sleep.png` | 尼斯湖水怪（關主） 睡著 | 238×220 | |

## 場景背景（`public/assets/backgrounds/`，接法同 `docs/art/scenes.md`）

| 順序 | 場景 | 遠景 | 中景 | 近景 |
|---|---|---|---|---|
| 1 | 珊瑚礁淺海（白天） | `w3-s1-far.png` 1440×540 | `w3-s1-mid.png` 1551×540 | `w3-s1-near.png` 583×540 |
| 2 | 過渡 | `w3-t12-far.png` 1440×540 | `w3-t12-mid.png` 1440×540 | `w3-t12-near.png` 1440×540 |
| 3 | 沉船拱門（黃昏） | `w3-s2-far.png` 1440×540 | `w3-s2-mid.png` 1554×540 | `w3-s2-near.png` 563×540 |
| 4 | 過渡 | `w3-t23-far.png` 1440×540 | `w3-t23-mid.png` 1440×540 | `w3-t23-near.png` 1440×540 |
| 5 | 深海遺跡（晚上） | `w3-s3-far.png` 1440×540 | `w3-s3-mid.png` 1540×540 | `w3-s3-near.png` 891×540 |
| 6 | 過渡 | `w3-t34-far.png` 1440×540 | `w3-t34-mid.png` 1440×540 | `w3-t34-near.png` 1440×540 |
| 7 | 亞特蘭提斯神殿（深夜，關主戰） | `w3-s4-far.png` 1440×540 | `w3-s4-mid.png` 1418×540 | `w3-s4-near.png` 1440×540 |

## 已知問題

- 小丑魚、水怪、河豚腳下畫了一圈水面／水窪，放在海底有點怪，之後可再修。
- 咖啡章魚睡著版眼睛只有半閉；水怪第三階段跟第一階段差別小，程式可以加變色或抖動。
- 深夜神殿的遠景是把較亮的圖用程式壓暗的，比較暗、細節少。
- 四個場景的近景（海草、海床）都是程式畫的，比較簡單。
- 白天珊瑚礁和晚上遺跡的遠景，看起來有點像「海面上」而不是海底。
- 晚上遺跡中景兩根柱子中間有一個雕像剪影，看起來像人影。
