# 第一關素材清單（給程式那邊接）

2026-10-21 第一版。全部是透明背景 PNG（背景除外），已經縮成遊戲內大小（1 倍，畫面 960×540）。
魔物朝左、武器朝右、道具正面。地面 y=480，素材底部對齊地面即可。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/clockbug.png` | 吵鬧鬧鐘蟲（小怪） | 48×56 | 抱著一個鬧鐘 |
| `public/assets/enemies/coffee-bean-sprite.png` | 咖啡豆精靈（小怪） | 39×52 | 腳下有一點咖啡渣 |
| `public/assets/enemies/night-bat.png` | 熬夜蝙蝠（小怪） | 56×56 | 正面，拿咖啡杯；飛行時底部要高於 y=452，讓玩家蹲下能閃過 |
| `public/assets/enemies/insomnia-hedgehog.png` | 失眠刺蝟（中階） | 80×72 | 刺在背上（企劃是正面刺盾，之後可再調） |
| `public/assets/enemies/night-owl-boss.png` | 熬夜貓頭鷹（關主） | 181×200 | 戴睡帽、拿咖啡杯 |
| `public/assets/weapons/yawn-bubble.png` | 哈欠泡泡 | 43×36 | |
| `public/assets/weapons/sheep-machine-gun.png` | 數羊機槍 | 48×21 | |
| `public/assets/weapons/pillow-cannon.png` | 枕頭砲 | 43×36 | |
| `public/assets/weapons/milk-spray.png` | 晚安牛奶噴霧 | 41×36 | |
| `public/assets/weapons/lullaby-harp.png` | 搖籃曲豎琴 | 40×38 | |
| `public/assets/weapons/blanket-boomerang.png` | 棉被迴力鏢 | 40×37 | |
| `public/assets/weapons/moon-lamp.png` | 月亮催眠燈 | 27×40 | |
| `public/assets/items/hot-cocoa.png` | 熱可可 | 23×32 | |
| `public/assets/items/shooting-star.png` | 流星 | 32×30 | |
| `public/assets/items/small-pillow.png` | 小枕頭 | 32×24 | |
| `public/assets/items/milk-bottle.png` | 牛奶瓶 | 15×32 | |
| `public/assets/items/treasure-chest.png` | 寶箱 | 40×38 | 打開的樣子 |
| `public/assets/items/practice-target.png` | 練習靶 | 40×40 | 靶本身 37×40，置中放在 40×40 透明畫布 |
| `public/assets/characters/default-guard.png` | 預設角色：睡衣小綿羊守衛 | 48×55 | 朝右；比玩家判定 28×48 寬，水平置中、底部貼地；人形守衛有「看起來像小孩」的疑慮，改用小綿羊 |
| `public/assets/characters/pajama-outline.png` | 睡衣小人輪廓（給玩家畫） | 289×512 | 沒有臉、身體白色填滿（睡帽內有一小塊是透明的），玩家在上面畫；腮紅要程式或玩家另外加；負責人 2026-10-21 確認用人形 |
| `public/assets/backgrounds/insomnia-forest.png` | 失眠森林背景 | 960×540 | 單張，還沒分視差圖層 |

## 第二批（2026-10-21 補充）

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/night-owl-boss-phase2.png` | 熬夜貓頭鷹 第二階段 | 183×200 | 頭上冒蒸氣、更臭臉 |
| `public/assets/enemies/night-owl-boss-phase3.png` | 熬夜貓頭鷹 第三階段 | 176×200 | 咖啡打翻、身邊冒火花；第一階段用 night-owl-boss.png |
| `public/assets/enemies/clockbug-sleep.png` | 鬧鐘蟲 睡著 | 47×56 | 被哄睡後換成這張 |
| `public/assets/enemies/coffee-bean-sprite-sleep.png` | 咖啡豆精靈 睡著 | 38×52 |  |
| `public/assets/enemies/night-bat-sleep.png` | 熬夜蝙蝠 睡著 | 54×56 |  |
| `public/assets/enemies/insomnia-hedgehog-sleep.png` | 失眠刺蝟 睡著 | 81×72 |  |
| `public/assets/enemies/night-owl-boss-sleep.png` | 熬夜貓頭鷹 睡著 | 184×200 | 打倒關主後 |
| `public/assets/fx/zzz.png` | Zzz 特效 | 32×31 | 用程式畫的線條（不是字型），可以往上飄、淡出 |
| `public/assets/fx/dream-sheep.png` | 變成小羊特效 | 40×36 | 小羊在雲上，魔物睡著後飄走用；圖本身不透明，半透明效果請程式調透明度 |
| `public/assets/backgrounds/forest-far.png` | 三層背景：遠景（天空、月亮） | 1440×540 | 不透明；左右可無縫接續，捲動最慢 |
| `public/assets/backgrounds/forest-mid.png` | 三層背景：中景（樹林剪影） | 1609×540 | 透明；左右可無縫接續，捲動中等 |
| `public/assets/backgrounds/forest-near.png` | 三層背景：近景（草叢剪影） | 1396×540 | 透明；左右可無縫接續，捲動最快，草叢在地面線附近 |

三層背景疊法：遠景 → 中景 → 近景，三張寬度不同（遠景 1440、中景 1609、近景 1396），各自重複排列就能一直捲動；寬度不同反而不容易看出重複。舊的單張背景 `insomnia-forest.png` 留著，二選一用。

## 還沒做 / 已知問題

- 素材是 1 倍大小，高解析度螢幕上可能有點糊；需要 2 倍版本的話跟美術說：來源大圖只在美術的電腦上，由美術改 `docs/art/tools/process_level1.py` 的尺寸重跑。
- 貓頭鷹三個階段的差別比較小（表情、蒸氣、打翻咖啡），程式可以再加變色或抖動讓差別更明顯。
- 魔物「打哈欠」的樣子沒做（企劃寫打哈欠「或」變小羊／Zzz，先做後兩個）。
- 寶箱只有打開的樣子：關著的試了兩輪都畫成打開的，還沒做出來。
