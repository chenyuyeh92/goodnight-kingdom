# 動畫格（世界 2–10 小怪、中階怪與全部 30 隻 Boss）

2026-10-22。第一關的動畫格見 `docs/art/level1-assets.md`「動畫格」。產生方式：`docs/art/tools/make_anim_all.py`。

**規則（和第一關一樣）：** 每格畫布大小和原圖相同、朝向相同、腳底在同一條線、角色不會一格大一格小。檔案和原圖放在同一個資料夾（`public/assets/enemies/`）。

**動作種類（每種 4 格，建議每格 0.12–0.15 秒循環播放）：**
- 走路：踩地 → 往前傾 → 踩地 → 往後傾（以腳底為支點，腳不會左右滑）
- 拍翅：翅膀上 → 平 → 下 → 平（「平」就是原圖；頭和嘴那一側只彎下半部，嘴不會變形）
- 游動：身體前後擺 → 原樣 → 往另一邊擺 → 原樣
- 彈跳：壓扁 → 原樣 → 拉瘦 → 原樣

上下移動、跳躍高度、受傷閃爍、睡著飄走，請程式另外做。關主的第二、三階段各有一套。睡著版沒有動畫格（程式可以讓它輕輕上下呼吸）。

| 原圖 | 動作 | 檔案 |
|---|---|---|
| `w1-boss1-squirrel` | 走路 | `w1-boss1-squirrel-walk-1.png` ～ `-4.png` |
| `w1-boss2-beaver` | 走路 | `w1-boss2-beaver-walk-1.png` ～ `-4.png` |
| `w2-bell-scarab` | 走路 | `w2-bell-scarab-walk-1.png` ～ `-4.png` |
| `w2-boss1-camel` | 走路 | `w2-boss1-camel-walk-1.png` ～ `-4.png` |
| `w2-boss2-fennec-fox` | 走路 | `w2-boss2-fennec-fox-walk-1.png` ～ `-4.png` |
| `w2-coffee-sand-snake` | 走路 | `w2-coffee-sand-snake-walk-1.png` ～ `-4.png` |
| `w2-desert-tortoise` | 走路 | `w2-desert-tortoise-walk-1.png` ～ `-4.png` |
| `w2-insomnia-vulture` | 拍翅 | `w2-insomnia-vulture-flap-1.png` ～ `-4.png` |
| `w2-mummy-cat` | 彈跳 | `w2-mummy-cat-bounce-1.png` ～ `-4.png` |
| `w2-sphinx-boss` | 走路 | `w2-sphinx-boss-walk-1.png` ～ `-4.png` |
| `w2-sphinx-boss-phase2` | 走路 | `w2-sphinx-boss-phase2-walk-1.png` ～ `-4.png` |
| `w2-sphinx-boss-phase3` | 走路 | `w2-sphinx-boss-phase3-walk-1.png` ～ `-4.png` |
| `w3-alarm-clownfish` | 游動 | `w3-alarm-clownfish-swim-1.png` ～ `-4.png` |
| `w3-boss1-hermit-crab` | 彈跳 | `w3-boss1-hermit-crab-bounce-1.png` ～ `-4.png` |
| `w3-boss2-electric-eel` | 游動 | `w3-boss2-electric-eel-swim-1.png` ～ `-4.png` |
| `w3-coffee-octopus` | 彈跳 | `w3-coffee-octopus-bounce-1.png` ～ `-4.png` |
| `w3-nessie-boss` | 游動 | `w3-nessie-boss-swim-1.png` ～ `-4.png` |
| `w3-nessie-boss-phase2` | 游動 | `w3-nessie-boss-phase2-swim-1.png` ～ `-4.png` |
| `w3-nessie-boss-phase3` | 游動 | `w3-nessie-boss-phase3-swim-1.png` ～ `-4.png` |
| `w3-puffer-fish` | 游動 | `w3-puffer-fish-swim-1.png` ～ `-4.png` |
| `w3-sleepy-jellyfish` | 彈跳 | `w3-sleepy-jellyfish-bounce-1.png` ～ `-4.png` |
| `w4-boss1-polar-bear` | 走路 | `w4-boss1-polar-bear-walk-1.png` ～ `-4.png` |
| `w4-boss2-narwhal` | 游動 | `w4-boss2-narwhal-swim-1.png` ～ `-4.png` |
| `w4-coffee-snowman` | 走路 | `w4-coffee-snowman-walk-1.png` ～ `-4.png` |
| `w4-noisy-puffin` | 拍翅 | `w4-noisy-puffin-flap-1.png` ～ `-4.png` |
| `w4-sleepy-penguin` | 游動 | `w4-sleepy-penguin-swim-1.png` ～ `-4.png` |
| `w4-walrus` | 走路 | `w4-walrus-walk-1.png` ～ `-4.png` |
| `w4-yeti-boss` | 走路 | `w4-yeti-boss-walk-1.png` ～ `-4.png` |
| `w4-yeti-boss-phase2` | 走路 | `w4-yeti-boss-phase2-walk-1.png` ～ `-4.png` |
| `w4-yeti-boss-phase3` | 走路 | `w4-yeti-boss-phase3-walk-1.png` ～ `-4.png` |
| `w5-armadillo` | 走路 | `w5-armadillo-walk-1.png` ～ `-4.png` |
| `w5-boss1-hippo` | 彈跳 | `w5-boss1-hippo-bounce-1.png` ～ `-4.png` |
| `w5-boss2-volcano-snail` | 彈跳 | `w5-boss2-volcano-snail-bounce-1.png` ～ `-4.png` |
| `w5-coffee-lava-blob` | 彈跳 | `w5-coffee-lava-blob-bounce-1.png` ～ `-4.png` |
| `w5-fire-dragon-boss` | 走路 | `w5-fire-dragon-boss-walk-1.png` ～ `-4.png` |
| `w5-fire-dragon-boss-phase2` | 走路 | `w5-fire-dragon-boss-phase2-walk-1.png` ～ `-4.png` |
| `w5-fire-dragon-boss-phase3` | 走路 | `w5-fire-dragon-boss-phase3-walk-1.png` ～ `-4.png` |
| `w5-fire-salamander` | 走路 | `w5-fire-salamander-walk-1.png` ～ `-4.png` |
| `w5-noisy-volcano-bird` | 拍翅 | `w5-noisy-volcano-bird-flap-1.png` ～ `-4.png` |
| `w6-alarm-parrot` | 拍翅 | `w6-alarm-parrot-flap-1.png` ～ `-4.png` |
| `w6-boss1-sloth` | 走路 | `w6-boss1-sloth-walk-1.png` ～ `-4.png` |
| `w6-boss2-jaguar` | 走路 | `w6-boss2-jaguar-walk-1.png` ～ `-4.png` |
| `w6-coffee-chameleon` | 走路 | `w6-coffee-chameleon-walk-1.png` ～ `-4.png` |
| `w6-gorilla-boss` | 走路 | `w6-gorilla-boss-walk-1.png` ～ `-4.png` |
| `w6-gorilla-boss-phase2` | 走路 | `w6-gorilla-boss-phase2-walk-1.png` ～ `-4.png` |
| `w6-gorilla-boss-phase3` | 走路 | `w6-gorilla-boss-phase3-walk-1.png` ～ `-4.png` |
| `w6-pangolin` | 走路 | `w6-pangolin-walk-1.png` ～ `-4.png` |
| `w6-tree-frog` | 彈跳 | `w6-tree-frog-bounce-1.png` ～ `-4.png` |
| `w7-boss1-giraffe` | 走路 | `w7-boss1-giraffe-walk-1.png` ～ `-4.png` |
| `w7-boss2-elephant` | 走路 | `w7-boss2-elephant-walk-1.png` ～ `-4.png` |
| `w7-coffee-warthog` | 走路 | `w7-coffee-warthog-walk-1.png` ～ `-4.png` |
| `w7-lion-king-boss` | 走路 | `w7-lion-king-boss-walk-1.png` ～ `-4.png` |
| `w7-lion-king-boss-phase2` | 走路 | `w7-lion-king-boss-phase2-walk-1.png` ～ `-4.png` |
| `w7-lion-king-boss-phase3` | 走路 | `w7-lion-king-boss-phase3-walk-1.png` ～ `-4.png` |
| `w7-meerkat` | 走路 | `w7-meerkat-walk-1.png` ～ `-4.png` |
| `w7-noisy-hornbill` | 拍翅 | `w7-noisy-hornbill-flap-1.png` ～ `-4.png` |
| `w7-rhino` | 走路 | `w7-rhino-walk-1.png` ～ `-4.png` |
| `w7-wildebeest` | 走路 | `w7-wildebeest-walk-1.png` ～ `-4.png` |
| `w8-boss1-mountain-goat` | 走路 | `w8-boss1-mountain-goat-walk-1.png` ～ `-4.png` |
| `w8-boss2-panda` | 走路 | `w8-boss2-panda-walk-1.png` ～ `-4.png` |
| `w8-thunderbird-boss` | 拍翅 | `w8-thunderbird-boss-flap-1.png` ～ `-4.png` |
| `w8-thunderbird-boss-phase2` | 拍翅 | `w8-thunderbird-boss-phase2-flap-1.png` ～ `-4.png` |
| `w8-thunderbird-boss-phase3` | 拍翅 | `w8-thunderbird-boss-phase3-flap-1.png` ～ `-4.png` |
| `w9-boss1-firefly-queen` | 彈跳 | `w9-boss1-firefly-queen-bounce-1.png` ～ `-4.png` |
| `w9-boss2-axolotl` | 走路 | `w9-boss2-axolotl-walk-1.png` ～ `-4.png` |
| `w9-giant-mole-boss` | 走路 | `w9-giant-mole-boss-walk-1.png` ～ `-4.png` |
| `w9-giant-mole-boss-phase2` | 走路 | `w9-giant-mole-boss-phase2-walk-1.png` ～ `-4.png` |
| `w9-giant-mole-boss-phase3` | 走路 | `w9-giant-mole-boss-phase3-walk-1.png` ～ `-4.png` |
| `w10-boss1-moon-rabbit` | 走路 | `w10-boss1-moon-rabbit-walk-1.png` ～ `-4.png` |
| `w10-boss2-peacock` | 走路 | `w10-boss2-peacock-walk-1.png` ～ `-4.png` |
| `w10-dream-tapir-boss` | 走路 | `w10-dream-tapir-boss-walk-1.png` ～ `-4.png` |
| `w10-dream-tapir-boss-phase2` | 走路 | `w10-dream-tapir-boss-phase2-walk-1.png` ～ `-4.png` |
| `w10-dream-tapir-boss-phase3` | 走路 | `w10-dream-tapir-boss-phase3-walk-1.png` ～ `-4.png` |

已知：貓頭鷹、雷鳥這類翅膀收在身體旁邊的，拍翅幅度比較小；程式可以再加上下浮動。腳下畫了地面或水面的角色（人面獅身、尼斯湖水怪等），走路／游動時地面會跟著一點點變形。
