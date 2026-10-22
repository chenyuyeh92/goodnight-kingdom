# 世界 2「沙漠金字塔王國」素材清單（給程式那邊接）

2026-10-21 第一版。規格同第一關（`docs/art/level1-assets.md`）：透明 PNG（遠景除外）、遊戲內 1 倍大小、魔物朝左、地面 y=480。
魔物名單是美術擬的（見 `docs/art/worlds.md`），**請程式那邊確認**。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/w2-bell-scarab.png` | 叮噹聖甲蟲（小怪） | 43×52 |  |
| `public/assets/enemies/w2-bell-scarab-sleep.png` | 叮噹聖甲蟲 睡著 | 42×52 |  |
| `public/assets/enemies/w2-mummy-cat.png` | 熬夜木乃伊貓（小怪） | 56×52 |  |
| `public/assets/enemies/w2-mummy-cat-sleep.png` | 熬夜木乃伊貓 睡著 | 56×53 | 眼睛是半閉的，比較不像睡著，之後可再修 |
| `public/assets/enemies/w2-coffee-sand-snake.png` | 咖啡沙蛇（小怪） | 52×53 | 底下有一小堆沙，從流沙冒出時可直接用 |
| `public/assets/enemies/w2-coffee-sand-snake-sleep.png` | 咖啡沙蛇 睡著 | 52×53 |  |
| `public/assets/enemies/w2-insomnia-vulture.png` | 失眠禿鷹（小怪） | 60×56 | 正面展翅；飛行時底部要高於 y=452，讓玩家蹲下能閃過 |
| `public/assets/enemies/w2-insomnia-vulture-sleep.png` | 失眠禿鷹 睡著 | 59×56 |  |
| `public/assets/enemies/w2-desert-tortoise.png` | 失眠沙漠陸龜（中階） | 55×64 | 殼盾在左邊（朝玩家） |
| `public/assets/enemies/w2-desert-tortoise-sleep.png` | 失眠沙漠陸龜 睡著 | 56×64 |  |
| `public/assets/enemies/w2-sphinx-boss.png` | 睡不著的人面獅身（關主第一階段） | 205×200 | 貓臉、法老頭巾 |
| `public/assets/enemies/w2-sphinx-boss-phase2.png` | 人面獅身 第二階段 | 220×200 | 更生氣 |
| `public/assets/enemies/w2-sphinx-boss-phase3.png` | 人面獅身 第三階段 | 213×200 | 最生氣、身邊有碎石 |
| `public/assets/enemies/w2-sphinx-boss-sleep.png` | 人面獅身 睡著 | 206×200 |  |
| `public/assets/items/w2-quicksand.png` | 流沙地面 | 96×24 | 程式畫；橫向重複接續，最上面約 3 px 透明，放在地面 y=480 |
| `public/assets/items/w2-pressure-plate.png` | 壓力板 | 40×12 | 程式畫；平放在地面 |
| `public/assets/items/w2-falling-block.png` | 會掉下來的沙磚 | 40×39 |  |
| `public/assets/backgrounds/w2-desert-far.png` | 三層背景：遠景（夜空、金字塔、沙丘） | 1440×540 | 不透明；左右可無縫接續 |
| `public/assets/backgrounds/w2-desert-mid.png` | 三層背景：中景（方尖碑、棕櫚樹剪影） | 1393×540 | 透明；左右可無縫接續 |
| `public/assets/backgrounds/w2-desert-near.png` | 三層背景：近景（沙丘、仙人掌剪影） | 1440×540 | 程式畫；透明；沙丘頂約 y 487–505（地面線下），不擋魔物的腳 |

## 還沒做 / 已知問題

- 木乃伊貓睡著版眼睛是半閉的。
- 機關只有一種狀態（壓力板沒有「踩下去」、沙磚沒有「裂開掉落」的圖），需要的話再補。
- 魔物「打哈欠」的樣子沒做（同第一關）。
