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

## 還沒做 / 已知問題

- 素材是 1 倍大小，高解析度螢幕上可能有點糊；需要 2 倍版本的話跟美術說：來源大圖只在美術的電腦上，由美術改 `docs/art/tools/process_level1.py` 的尺寸重跑。
- 背景是單張，不是遠景／中景／前景三層。
- 熬夜貓頭鷹的三個階段、魔物被哄睡的樣子（打哈欠、變小羊、Zzz）還沒畫。
- 寶箱只有打開的樣子，沒有關著的。
