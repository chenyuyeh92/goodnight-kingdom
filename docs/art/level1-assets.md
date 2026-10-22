# 第一關素材清單（給程式那邊接）

2026-10-21 第一版。全部是透明背景 PNG（背景除外），已經縮成遊戲內大小（1 倍，畫面 960×540）。
魔物朝左、武器朝右、道具正面。地面 y=480，素材底部對齊地面即可。

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/enemies/clockbug.png` | 吵鬧鬧鐘蟲（小怪） | 48×56 | 抱著一個鬧鐘 |
| `public/assets/enemies/coffee-bean-sprite.png` | 咖啡豆精靈（小怪） | 39×52 | 腳下有一點咖啡渣 |
| `public/assets/enemies/night-bat.png` | 熬夜蝙蝠（小怪） | 56×56 | 正面，拿咖啡杯；飛行時底部要高於 y=452，讓玩家蹲下能閃過 |
| `public/assets/enemies/insomnia-hedgehog.png` | 失眠刺蝟（中階） | 57×72 | 2026-10-21 換新造型：朝左，正面拿著放射狀尖刺的刺盾（刺盾是程式畫上去的）；滾球圖是 `insomnia-hedgehog-roll.png` |
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
| `public/assets/enemies/coffee-bean-sprite-sleep.png` | 咖啡豆精靈 睡著 | 38×52 | 眼皮下還露出一點白，縮小後可能像半睜眼，之後可再修 |
| `public/assets/enemies/night-bat-sleep.png` | 熬夜蝙蝠 睡著 | 54×56 |  |
| `public/assets/enemies/insomnia-hedgehog-sleep.png` | 失眠刺蝟 睡著 | 61×72 | 2026-10-21 重畫成新造型（正面刺盾）；顏色比醒著的偏棕 |
| `public/assets/enemies/night-owl-boss-sleep.png` | 熬夜貓頭鷹 睡著 | 184×200 | 打倒關主後 |
| `public/assets/fx/zzz.png` | Zzz 特效 | 32×31 | 用程式畫的線條（不是字型），可以往上飄、淡出 |
| `public/assets/fx/dream-sheep.png` | 變成小羊特效 | 40×36 | 小羊在雲上，魔物睡著後飄走用；圖本身不透明，半透明效果請程式調透明度 |
| `public/assets/backgrounds/forest-far.png` | 三層背景：遠景（天空、月亮） | 1440×540 | 不透明；左右可無縫接續，捲動最慢 |
| `public/assets/backgrounds/forest-mid.png` | 三層背景：中景（樹林剪影） | 1609×540 | 透明；左右可無縫接續，捲動中等 |
| `public/assets/backgrounds/forest-near.png` | 三層背景：近景（草叢剪影） | 1396×540 | 透明；左右可無縫接續，捲動最快，草叢在地面線附近 |

三層背景疊法：遠景 → 中景 → 近景，三張寬度不同（遠景 1440、中景 1609、近景 1396），各自重複排列就能一直捲動；寬度不同反而不容易看出重複。舊的單張背景 `insomnia-forest.png` 留著，二選一用。

## 第三批（2026-10-21 補充）

| 檔案 | 內容 | 實際大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/items/treasure-chest-closed.png` | 寶箱（關著） | 40×37 | 用程式畫的（模型一直畫成打開的），木頭和金邊的顏色取自打開的寶箱；打開的是斜角、關著的是正面，視角不同 |
| `public/assets/bullets/yawn-bubble.png` | 哈欠泡泡的子彈 | 12×12 | 半透明泡泡 |
| `public/assets/bullets/sheep.png` | 數羊機槍的子彈 | 20×16 | 小羊，朝右 |
| `public/assets/bullets/pillow.png` | 枕頭砲的子彈 | 32×19 | 小枕頭 |
| `public/assets/bullets/milk-drop.png` | 晚安牛奶噴霧的子彈 | 10×10 | 牛奶滴，尖端朝左（往右飛）；扇形噴灑由程式排列 |
| `public/assets/bullets/music-note.png` | 搖籃曲豎琴的子彈 | 11×14 | 音符 |
| `public/assets/bullets/moon-beam.png` | 月亮催眠燈的光束 | 32×10 | 橫向重複接成長光束 |

| `public/assets/enemies/insomnia-hedgehog-roll.png` | 失眠刺蝟 滾球（滾動撞人時用） | 48×48 | 程式畫；可以讓程式旋轉 |

棉被迴力鏢的子彈就是武器圖本身（`weapons/blanket-boomerang.png`），旋轉著飛。

## 動畫格（2026-10-22，程式那邊要求）

用現有單張圖做變形做成：走路是「變矮、前後傾」交替，跳躍是身體收瘦，拍翅是把翅膀那一帶彎曲往上／往下（不切開、不會有破洞），長相和原圖完全一致。**每一格的畫布大小和原圖相同、朝向相同、腳底和原圖在同一條線**；角色不會一格大一格小。走路格不往上抬，上下晃動和跳躍高度請程式控制。產生方式：`docs/art/tools/make_anim.py`。

| 檔案 | 內容 | 每格大小（寬×高 px） |
|---|---|---|
| `public/assets/characters/default-guard-walk-1..4.png` | 小綿羊守衛 走路 4 格 | 48×55 |
| `public/assets/characters/default-guard-jump.png` | 小綿羊守衛 跳躍 1 格 | 48×55 |
| `public/assets/enemies/clockbug-walk-1..4.png` | 鬧鐘蟲 走路 4 格 | 48×56 |
| `public/assets/enemies/coffee-bean-sprite-jump.png` | 咖啡豆精靈 跳起 1 格 | 39×52 |
| `public/assets/enemies/coffee-bean-sprite-land.png` | 咖啡豆精靈 落地 1 格 | 39×52 |
| `public/assets/enemies/night-bat-flap-1..4.png` | 熬夜蝙蝠 拍翅 4 格（上、平、下、平） | 56×56 |
| `public/assets/enemies/insomnia-hedgehog-walk-1..4.png` | 失眠刺蝟 走路 4 格 | 57×72 |
| `public/assets/enemies/insomnia-hedgehog-ball.png` | 失眠刺蝟 縮成球 1 格 | 57×72 |
| `public/assets/enemies/night-owl-boss-flap-1..4.png` | 熬夜貓頭鷹 第一階段 拍翅 4 格 | 181×200 |
| `public/assets/enemies/night-owl-boss-phase2-flap-1..4.png` | 熬夜貓頭鷹 第二階段 拍翅 4 格 | 183×200 |
| `public/assets/enemies/night-owl-boss-phase3-flap-1..4.png` | 熬夜貓頭鷹 第三階段 拍翅 4 格 | 176×200 |
| `public/assets/enemies/night-owl-boss-dive.png` | 熬夜貓頭鷹 俯衝 1 格（往左下） | 181×200 |

- 拍翅的「平」格（第 2、4 格）就是原圖本身。
- 貓頭鷹的翅膀收在身體兩側、抱著咖啡杯，拍翅動作比較小；程式可以再加上下浮動讓飛行更明顯。俯衝格是上半身往左前傾。
- 小綿羊守衛的動畫放在 `characters/`（和原圖 `default-guard.png` 同一個資料夾），魔物放在 `enemies/`。
- 關著的寶箱（`items/treasure-chest-closed.png`）和刺蝟正面的刺盾（新版 `enemies/insomnia-hedgehog.png`）在第三批已經交付，請拉最新的 `art/style-guide` 分支。

## 還沒做 / 已知問題

- 素材是 1 倍大小，高解析度螢幕上可能有點糊；需要 2 倍版本的話跟美術說：來源大圖只在美術的電腦上，由美術改 `docs/art/tools/process_level1.py` 的尺寸重跑。
- 貓頭鷹三個階段的差別比較小（表情、蒸氣、打翻咖啡），程式可以再加變色或抖動讓差別更明顯。
- 魔物「打哈欠」的樣子沒做（企劃寫打哈欠「或」變小羊／Zzz，先做後兩個）。
