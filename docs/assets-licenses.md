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

備註：純 AI 生成的圖，著作權保護在各國都還不明確（見企劃文件 8.3）。
