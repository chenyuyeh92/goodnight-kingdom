# 十大世界 Boss 素材（給程式那邊接）

清單由遊戲組 2026-10-22 提供（每世界第 1、2 關小頭目＋第 3 關世界關主，30 隻不重複）。
規格：Q 版動物、深紫外框、朝左、透明 PNG、腳底貼齊圖片底部；**小頭目高 150 px、新畫的關主（8-3、9-3、10-3）高 220 px**；同一隻的各狀態用同一個縮放比例（睡著版可能比較矮）。
1-3 到 7-3 的關主是之前各世界做的，大小在各世界清單裡（約 200 px 高）。
攻擊道具放 `bullets/`，寬 16–48 px，都有深紫外框；會飛的道具（羽毛）尖端朝左，電流、水柱可以橫向重複接長，震波放在地面上。
產生方式：`docs/art/tools/process_bosses.py`。

| 關卡 | Boss | 圖（醒著／睡著／第二、三階段，皆在 `enemies/`） | 攻擊道具 |
|---|---|---|---|
| 1-1 | 失眠大松鼠 | `w1-boss1-squirrel.png` 200×150 `w1-boss1-squirrel-sleep.png` 193×150 | `bullets/w1-acorn.png` 20×26 |
| 1-2 | 熬夜大河狸 | `w1-boss2-beaver.png` 160×150 `w1-boss2-beaver-sleep.png` 161×150 | `bullets/w1-log.png` 40×18、`bullets/w1-water-wave.png` 48×28 |
| 1-3 | 熬夜貓頭鷹（關主） | `night-owl-boss.png` 181×200 `night-owl-boss-sleep.png` 184×200 `night-owl-boss-phase2.png` 183×200 `night-owl-boss-phase3.png` 176×200 | — |
| 2-1 | 失眠駱駝 | `w2-boss1-camel.png` 142×150 `w2-boss1-camel-sleep.png` 142×152 | `bullets/w2-spit.png` 16×16、`bullets/w2-sand-dust.png` 40×24 |
| 2-2 | 熬夜耳廓狐 | `w2-boss2-fennec-fox.png` 149×150 `w2-boss2-fennec-fox-sleep.png` 148×150 | w2-sand-dust（共用） |
| 2-3 | 睡不著的人面獅身（關主） | `w2-sphinx-boss.png` 205×200 `w2-sphinx-boss-sleep.png` 206×200 `w2-sphinx-boss-phase2.png` 220×200 `w2-sphinx-boss-phase3.png` 213×200 | — |
| 3-1 | 失眠寄居蟹 | `w3-boss1-hermit-crab.png` 126×150 `w3-boss1-hermit-crab-sleep.png` 126×150 | `bullets/w3-bubble.png` 18×18 |
| 3-2 | 熬夜電鰻 | `w3-boss2-electric-eel.png` 102×150 `w3-boss2-electric-eel-sleep.png` 108×130 | `bullets/w3-electric-beam.png` 32×16 |
| 3-3 | 尼斯湖水怪（關主） | `w3-nessie-boss.png` 239×220 `w3-nessie-boss-sleep.png` 238×220 `w3-nessie-boss-phase2.png` 238×220 `w3-nessie-boss-phase3.png` 237×220 | — |
| 4-1 | 失眠北極熊 | `w4-boss1-polar-bear.png` 137×150 `w4-boss1-polar-bear-sleep.png` 137×150 | items/w4-icicle（共用） |
| 4-2 | 熬夜獨角鯨 | `w4-boss2-narwhal.png` 149×150 `w4-boss2-narwhal-sleep.png` 153×147 | （用身上的角，不另外畫） |
| 4-3 | 失眠雪怪（關主） | `w4-yeti-boss.png` 227×220 `w4-yeti-boss-sleep.png` 227×220 `w4-yeti-boss-phase2.png` 228×220 `w4-yeti-boss-phase3.png` 230×217 | — |
| 5-1 | 失眠溫泉河馬 | `w5-boss1-hippo.png` 178×150 `w5-boss1-hippo-sleep.png` 178×150 | `bullets/w5-steam.png` 36×28、`bullets/w5-shockwave.png` 48×16 |
| 5-2 | 熬夜火山蝸牛 | `w5-boss2-volcano-snail.png` 116×150 `w5-boss2-volcano-snail-sleep.png` 116×151 | `bullets/w5-lava-ball.png` 20×20 |
| 5-3 | 熬夜火龍（關主） | `w5-fire-dragon-boss.png` 197×220 `w5-fire-dragon-boss-sleep.png` 193×220 `w5-fire-dragon-boss-phase2.png` 189×220 `w5-fire-dragon-boss-phase3.png` 204×220 | — |
| 6-1 | 失眠樹懶 | `w6-boss1-sloth.png` 125×150 `w6-boss1-sloth-sleep.png` 123×150 | `bullets/w6-mango.png` 22×22 |
| 6-2 | 熬夜美洲豹 | `w6-boss2-jaguar.png` 211×150 `w6-boss2-jaguar-sleep.png` 212×151 | （撲擊，身體攻擊） |
| 6-3 | 吵鬧大猩猩（關主） | `w6-gorilla-boss.png` 173×220 `w6-gorilla-boss-sleep.png` 172×220 `w6-gorilla-boss-phase2.png` 172×220 `w6-gorilla-boss-phase3.png` 170×220 | — |
| 7-1 | 失眠長頸鹿 | `w7-boss1-giraffe.png` 119×150 `w7-boss1-giraffe-sleep.png` 116×149 | （脖子橫掃，身體攻擊） |
| 7-2 | 熬夜大象 | `w7-boss2-elephant.png` 155×150 `w7-boss2-elephant-sleep.png` 152×150 | `bullets/w7-water-jet.png` 32×14、`bullets/w7-shockwave.png` 48×16 |
| 7-3 | 失眠獅子王（關主） | `w7-lion-king-boss.png` 218×220 `w7-lion-king-boss-sleep.png` 224×220 `w7-lion-king-boss-phase2.png` 233×220 `w7-lion-king-boss-phase3.png` 240×220 | — |
| 8-1 | 熬夜山羊 | `w8-boss1-mountain-goat.png` 137×150 `w8-boss1-mountain-goat-sleep.png` 138×149 | `bullets/w8-rock.png` 24×22 |
| 8-2 | 失眠熊貓 | `w8-boss2-panda.png` 109×150 `w8-boss2-panda-sleep.png` 108×142 | `bullets/w8-bamboo.png` 40×12 |
| 8-3 | 熬夜雷鳥（關主） | `w8-thunderbird-boss.png` 214×220 `w8-thunderbird-boss-sleep.png` 189×221 `w8-thunderbird-boss-phase2.png` 201×219 `w8-thunderbird-boss-phase3.png` 223×219 | `bullets/w8-lightning.png` 24×48 |
| 9-1 | 熬夜螢火蟲女王 | `w9-boss1-firefly-queen.png` 137×150 `w9-boss1-firefly-queen-sleep.png` 137×151 | `bullets/w9-firefly.png` 18×16 |
| 9-2 | 失眠六角恐龍 | `w9-boss2-axolotl.png` 199×150 `w9-boss2-axolotl-sleep.png` 198×151 | `bullets/w9-water-bubble.png` 18×18 |
| 9-3 | 失眠巨鼴鼠（關主） | `w9-giant-mole-boss.png` 257×220 `w9-giant-mole-boss-sleep.png` 253×215 `w9-giant-mole-boss-phase2.png` 257×208 `w9-giant-mole-boss-phase3.png` 254×221 | `bullets/w9-rock.png` 24×22 |
| 10-1 | 失眠月兔 | `w10-boss1-moon-rabbit.png` 144×150 `w10-boss1-moon-rabbit-sleep.png` 144×150 | `bullets/w10-mochi.png` 24×18、`bullets/w10-shockwave.png` 48×16 |
| 10-2 | 熬夜孔雀 | `w10-boss2-peacock.png` 134×150 `w10-boss2-peacock-sleep.png` 134×150 | `bullets/w10-feather.png` 36×14 |
| 10-3 | 偷走睡意的失眠魔王：夢貘（最終魔王） | `w10-dream-tapir-boss.png` 191×220 `w10-dream-tapir-boss-sleep.png` 196×219 `w10-dream-tapir-boss-phase2.png` 194×222 `w10-dream-tapir-boss-phase3.png` 203×220 | `bullets/w10-dream-mist.png` 40×28 |

## 已知問題

- 松鼠的大尾巴在身體後面；「尾巴當盾」時程式可以讓牠轉身或縮起來表現。
- 寄居蟹看起來比較像躲在咖啡杯裡的小動物，螃蟹的大鉗子不明顯。
- 雷鳥是黑色鳥加一朵雷雲，巨鼴鼠比較像戴礦工帽的大倉鼠，夢貘的象鼻不明顯：三隻都可以再重畫。
- 新關主的二、三階段差別主要在表情和周圍特效，程式可以加變色或抖動。
