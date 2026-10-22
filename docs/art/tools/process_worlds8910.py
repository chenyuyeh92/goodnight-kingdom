"""世界 8 雲端高山、9 地底洞窟、10 月亮城堡：小怪、中階怪（醒著＋睡著）、4 個場景背景與過渡圖、機關。
Boss 在 process_bosses.py。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_worlds8910.py <ComfyUI output 資料夾> <專案根目錄>
來源圖（ComfyUI 輸出的 gk16 醒著與遠景、gk17 睡著版）只在美術的電腦上，沒有放進 repo。
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from artlib import (cutout, fit, far, seabed, transition, save, patch, OUTLINE,
                    pines_mid, rocks_mid, icicles_mid, castle_mid, clouds_mid, pillars_mid)

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G16, G17 = os.path.join(OUT_DIR, "gk16"), os.path.join(OUT_DIR, "gk17")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)

# ---- 挑圖結果 ----
# 魔物：{檔名: (來源 "G16/…" 或 "G17/…", (寬上限, 高上限), 是否翻轉)}
PICKS = {
    "w8-coffee-cloud": ("G16/w8/w8-coffee-cloud_00002_.png", (56, 52), False),
    "w8-coffee-cloud-sleep": ("G17/w8s/w8-coffee-cloud-sleep_00002_.png", (56, 52), False),
    "w8-noisy-eagle": ("G16/w8/w8-noisy-eagle_00002_.png", (60, 56), False),
    "w8-noisy-eagle-sleep": ("G17/w8s/w8-noisy-eagle-sleep_00002_.png", (60, 56), False),
    "w8-pika": ("G16/w8/w8-pika_00004_.png", (48, 52), False),
    "w8-pika-sleep": ("G17/w8s/w8-pika-sleep_00002_.png", (48, 52), False),
    "w8-yak": ("G16/w8/w8-yak_00003_.png", (80, 72), False),
    "w8-yak-sleep": ("G17/w8s/w8-yak-sleep_00002_.png", (80, 72), False),
    "w9-coffee-worm": ("G16/w9/w9-coffee-worm_00004_.png", (48, 56), False),
    "w9-coffee-worm-sleep": ("G17/w9s/w9-coffee-worm-sleep_00002_.png", (48, 56), False),
    "w9-mushroom-sprite": ("G16/w9/w9-mushroom-sprite_00001_.png", (48, 56), False),
    "w9-mushroom-sprite-sleep": ("G17/w9s/w9-mushroom-sprite-sleep_00002_.png", (48, 56), False),
    "w9-noisy-moth": ("G16/w9/w9-noisy-moth_00003_.png", (60, 56), False),
    "w9-noisy-moth-sleep": ("G17/w9s/w9-noisy-moth-sleep_00002_.png", (60, 56), False),
    "w9-rhino-beetle": ("G16/w9/w9-rhino-beetle_00002_.png", (80, 72), False),
    "w9-rhino-beetle-sleep": ("G17/w9s/w9-rhino-beetle-sleep_00002_.png", (80, 72), False),
    "w10-coffee-teapot": ("G16/w10/w10-coffee-teapot_00002_.png", (52, 56), False),
    "w10-coffee-teapot-sleep": ("G17/w10s/w10-coffee-teapot-sleep_00002_.png", (52, 56), False),
    "w10-pillow-soldier": ("G16/w10/w10-pillow-soldier_00002_.png", (56, 60), False),
    "w10-pillow-soldier-sleep": ("G17/w10s/w10-pillow-soldier-sleep_00002_.png", (56, 60), False),
    "w10-clock-guard": ("G16/w10/w10-clock-guard-v2_00003_.png", (64, 80), False),
    "w10-clock-guard-sleep": ("G17/w10s/w10-clock-guard-sleep_00002_.png", (64, 80), False),
    "w10-noisy-star": ("G16/w10/w10-noisy-star-v2_00003_.png", (56, 56), False),
    "w10-noisy-star-sleep": ("G17/w10s/w10-noisy-star-sleep_00002_.png", (56, 56), False),
}
FAR_PICKS = {"w8-1": "00002", "w8-2": "00001", "w8-3": "00004", "w8-4": "00003",
             "w9-1": "00002", "w9-2": "00002", "w9-3": "00002", "w9-4": "v2_00002",
             "w10-1": "00002", "w10-2": "00002", "w10-3": "00001", "w10-4": "00002"}
FAR_PATCH = {"w8-1": [((745, 372, 835, 448), -130)]}  # 蓋掉模型自己加的白色小動物

for name, (src, box, flip) in PICKS.items():
    path = src.replace("G16/", G16 + "/").replace("G17/", G17 + "/")
    if not os.path.exists(path):
        print(f"提醒：{name} 的來源圖還沒有，先跳過"); continue
    im = cutout(path)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    save(fit(im, box), A("enemies", name + ".png"))

B = lambda name: A("backgrounds", name)
def FAR(w, n):
    pick = FAR_PICKS[f"{w}-{n}"]
    fn = f"{w}s{n}-far-{pick}_.png" if pick.startswith("v2") else f"{w}s{n}-far_{pick}_.png"  # v2＝重畫的那張
    im = far(os.path.join(G16, f"{w}bg", fn))
    for b, dx in FAR_PATCH.get(f"{w}-{n}", ()):
        im = patch(im, b, dx, feather=5)
    return im

if len(FAR_PICKS) < 12:
    print("提醒：FAR_PICKS 還沒填滿 12 個，先跳過場景")
else:
    SCENES = {
        # 世界 8：高山草甸（白天）→ 雲海（黃昏）→ 吊橋山崖（晚上）→ 雷雲山頂（深夜）
        "w8-s1": (FAR("w8", 1), pines_mid((90, 140, 120), seed=81, n=7), seabed((110, 150, 90), phase=0.3, rocks=((420, 10),))),
        "w8-s2": (FAR("w8", 2), clouds_mid((200, 150, 170), seed=82), seabed((120, 90, 110), phase=1.0)),
        "w8-s3": (FAR("w8", 3), rocks_mid((40, 40, 80), seed=83, n=6), seabed((26, 26, 56), phase=1.8, rocks=((900, 11),))),
        "w8-s4": (FAR("w8", 4), rocks_mid((26, 20, 50), seed=84, n=5), seabed((16, 12, 34), phase=2.6, rocks=((300, 10), (1150, 12)))),
        # 世界 9：礦坑入口（白天）→ 水晶洞（黃昏）→ 地下河（晚上）→ 鼴鼠巢穴（深夜）
        "w9-s1": (FAR("w9", 1), rocks_mid((110, 90, 70), seed=91, n=6), seabed((90, 70, 54), phase=0.4)),
        "w9-s2": (FAR("w9", 2), icicles_mid((90, 50, 90), seed=92), seabed((70, 40, 70), phase=1.2, rocks=((640, 11),))),
        "w9-s3": (FAR("w9", 3), icicles_mid((24, 34, 70), seed=93), seabed((16, 24, 50), phase=2.0)),
        "w9-s4": (FAR("w9", 4), rocks_mid((40, 26, 34), seed=94, n=6), seabed((28, 18, 24), phase=2.8, rocks=((250, 10), (1050, 12)))),
        # 世界 10：城下花園（白天）→ 城牆（黃昏）→ 城堡大廳（晚上）→ 月光王座（深夜）
        "w10-s1": (FAR("w10", 1), rocks_mid((70, 120, 80), seed=101, n=8), seabed((110, 150, 100), phase=0.5)),  # 花園：圓灌木
        "w10-s2": (FAR("w10", 2), castle_mid((100, 64, 92), seed=102, n=0), seabed((80, 50, 74), phase=1.3)),
        "w10-s3": (FAR("w10", 3), pillars_mid((80, 70, 120), seed=103), seabed((30, 22, 60), phase=2.1)),
        "w10-s4": (FAR("w10", 4), pillars_mid((60, 50, 100), seed=104, n=4), seabed((18, 12, 40), phase=2.9)),
    }
    for key, layers in SCENES.items():
        for n, im in zip(("far", "mid", "near"), layers):
            save(im, B(f"{key}-{n}.png"))
    for w in ("w8", "w9", "w10"):
        for s1, s2 in ((1, 2), (2, 3), (3, 4)):
            for i, n in enumerate(("far", "mid", "near")):
                im = transition(SCENES[f"{w}-s{s1}"][i], SCENES[f"{w}-s{s2}"][i])
                save(im.convert("RGB") if n == "far" else im, B(f"{w}-t{s1}{s2}-{n}.png"))

# ---- 機關（程式畫，放大 4 倍畫再縮小） ----
K = 4
def canvas(w, h):
    im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

def cloud_platform():  # 世界 8 雲朵平台：上面是平的（y 6）可以站，雲團只在側面和下面
    im, d = canvas(96, 32)
    puffs = ((14, 22, 12), (36, 24, 14), (60, 24, 14), (82, 22, 12))
    for x, y, r in puffs:
        d.ellipse(((x - r - 2) * K, (y - r - 2) * K, (x + r + 2) * K, (y + r + 2) * K), fill=OUTLINE)
    d.rounded_rectangle((2 * K, 4 * K, 94 * K, 22 * K), radius=8 * K, fill=OUTLINE)
    for x, y, r in puffs:
        d.ellipse(((x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K), fill=(250, 250, 255, 255))
    d.rounded_rectangle((4 * K, 6 * K, 92 * K, 20 * K), radius=7 * K, fill=(250, 250, 255, 255))
    return im.resize((96, 32), Image.LANCZOS)

def wind():  # 世界 8 強風（往左吹的風線，半透明）
    im, d = canvas(48, 24)
    for col, wd in ((OUTLINE, 4), ((230, 240, 255, 230), 2)):  # 先畫深紫外框再畫白線，淺色背景也看得到
        for y, x0, x1 in ((5, 10, 46), (12, 3, 40), (19, 14, 44)):
            d.line((x0 * K, y * K, x1 * K, y * K), fill=col, width=wd * K)
            d.arc(((x0 - 3) * K, (y - 5) * K, (x0 + 3) * K, (y + 1) * K), 90, 270, fill=col, width=wd * K)
    return im.resize((48, 24), Image.LANCZOS)

def crystal():  # 世界 9 發光水晶（可以當照明點）
    im, d = canvas(24, 36)
    d.ellipse((0, 4 * K, 24 * K, 36 * K), fill=(240, 180, 255, 70))
    d.polygon([(12 * K, 2 * K), (19 * K, 14 * K), (16 * K, 34 * K), (8 * K, 34 * K), (5 * K, 14 * K)], fill=(220, 160, 250, 255), outline=OUTLINE, width=2 * K)
    d.line((12 * K, 4 * K, 12 * K, 32 * K), fill=(250, 220, 255, 255), width=K)
    return im.resize((24, 36), Image.LANCZOS)

def mine_platform():  # 世界 9 礦坑木板平台
    im, d = canvas(96, 24); W = im.width
    d.rectangle((2 * K, 4 * K, W - 2 * K, 14 * K), fill=(150, 100, 60, 255), outline=OUTLINE, width=2 * K)
    for x in range(14, 96, 24): d.line((x * K, 4 * K, x * K, 14 * K), fill=OUTLINE, width=K)
    for x in (10, 86): d.rectangle(((x - 3) * K, 14 * K, (x + 3) * K, 22 * K), fill=(120, 80, 50, 255), outline=OUTLINE, width=K)
    return im.resize((96, 24), Image.LANCZOS)

def moon_platform():  # 世界 10 月亮平台（彎月形，上面平的可以站）
    im, d = canvas(96, 28)
    d.chord((2 * K, -20 * K, 94 * K, 26 * K), 0, 180, fill=(250, 230, 150, 255), outline=OUTLINE, width=2 * K)
    d.line((4 * K, 3 * K, 92 * K, 3 * K), fill=OUTLINE, width=2 * K)
    for x, y in ((30, 10), (60, 14), (44, 18)): d.ellipse(((x - 3) * K, (y - 2) * K, (x + 3) * K, (y + 2) * K), fill=(230, 200, 120, 255))
    return im.resize((96, 28), Image.LANCZOS)

def star_item():  # 世界 10 星星（收集用）
    im, d = canvas(24, 24)
    pts = [(12 + (11 if i % 2 == 0 else 5) * math.cos(math.radians(-90 + i * 36)), 13 + (11 if i % 2 == 0 else 5) * math.sin(math.radians(-90 + i * 36))) for i in range(10)]
    d.polygon([(x * K, y * K) for x, y in pts], fill=(250, 225, 120, 255), outline=OUTLINE, width=2 * K)
    return im.resize((24, 24), Image.LANCZOS)

for name, fn in (("w8-cloud-platform", cloud_platform), ("w8-wind", wind), ("w9-crystal", crystal), ("w9-mine-platform", mine_platform),
                 ("w10-moon-platform", moon_platform), ("w10-star", star_item)):
    save(fn(), A("items", name + ".png"))
print("ok")
