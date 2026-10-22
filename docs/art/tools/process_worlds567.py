"""世界 5 火山島、世界 6 熱帶雨林、世界 7 非洲大草原：魔物、睡著版、關主三階段、4 個場景背景與過渡圖、機關。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_worlds567.py <ComfyUI output 資料夾> <專案根目錄>
遠景與魔物用 AI 圖（gk11 醒著版與遠景、gk12 睡著版與關主二三階段）；中景、近景、機關用程式畫。
注意：來源圖只在美術的電腦上，沒有放進 repo。
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from artlib import (cutout, fit, far, seabed, transition, save, patch, OUTLINE,
                    palms_mid, rocks_mid, jungle_mid, acacia_mid, reeds_mid)

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G11, G12 = os.path.join(OUT_DIR, "gk11"), os.path.join(OUT_DIR, "gk12")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
K = 4

# ---- 挑圖結果 ----
# 魔物：{檔名: ("G11/…" 或 "G12/…" 的來源, (寬上限, 高上限), 是否左右翻轉)}
PICKS = {
    "w5-fire-salamander": ("G11/w5/w5-fire-salamander_00003_.png", (64, 52), False),
    "w5-coffee-lava-blob": ("G11/w5/w5-coffee-lava-blob_00003_.png", (52, 56), False),
    "w5-noisy-volcano-bird": ("G11/w5/w5-noisy-volcano-bird_00003_.png", (60, 56), True),
    "w5-armadillo": ("G11/w5/w5-armadillo_00004_.png", (80, 72), True),
    "w5-fire-dragon-boss": ("G11/w5/w5-fire-dragon-boss_00001_.png", (240, 220), True),
    "w6-tree-frog": ("G11/w6/w6-tree-frog_00004_.png", (52, 52), True),
    "w6-coffee-chameleon": ("G11/w6/w6-coffee-chameleon_00001_.png", (56, 56), True),
    "w6-alarm-parrot": ("G11/w6/w6-alarm-parrot_00002_.png", (60, 56), False),
    "w6-pangolin": ("G11/w6/w6-pangolin_00002_.png", (80, 72), True),
    "w6-gorilla-boss": ("G11/w6/w6-gorilla-boss_00001_.png", (240, 220), False),
    "w7-meerkat": ("G11/w7/w7-meerkat_00001_.png", (44, 60), False),
    "w7-coffee-warthog": ("G11/w7/w7-coffee-warthog_00004_.png", (60, 52), True),
    "w7-noisy-hornbill": ("G11/w7/w7-noisy-hornbill_00004_.png", (60, 56), False),
    "w7-rhino": ("G11/w7/w7-rhino_00001_.png", (88, 72), False),
    "w7-lion-king-boss": ("G11/w7/w7-lion-king-boss_00004_.png", (240, 220), False),
    "w7-wildebeest": ("G11/w7/w7-wildebeest_00002_.png", (64, 56), False),
    "w5-armadillo-sleep": ("G12/w5s/w5-armadillo-sleep_00002_.png", (80, 72), False),
    "w5-coffee-lava-blob-sleep": ("G12/w5s/w5-coffee-lava-blob-sleep_00002_.png", (52, 56), False),
    "w5-fire-dragon-boss-phase2": ("G12/w5s/w5-fire-dragon-boss-phase2_00002_.png", (240, 220), False),
    "w5-fire-dragon-boss-phase3": ("G12/w5s/w5-fire-dragon-boss-phase3_00002_.png", (240, 220), False),
    "w5-fire-dragon-boss-sleep": ("G12/w5s/w5-fire-dragon-boss-sleep_00002_.png", (240, 220), False),
    "w5-fire-salamander-sleep": ("G12/w5s/w5-fire-salamander-sleep_00002_.png", (64, 52), False),
    "w5-noisy-volcano-bird-sleep": ("G12/w5s/w5-noisy-volcano-bird-sleep_00002_.png", (60, 56), False),
    "w6-alarm-parrot-sleep": ("G12/w6s/w6-alarm-parrot-sleep_00002_.png", (60, 56), False),
    "w6-coffee-chameleon-sleep": ("G12/w6s/w6-coffee-chameleon-sleep_00002_.png", (56, 56), False),
    "w6-gorilla-boss-phase2": ("G12/w6s/w6-gorilla-boss-phase2_00002_.png", (240, 220), False),
    "w6-gorilla-boss-phase3": ("G12/w6s/w6-gorilla-boss-phase3_00002_.png", (240, 220), False),
    "w6-gorilla-boss-sleep": ("G12/w6s/w6-gorilla-boss-sleep_00002_.png", (240, 220), False),
    "w6-pangolin-sleep": ("G12/w6s/w6-pangolin-sleep_00002_.png", (80, 72), False),
    "w6-tree-frog-sleep": ("G12/w6s/w6-tree-frog-sleep_00002_.png", (52, 52), False),
    "w7-coffee-warthog-sleep": ("G12/w7s/w7-coffee-warthog-sleep_00002_.png", (60, 52), False),
    "w7-lion-king-boss-phase2": ("G12/w7s/w7-lion-king-boss-phase2_00002_.png", (240, 220), False),
    "w7-lion-king-boss-phase3": ("G12/w7s/w7-lion-king-boss-phase3_00002_.png", (240, 220), False),
    "w7-lion-king-boss-sleep": ("G12/w7s/w7-lion-king-boss-sleep_00002_.png", (240, 220), False),
    "w7-meerkat-sleep": ("G12/w7s/w7-meerkat-sleep_00002_.png", (44, 60), False),
    "w7-noisy-hornbill-sleep": ("G12/w7s/w7-noisy-hornbill-sleep_00002_.png", (60, 56), False),
    "w7-rhino-sleep": ("G12/w7s/w7-rhino-sleep_00002_.png", (88, 72), False),
}
# 遠景：{"w5-1": "00002", …}（ComfyUI 的 5 位數編號）；FAR_PATCH：要蓋掉的多餘小動物 {"w5-1": [((x0, y0, x1, y1), 水平位移), …]}
FAR_PICKS = {"w5-1": "00003", "w5-2": "00003", "w5-3": "00001", "w5-4": "00003",
             "w6-1": "00003", "w6-2": "00003", "w6-3": "00003", "w6-4": "00003",
             "w7-1": "00001", "w7-2": "00004", "w7-3": "00001", "w7-4": "00001"}
FAR_PATCH = {}
# 原圖朝右的翻成朝左（睡著版、二三階段是照原圖修改的，跟著原圖一起翻）
FLIP_BASE = ['w5-noisy-volcano-bird', 'w5-fire-dragon-boss', 'w5-armadillo', 'w6-coffee-chameleon', 'w6-pangolin', 'w6-tree-frog', 'w7-coffee-warthog']
for name, (src, box, flip) in PICKS.items():
    flip = flip or any(name.startswith(b) for b in FLIP_BASE)
    im = cutout(src.replace("G11/", G11 + "/").replace("G12/", G12 + "/"))
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    save(fit(im, box), A("enemies", name + ".png"))

# ---- 場景 ----
B = lambda name: A("backgrounds", name)
def FAR(w, n, pick, patches=()):
    im = far(os.path.join(G11, f"{w}bg", f"{w}s{n}-far_{pick}_.png"))
    for box, dx in patches:
        im = patch(im, box, dx, feather=5)
    return im

SCENES = {
    # 世界 5 火山島：黑沙灘（白天）→ 火山森林（黃昏）→ 熔岩河（晚上）→ 火山口（深夜）
    "w5-s1": (FAR("w5", 1, FAR_PICKS["w5-1"], FAR_PATCH.get("w5-1", ())), palms_mid((60, 90, 80), seed=51), seabed((40, 36, 44), phase=0.3, rocks=((320, 10), (980, 8)))),
    "w5-s2": (FAR("w5", 2, FAR_PICKS["w5-2"], FAR_PATCH.get("w5-2", ())), rocks_mid((86, 46, 50), seed=52, n=6), seabed((60, 30, 36), phase=1.2)),
    "w5-s3": (FAR("w5", 3, FAR_PICKS["w5-3"], FAR_PATCH.get("w5-3", ())), rocks_mid((44, 22, 34), seed=53, n=6, smoke=(120, 90, 100)), seabed((30, 14, 24), phase=2.1, rocks=((600, 12),))),
    "w5-s4": (FAR("w5", 4, FAR_PICKS["w5-4"], FAR_PATCH.get("w5-4", ())), rocks_mid((30, 14, 30), seed=54, n=6), seabed((18, 8, 20), phase=2.8, rocks=((240, 10), (1150, 12)))),
    # 世界 6 熱帶雨林：河邊雨林（白天）→ 瀑布（黃昏）→ 樹冠（晚上）→ 叢林遺跡（深夜）
    "w6-s1": (FAR("w6", 1, FAR_PICKS["w6-1"], FAR_PATCH.get("w6-1", ())), jungle_mid((40, 90, 60), seed=61, leaf=(60, 120, 70)), seabed((30, 70, 44), phase=0.5)),
    "w6-s2": (FAR("w6", 2, FAR_PICKS["w6-2"], FAR_PATCH.get("w6-2", ())), reeds_mid((90, 60, 70)), seabed((70, 46, 54), phase=1.4, rocks=((500, 11),))),
    "w6-s3": (FAR("w6", 3, FAR_PICKS["w6-3"], FAR_PATCH.get("w6-3", ())), jungle_mid((20, 40, 44), seed=63, leaf=(30, 60, 52)), seabed((14, 30, 30), phase=2.2)),
    "w6-s4": (FAR("w6", 4, FAR_PICKS["w6-4"], FAR_PATCH.get("w6-4", ())), jungle_mid((16, 22, 40), seed=64, n=5), seabed((10, 14, 30), phase=3.0, rocks=((300, 10), (1000, 12)))),
    # 世界 7 非洲大草原：金合歡草原（白天）→ 水塘（黃昏）→ 星空草原（晚上）→ 榮耀岩（深夜）
    "w7-s1": (FAR("w7", 1, FAR_PICKS["w7-1"], FAR_PATCH.get("w7-1", ())), acacia_mid((140, 110, 60), seed=71), seabed((150, 120, 60), phase=0.2)),
    "w7-s2": (FAR("w7", 2, FAR_PICKS["w7-2"], FAR_PATCH.get("w7-2", ())), acacia_mid((90, 50, 50), seed=72, n=4), seabed((70, 40, 40), phase=1.0, rocks=((700, 10),))),
    "w7-s3": (FAR("w7", 3, FAR_PICKS["w7-3"], FAR_PATCH.get("w7-3", ())), acacia_mid((30, 30, 60), seed=73), seabed((22, 22, 46), phase=1.9)),
    "w7-s4": (FAR("w7", 4, FAR_PICKS["w7-4"], FAR_PATCH.get("w7-4", ())), rocks_mid((24, 18, 44), seed=74, n=6), seabed((16, 12, 32), phase=2.7, rocks=((420, 12), (1100, 10)))),
}
for key, layers in SCENES.items():
    for n, im in zip(("far", "mid", "near"), layers):
        save(im, B(f"{key}-{n}.png"))
for w in ("w5", "w6", "w7"):
    for s1, s2 in ((1, 2), (2, 3), (3, 4)):
        for i, n in enumerate(("far", "mid", "near")):
            im = transition(SCENES[f"{w}-s{s1}"][i], SCENES[f"{w}-s{s2}"][i])
            save(im.convert("RGB") if n == "far" else im, B(f"{w}-t{s1}{s2}-{n}.png"))

# ---- 機關（程式畫，放大 4 倍畫再縮小） ----
def canvas(w, h):
    im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

def lava_floor():
    im, d = canvas(96, 24); W = im.width
    d.rectangle((0, 3 * K, W, im.height), fill=(235, 110, 40, 255))
    for x in range(0, W, 32 * K):  # 亮黃的熔岩紋，每 32 px 一組，左右可接續
        d.ellipse((x + 4 * K, 8 * K, x + 18 * K, 14 * K), fill=(255, 210, 90, 255))
        d.ellipse((x + 20 * K, 15 * K, x + 30 * K, 20 * K), fill=(255, 170, 60, 255))
    d.line((0, 3 * K, W, 3 * K), fill=OUTLINE, width=2 * K)
    return im.resize((96, 24), Image.LANCZOS)

def falling_rock():
    im, d = canvas(36, 36)
    d.ellipse((2 * K, 2 * K, 34 * K, 34 * K), fill=(90, 60, 70, 255), outline=OUTLINE, width=2 * K)
    for x, y, r in ((12, 12, 4), (22, 20, 3), (14, 24, 2)):
        d.ellipse(((x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K), fill=(255, 150, 60, 255))  # 發光的裂縫
    return im.resize((36, 36), Image.LANCZOS)

def stone_platform(top, body):
    im, d = canvas(96, 28); W, Hh = im.size
    d.rounded_rectangle((2 * K, 6 * K, W - 2 * K, Hh - 2 * K), radius=8 * K, fill=body + (255,), outline=OUTLINE, width=2 * K)
    d.rounded_rectangle((2 * K, 2 * K, W - 2 * K, 12 * K), radius=6 * K, fill=top + (255,), outline=OUTLINE, width=2 * K)
    return im.resize((96, 28), Image.LANCZOS)

def vine():
    im, d = canvas(20, 160)
    pts = [(10 * K + 3 * K * math.sin(t / 3), t * K) for t in range(0, 161, 4)]
    d.line(pts, fill=OUTLINE, width=6 * K, joint="curve"); d.line(pts, fill=(80, 140, 70, 255), width=3 * K, joint="curve")
    for t in range(20, 150, 26):  # 小葉子
        x = 10 * K + 3 * K * math.sin(t / 3); s = 1 if (t // 26) % 2 else -1
        d.ellipse((x + s * 2 * K - 4 * K, t * K - 3 * K, x + s * 2 * K + 4 * K, t * K + 3 * K), fill=(110, 170, 80, 255), outline=OUTLINE, width=K)
    return im.resize((20, 160), Image.LANCZOS)

def dust():
    im, d = canvas(64, 32)
    for x, y, r in ((14, 19, 10), (30, 15, 13), (48, 19, 10), (24, 22, 8), (40, 23, 8)):
        d.ellipse(((x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K), fill=(220, 190, 140, 180))
    return im.resize((64, 32), Image.LANCZOS)

save(lava_floor(), A("items", "w5-lava-floor.png"))
save(falling_rock(), A("items", "w5-falling-rock.png"))
save(stone_platform((120, 80, 80), (70, 50, 60)), A("items", "w5-rock-platform.png"))
save(vine(), A("items", "w6-vine.png"))
save(stone_platform((110, 160, 80), (120, 80, 50)), A("items", "w6-log-platform.png"))
save(dust(), A("items", "w7-dust.png"))
save(stone_platform((200, 160, 100), (150, 110, 70)), A("items", "w7-rock-platform.png"))
print("ok")
