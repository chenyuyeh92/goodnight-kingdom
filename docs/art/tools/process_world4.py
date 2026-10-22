"""世界 4「冰雪極地」：魔物、睡著版、關主三階段、4 個場景背景與過渡圖、機關。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_world4.py <ComfyUI output 資料夾> <專案根目錄>
中景、近景、冰柱、雪堆平台、冰地面用程式畫（AI 畫的中景太稀疏、機關裡會多出小動物）。
注意：來源圖（ComfyUI 輸出的 gk9、gk10）只在美術的電腦上，沒有放進 repo。
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from artlib import cutout, fit, far, seabed, transition, save, pines_mid, reeds_mid, ice_spikes_mid, icicles_mid, patch, OUTLINE

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G9, G10 = os.path.join(OUT_DIR, "gk9"), os.path.join(OUT_DIR, "gk10")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)

SPRITES = [  # (檔名, 來源, (寬上限, 高上限))
    ("w4-sleepy-penguin", os.path.join(G9, "w4/w4-sleepy-penguin_00002_.png"), (52, 56)),
    ("w4-coffee-snowman", os.path.join(G9, "w4/w4-coffee-snowman_00002_.png"), (52, 60)),
    ("w4-noisy-puffin", os.path.join(G9, "w4/w4-noisy-puffin_00002_.png"), (60, 56)),
    ("w4-walrus", os.path.join(G9, "w4/w4-walrus_00002_.png"), (80, 72)),
    ("w4-yeti-boss", os.path.join(G9, "w4/w4-yeti-boss_00001_.png"), (230, 220)),
]
# 睡著版、關主二三階段：挑好後填入 gk10 裡的編號，例如 "00002"
SEL = {"w4-sleepy-penguin-sleep": "00004", "w4-coffee-snowman-sleep": "00003", "w4-noisy-puffin-sleep": "00004", "w4-walrus-sleep": "00001",
       "w4-yeti-boss-sleep": "00002", "w4-yeti-boss-phase2": "00001", "w4-yeti-boss-phase3": "00002"}
for name, src, box in [("w4-sleepy-penguin-sleep", "w4-sleepy-penguin-sleep", (52, 56)), ("w4-coffee-snowman-sleep", "w4-coffee-snowman-sleep", (52, 60)),
                       ("w4-noisy-puffin-sleep", "w4-noisy-puffin-sleep", (60, 56)), ("w4-walrus-sleep", "w4-walrus-sleep", (80, 72)),
                       ("w4-yeti-boss-sleep", "w4-yeti-boss-sleep", (230, 220)), ("w4-yeti-boss-phase2", "w4-yeti-phase2", (230, 220)),
                       ("w4-yeti-boss-phase3", "w4-yeti-phase3", (230, 220))]:
    if name in SEL:
        SPRITES.append((name, os.path.join(G10, "w4s", f"{src}_{SEL[name]}_.png"), box))
    else:
        print(f"提醒：{name} 還沒挑圖")
FLIP = {"w4-sleepy-penguin", "w4-sleepy-penguin-sleep"}  # 來源圖朝右，翻成朝左
for name, src, box in SPRITES:
    im = cutout(src)
    if name in FLIP: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    save(fit(im, box), A("enemies", name + ".png"))

# 場景：遠景用 AI 圖；中景、近景程式畫，依時間上色
B = lambda name: A("backgrounds", name)
SCENES = {
    # 第一段遠景：用旁邊的雪地蓋掉模型自己加的小熊
    "w4-s1": (patch(far(os.path.join(G9, "w4bg/w4s1-far_00002_.png")), (740, 368, 880, 482), -150, feather=5), pines_mid((98, 140, 150), seed=1, snow=(240, 248, 255)),
              seabed((210, 225, 240), phase=0.4, rocks=((300, 12), (900, 9)))),
    "w4-s2": (far(os.path.join(G9, "w4bg/w4s2-far_00003_.png")), reeds_mid((110, 70, 100)), seabed((90, 60, 92), phase=1.1)),
    "w4-s3": (far(os.path.join(G9, "w4bg/w4s3-far_00003_.png")), ice_spikes_mid((110, 140, 190), seed=3, light=(160, 200, 235), short=True),
              seabed((26, 36, 80), phase=2.0, rocks=((520, 10),))),
    # 深夜冰洞遠景：蓋掉模型自己加的發光眼睛小動物
    "w4-s4": (patch(far(os.path.join(G9, "w4bg/w4s4-far_00002_.png")), (800, 420, 872, 488), -110, feather=5), icicles_mid((30, 40, 90), seed=4),
              seabed((10, 14, 42), phase=2.9, rocks=((260, 10), (1100, 12)))),
}
for key, layers in SCENES.items():
    for n, im in zip(("far", "mid", "near"), layers):
        save(im, B(f"{key}-{n}.png"))
for s1, s2 in ((1, 2), (2, 3), (3, 4)):
    for i, n in enumerate(("far", "mid", "near")):
        im = transition(SCENES[f"w4-s{s1}"][i], SCENES[f"w4-s{s2}"][i])
        save(im.convert("RGB") if n == "far" else im, B(f"w4-t{s1}{s2}-{n}.png"))

# 機關（程式畫，放大 4 倍畫再縮小）
ICE, ICE_L, ICE_D, SNOW = (190, 225, 245, 255), (235, 248, 255, 255), (120, 170, 215, 255), (250, 252, 255, 255)
K = 4

def ice_floor():
    im = Image.new("RGBA", (96 * K, 24 * K), (0, 0, 0, 0)); d = ImageDraw.Draw(im); W = im.width
    d.rectangle((0, 3 * K, W, im.height), fill=ICE)
    for x in range(0, W, 32 * K):  # 斜斜的反光線，每 32 px 一組，左右可接續
        d.line((x + 6 * K, 9 * K, x + 16 * K, 5 * K), fill=ICE_L, width=2 * K)
        d.line((x + 20 * K, 16 * K, x + 26 * K, 13 * K), fill=ICE_L, width=2 * K)
    d.line((0, 3 * K, W, 3 * K), fill=OUTLINE, width=2 * K)
    return im.resize((96, 24), Image.LANCZOS)

def icicle():
    im = Image.new("RGBA", (24 * K, 56 * K), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.polygon([(2 * K, 2 * K), (22 * K, 2 * K), (13 * K, 54 * K)], fill=ICE, outline=OUTLINE, width=2 * K)
    d.polygon([(7 * K, 5 * K), (11 * K, 5 * K), (12 * K, 40 * K)], fill=ICE_L)
    return im.resize((24, 56), Image.LANCZOS)

def snow_platform():
    im = Image.new("RGBA", (96 * K, 28 * K), (0, 0, 0, 0)); d = ImageDraw.Draw(im); W, Hh = im.size
    d.rounded_rectangle((2 * K, 6 * K, W - 2 * K, Hh - 2 * K), radius=10 * K, fill=ICE_D, outline=OUTLINE, width=2 * K)
    d.rounded_rectangle((2 * K, 2 * K, W - 2 * K, 16 * K), radius=8 * K, fill=SNOW, outline=OUTLINE, width=2 * K)
    return im.resize((96, 28), Image.LANCZOS)

save(ice_floor(), A("items", "w4-ice-floor.png"))
save(icicle(), A("items", "w4-icicle.png"))
save(snow_platform(), A("items", "w4-snow-platform.png"))
print("ok")
