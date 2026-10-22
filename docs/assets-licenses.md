# 素材來源與授權

## 使用中的生成模型

| 模型 | 檔名 | 來源 | 授權 |
|---|---|---|---|
| Animagine XL 4.0 opt（v0.1 用，已不用） | `animagine-xl-4.0-opt.safetensors` | https://huggingface.co/cagliostrolab/animagine-xl-4.0 | CreativeML Open RAIL++-M，允許商用生成圖 |
| Nova Cartoon XL v6.0（v0.2 底模） | `novaCartoonXL_v60.safetensors` | https://civitai.com/models/1570391 （version 2329740） | Civitai 授權欄：allowCommercialUse = Image, RentCivit, Rent（允許賣生成圖） |
| Chibi Animal Characters, Illustrious V2（v0.2 畫風 LoRA） | `Chibi_Animal_V2.safetensors` | https://civitai.com/models/1481162 （version 2842389） | Civitai 授權欄：allowCommercialUse = Image, RentCivit（允許賣生成圖）；allowNoCredit = true；allowDerivatives = false（不能拿它做衍生模型再發布） |

## 素材清單

| 檔案 | 怎麼做的 | 模型 | 授權 | 日期 |
|---|---|---|---|---|
| `docs/art/style-sample/clockbug.png` | 本機 ComfyUI 生成，四角填色去背 | Animagine XL 4.0 opt | 見上表 | 2026-10-21 |
| `docs/art/style-sample/pillow-cannon.png` | 同上，再左右翻轉 | Animagine XL 4.0 opt | 見上表 | 2026-10-21 |
| `docs/art/style-sample/insomnia-forest.png` | 本機 ComfyUI 生成，縮成 960×540 | Animagine XL 4.0 opt | 見上表 | 2026-10-21 |
| `docs/art/style-sample/style-sample-gamescale.png`、`style-sample-closeup.png` | 用上面三張合成 | Animagine XL 4.0 opt（來源素材） | 見上表 | 2026-10-21 |
| `docs/art/style-sample-v2/clockbug.png`、`pillow-cannon.png` | 本機 ComfyUI 生成，四角填色去背（枕頭砲左右翻轉） | Nova Cartoon XL v6.0＋Chibi Animal V2 | 見上表 | 2026-10-21 |
| `docs/art/style-sample-v2/insomnia-forest.png` | 本機 ComfyUI 生成，縮成 960×540 | Nova Cartoon XL v6.0＋Chibi Animal V2 | 見上表 | 2026-10-21 |
| `docs/art/style-sample-v2/style-sample-gamescale.png`、`style-sample-closeup.png` | 用上面三張合成 | 同上（來源素材） | 見上表 | 2026-10-21 |
| `public/assets/enemies/*.png`（clockbug、coffee-bean-sprite、night-bat、insomnia-hedgehog、night-owl-boss） | 本機 ComfyUI 生成，`docs/art/tools/process_level1.py` 去背縮圖 | Nova Cartoon XL v6.0＋Chibi Animal V2（強度 0.9） | 見上表 | 2026-10-21 |
| `public/assets/weapons/*.png`（7 把） | 同上，部分左右翻轉成朝右 | Nova Cartoon XL v6.0（不加 LoRA） | 見上表 | 2026-10-21 |
| `public/assets/items/*.png`（熱可可、流星、小枕頭、牛奶瓶、寶箱、練習靶） | 同上 | Nova Cartoon XL v6.0＋Chibi Animal V2（強度 0.4） | 見上表 | 2026-10-21 |
| `public/assets/characters/default-guard.png`、`pajama-outline.png` | 同上（輪廓不加 LoRA） | Nova Cartoon XL v6.0（守衛加 Chibi Animal V2 強度 0.5） | 見上表 | 2026-10-21 |
| `public/assets/backgrounds/insomnia-forest.png` | 同上，用旁邊草地蓋掉模型自己加的小動物，縮成 960×540 | Nova Cartoon XL v6.0（不加 LoRA） | 見上表 | 2026-10-21 |
| `public/assets/enemies/*-phase2.png`、`*-phase3.png`、`*-sleep.png` | 本機 ComfyUI 以第一批魔物圖為底「照原圖修改」（img2img），`docs/art/tools/process_level1b.py` 去背縮圖 | Nova Cartoon XL v6.0＋Chibi Animal V2（強度 0.9） | 見上表 | 2026-10-21 |
| `public/assets/fx/dream-sheep.png` | 本機 ComfyUI 生成，同上處理 | Nova Cartoon XL v6.0＋Chibi Animal V2（強度 0.9） | 見上表 | 2026-10-21 |
| `public/assets/fx/zzz.png` | 程式繪製（Pillow 畫線條，沒有用字型） | 無 | 自己畫的，沒有第三方授權問題 | 2026-10-21 |
| `public/assets/backgrounds/forest-far.png`、`forest-mid.png`、`forest-near.png` | 本機 ComfyUI 生成；中景、近景是白底黑剪影，用程式依深淺轉透明並染成夜空色；遠景頭尾交叉淡化、中景在樹的空隙切開、近景裁掉兩端後短距離淡化，三張都可無縫接續 | Nova Cartoon XL v6.0（不加 LoRA） | 見上表 | 2026-10-21 |
| `public/assets/items/treasure-chest-closed.png`、`public/assets/bullets/yawn-bubble.png`、`milk-drop.png`、`music-note.png`、`moon-beam.png` | 程式繪製（Pillow 畫圖形，`docs/art/tools/process_level1c.py`） | 無 | 自己畫的，沒有第三方授權問題 | 2026-10-21 |
| `public/assets/enemies/insomnia-hedgehog.png`（新版）、`public/assets/bullets/sheep.png`、`pillow.png` | 本機 ComfyUI 生成，`process_level1c.py` 去背縮圖 | Nova Cartoon XL v6.0（刺蝟、小羊加 Chibi Animal V2 強度 0.9） | 見上表 | 2026-10-21 |
| `public/assets/enemies/w2-*.png`、`public/assets/items/w2-falling-block.png`、`public/assets/backgrounds/w2-desert-far.png`、`w2-desert-mid.png`、`public/assets/enemies/insomnia-hedgehog-sleep.png` | 本機 ComfyUI 生成（睡著版與關主二三階段照原圖修改），`docs/art/tools/process_world2.py` 去背縮圖；中景剪影轉透明染色 | Nova Cartoon XL v6.0（魔物加 Chibi Animal V2 強度 0.9；背景、沙磚不加） | 見上表 | 2026-10-21 |
| `public/assets/items/w2-quicksand.png`、`w2-pressure-plate.png`、`public/assets/backgrounds/w2-desert-near.png`、`public/assets/enemies/insomnia-hedgehog-roll.png`，以及刺蝟睡著版上的刺盾 | 程式繪製（Pillow，`process_world2.py`） | 無 | 自己畫的，沒有第三方授權問題 | 2026-10-21 |
| `public/assets/backgrounds/w1-s*`、`w2-s*`（場景背景） | 本機 ComfyUI 生成遠景與部分中景、近景（剪影轉透明染色），`docs/art/tools/process_scenes.py` 處理；部分中景、近景程式繪製 | Nova Cartoon XL v6.0（不加 LoRA） | 見上表；程式繪製的部分沒有第三方授權問題 | 2026-10-21 |
| `public/assets/backgrounds/w1-t*`、`w2-t*`（過渡圖） | 由相鄰兩個場景的圖用程式合成 | 同上 | 同上 | 2026-10-21 |
| `public/assets/fonts/jf-openhuninn-2.1.ttf` | jf open 粉圓 2.1，官方 GitHub release（github.com/justfont/open-huninn-font） | — | SIL Open Font License 1.1（授權全文 `public/assets/fonts/jf-openhuninn-LICENSE.txt`，必須一起散布）；漢字部分源自 Kosugi Maru（Apache-2.0） | 2026-10-22 |
| `public/assets/ui/logo.png`、`button-*.png`、`panel.png` | 程式繪製（`docs/art/tools/make_ui.py`），文字用 jf open 粉圓排版 | 無 | 自己畫的；OFL 規定用字型做出來的圖片不受 OFL 約束 | 2026-10-22 |
| `public/assets/ui/cover-bg.png`、`cover-guard.png`、`cover.png` | 本機 ComfyUI 生成（守衛照預設角色圖修改），程式合成 | Nova Cartoon XL v6.0（守衛加 Chibi Animal V2） | 見上表 | 2026-10-22 |
| `public/assets/enemies/w3-*.png`、`public/assets/backgrounds/w3-*.png` | 本機 ComfyUI 生成，`docs/art/tools/process_world3.py`（共用 `artlib.py`）處理；深夜海床近景程式繪製 | Nova Cartoon XL v6.0（魔物加 Chibi Animal V2 強度 0.9；背景不加） | 見上表 | 2026-10-22 |
| `public/assets/characters/default-guard-*.png`、`public/assets/enemies/*-walk-*.png`、`*-flap-*.png`、`*-jump.png`、`*-land.png`、`*-ball.png`、`*-dive.png`（動畫格） | 用現有素材以程式變形（`docs/art/tools/make_anim.py`） | 同原圖 | 同原圖 | 2026-10-22 |
| `public/assets/enemies/w4-*.png`、`public/assets/backgrounds/w4-*.png`（遠景）、`public/assets/items/w4-*.png` | 本機 ComfyUI 生成魔物與遠景，`docs/art/tools/process_world4.py` 處理；中景、近景、機關程式繪製 | Nova Cartoon XL v6.0（魔物加 Chibi Animal V2 強度 0.9；背景不加） | 見上表；程式繪製的部分沒有第三方授權問題 | 2026-10-22 |
| `public/assets/enemies/w5-*`、`w6-*`、`w7-*`、`public/assets/backgrounds/w5-*`、`w6-*`、`w7-*`（遠景）、`public/assets/items/w5-*`、`w6-*`、`w7-*` | 本機 ComfyUI 生成魔物與遠景，`docs/art/tools/process_worlds567.py` 處理；中景、近景、機關程式繪製 | Nova Cartoon XL v6.0（魔物加 Chibi Animal V2 強度 0.9；背景不加） | 見上表；程式繪製的部分沒有第三方授權問題 | 2026-10-22 |
| `public/assets/enemies/w*-boss*.png`（小頭目與 8-3、9-3、10-3 關主）、`public/assets/bullets/w1-*`～`w10-*` Boss 攻擊道具 | 小頭目本機 ComfyUI 生成（睡著版照醒著版修改），`docs/art/tools/process_bosses.py` 處理；攻擊道具程式繪製 | Nova Cartoon XL v6.0＋Chibi Animal V2（強度 0.9） | 見上表；程式繪製的部分沒有第三方授權問題 | 2026-10-22 |
| `public/assets/enemies/w2-*`～`w10-*` 的 `-walk-`、`-flap-`、`-swim-`、`-bounce-` 動畫格 | 用現有素材以程式變形（`docs/art/tools/make_anim_all.py`） | 同原圖 | 同原圖 | 2026-10-22 |

備註：純 AI 生成的圖，著作權保護在各國都還不明確（見企劃文件 8.3）。
