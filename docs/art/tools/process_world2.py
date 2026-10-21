"""世界 2「沙漠金字塔王國」素材：魔物、睡著版、關主三階段、三層背景、機關；另外補第一關刺蝟的滾球圖和新睡著版。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_world2.py <ComfyUI output 資料夾> <專案根目錄>
注意：來源圖（ComfyUI 輸出的 gk4、gk5）只在美術的電腦上，沒有放進 repo。
"""
import math, os, sys
from PIL import Image, ImageDraw

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G4, G5 = os.path.join(OUT_DIR, "gk4"), os.path.join(OUT_DIR, "gk5")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
OUTLINE = (58, 42, 90, 255)
SAND, SAND_D, SAND_L = (222, 190, 140, 255), (190, 150, 105, 255), (240, 215, 170, 255)
YELLOW = (248, 224, 142, 255)

def cutout(path):
    im = Image.open(path).convert("RGB"); w, h = im.size; key = (255, 0, 255)
    for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(im, p, key, thresh=40)
    rgba = im.convert("RGBA"); px = rgba.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][:3] == key:
                px[x, y] = (255, 255, 255, 0)
    return rgba.crop(rgba.getchannel("A").getbbox())

def fit(im, box):
    s = min(box[0] / im.width, box[1] / im.height)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)

def save(im, *path):
    os.makedirs(os.path.dirname(A(*path)), exist_ok=True); im.save(A(*path), optimize=True)

# (輸出資料夾, 檔名, 來源, (寬上限, 高上限))
SPRITES = [
    ("enemies", "w2-bell-scarab", (G4, "w2/w2-bell-scarab_00004_.png"), (64, 52)),
    ("enemies", "w2-mummy-cat", (G4, "w2/w2-mummy-cat_00003_.png"), (56, 56)),
    ("enemies", "w2-coffee-sand-snake", (G4, "w2/w2-coffee-sand-snake_00003_.png"), (52, 56)),
    ("enemies", "w2-insomnia-vulture", (G4, "w2/w2-insomnia-vulture_00004_.png"), (60, 56)),
    ("enemies", "w2-desert-tortoise", (G4, "w2/w2-desert-tortoise_00001_.png"), (80, 64)),
    ("enemies", "w2-sphinx-boss", (G4, "w2/w2-sphinx-boss_00004_.png"), (260, 200)),
    ("items", "w2-falling-block", (G4, "w2obj/w2-falling-block_00002_.png"), (40, 40)),
]
# 睡著版、關主二三階段、刺蝟補圖：挑好後填入，格式 {"檔名": ("gk5 裡的來源", (寬上限, 高上限), "輸出資料夾")}
# 例如 "w2-mummy-cat-sleep": ("w2s/w2-mummy-cat-sleep_00002_.png", (56, 56), "enemies")
PICKS_G5 = {
    "w2-bell-scarab-sleep": ("w2s/w2-bell-scarab-sleep_00001_.png", (64, 52), "enemies"),
    "w2-mummy-cat-sleep": ("w2s/w2-mummy-cat-sleep_00001_.png", (56, 56), "enemies"),
    "w2-coffee-sand-snake-sleep": ("w2s/w2-coffee-sand-snake-sleep_00002_.png", (52, 56), "enemies"),
    "w2-insomnia-vulture-sleep": ("w2s/w2-insomnia-vulture-sleep_00001_.png", (60, 56), "enemies"),
    "w2-desert-tortoise-sleep": ("w2s/w2-desert-tortoise-sleep_00004_.png", (80, 64), "enemies"),
    "w2-sphinx-boss-sleep": ("w2s/w2-sphinx-boss-sleep_00002_.png", (260, 200), "enemies"),
    "w2-sphinx-boss-phase2": ("w2s/w2-sphinx-phase2_00004_.png", (260, 200), "enemies"),
    "w2-sphinx-boss-phase3": ("w2s/w2-sphinx-phase3_00004_.png", (260, 200), "enemies"),
}

for cat, name, (base, src), box in SPRITES:
    save(fit(cutout(os.path.join(base, src)), box), cat, name + ".png")
if not PICKS_G5:
    print("提醒：PICKS_G5 是空的，睡著版／關主二三階段／刺蝟補圖還沒處理")
for name, (src, box, cat) in PICKS_G5.items():
    save(fit(cutout(os.path.join(G5, src)), box), cat, name + ".png")

# 第一關刺蝟補圖：新造型的睡著版（同樣補畫刺盾、翻成朝左）、滾球圖（模型畫不出來，程式畫）
def star(cx, cy, r1, r2, n=5, rot=-90):
    return [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.radians(rot + i * 180 / n)),
             cy + (r1 if i % 2 == 0 else r2) * math.sin(math.radians(rot + i * 180 / n))) for i in range(2 * n)]

def spiky_shield(im):
    px = im.load(); w, h = im.size; pts = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and min(r, g, b) > 140 and max(r, g, b) - min(r, g, b) < 40: pts.append((x, y))
    xs, ys = sorted(p[0] for p in pts), sorted(p[1] for p in pts)
    cx, cy = xs[len(xs) // 2], ys[len(ys) // 2]
    R = (xs[int(len(xs) * .95)] - xs[int(len(xs) * .05)]) / 2 + 6
    d = ImageDraw.Draw(im); n = 14
    d.polygon([(cx + R * (1.35 if i % 2 == 0 else 0.95) * math.cos(math.pi * i / n), cy + R * (1.35 if i % 2 == 0 else 0.95) * math.sin(math.pi * i / n)) for i in range(2 * n)],
              fill=(150, 98, 62, 255), outline=OUTLINE, width=8)
    d.ellipse((cx - R * .8, cy - R * .8, cx + R * .8, cy + R * .8), fill=(178, 124, 82, 255), outline=OUTLINE, width=8)
    d.polygon(star(cx, cy, R * .4, R * .17), fill=YELLOW, outline=OUTLINE, width=6)
    return im

def pad(im, n):
    c = Image.new("RGBA", (im.width + 2 * n, im.height + 2 * n), (0, 0, 0, 0)); c.alpha_composite(im, (n, n)); return c

hog = pad(spiky_shield(cutout(os.path.join(G5, "w1fix", "hedgehog-sleep-new_00004_.png"))), 120)
save(fit(hog.crop(hog.getchannel("A").getbbox()).transpose(Image.FLIP_LEFT_RIGHT), (96, 72)), "enemies", "insomnia-hedgehog-sleep.png")

def hedgehog_ball():
    """滾球：顏色取自新刺蝟的身體；尖刺放射狀，中間一張生氣的小臉。"""
    body = Image.open(A("enemies", "insomnia-hedgehog.png")).convert("RGBA")
    reds = sorted((r, g, b) for r, g, b, a in body.getdata() if a > 200 and r > g + 40 and r > b + 40)
    base = reds[len(reds) // 2] + (255,); dark = tuple(int(c * .75) for c in base[:3]) + (255,)
    S = 200; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); cx = cy = S / 2; n = 16
    d.polygon([(cx + (92 if i % 2 == 0 else 66) * math.cos(math.pi * i / n), cy + (92 if i % 2 == 0 else 66) * math.sin(math.pi * i / n)) for i in range(2 * n)],
              fill=dark, outline=OUTLINE, width=8)
    d.ellipse((cx - 64, cy - 64, cx + 64, cy + 64), fill=base, outline=OUTLINE, width=8)
    for ex in (-22, 22):  # 生氣的眼睛（斜眉）
        d.line((cx + ex - 12, cy - 22 - (6 if ex < 0 else -6) * -1, cx + ex + 12, cy - 22 + (6 if ex < 0 else -6) * -1), fill=OUTLINE, width=7)
        d.ellipse((cx + ex - 7, cy - 12, cx + ex + 7, cy + 2), fill=OUTLINE)
    d.ellipse((cx - 42, cy + 8, cx - 22, cy + 20), fill=(247, 168, 196, 200)); d.ellipse((cx + 22, cy + 8, cx + 42, cy + 20), fill=(247, 168, 196, 200))
    return fit(im, (48, 48))

save(hedgehog_ball(), "enemies", "insomnia-hedgehog-roll.png")

# 機關（程式畫）：流沙地面（可橫向接續）、壓力板（平放在地上）
def quicksand():
    W, H = 384, 96; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle((0, 12, W, H), fill=SAND_D)
    for k in range(3):  # 漩渦紋（每 128 px 一個，整張寬度剛好 3 個，左右可以接續）
        cx, cy = 64 + 128 * k, 50
        for r in (36, 24, 12):
            d.arc((cx - r * 1.6, cy - r * 0.6, cx + r * 1.6, cy + r * 0.6), 200, 520, fill=SAND_L, width=9)
    d.line((0, 12, W, 12), fill=OUTLINE, width=9)
    return im.resize((96, 24), Image.LANCZOS)  # 最上面約 3 px 透明

def pressure_plate():
    W, H = 160, 48; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.polygon([(14, 14), (146, 14), (156, 44), (4, 44)], fill=SAND, outline=OUTLINE, width=9)
    d.rectangle((14, 6, 146, 16), fill=SAND_L, outline=OUTLINE, width=8)
    cx, cy = 80, 29
    d.ellipse((cx - 13, cy - 11, cx + 13, cy + 11), fill=YELLOW, outline=OUTLINE, width=7)  # 太陽圓（縮小後光芒會糊，所以只畫圓）
    return im.resize((40, 12), Image.LANCZOS)

save(quicksand(), "items", "w2-quicksand.png")
save(pressure_plate(), "items", "w2-pressure-plate.png")

# 三層背景（高 540、左右可無縫接續）
def seamless(im, n):
    w = im.width; out = im.crop((0, 0, w - n, im.height))
    head, tail = im.crop((0, 0, n, im.height)), im.crop((w - n, 0, w, im.height))
    ramp = Image.linear_gradient("L").rotate(90).resize((n, im.height))
    out.paste(Image.composite(head, tail, ramp), (0, 0)); return out

def cut_at_gaps(im, margin=260):
    a = im.getchannel("A"); w, h = a.size; px = a.load()
    col = [sum(px[x, y] for y in range(0, h, 4)) for x in range(w)]
    left = min(range(margin), key=lambda x: col[x]); right = min(range(w - margin, w), key=lambda x: col[x])
    if col[left] or col[right]:
        print(f"提醒：中景切點不是完全空白（左 {col[left]}、右 {col[right]}），接縫要放大檢查")
    return im.crop((left, 0, right, h))

def silhouette(path, color):
    g = Image.open(path).convert("L")
    layer = Image.new("RGBA", g.size, color + (0,))
    layer.putalpha(g.point(lambda v: 0 if v > 235 else min(255, int((235 - v) * 255 / 200)))); return layer

def dunes(W=1440, H=540, color=(48, 34, 70)):
    """近景沙丘：用正弦波疊出起伏的沙丘剪影，再點綴小石頭和仙人掌；週期整除寬度，左右自然接續。"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    top = [H - 44 + 6 * math.sin(2 * math.pi * x / 480) + 3 * math.sin(2 * math.pi * x / 160 + 1) for x in range(W)]  # 沙丘頂約 y 487–505，在地面線下，不擋腳
    bottom = 522  # 下面留透明
    d.polygon([(0, bottom)] + [(x, top[x]) for x in range(W)] + [(W - 1, bottom)], fill=color + (255,))
    for x0 in (210, 690, 1170):  # 小仙人掌
        y0 = top[x0]
        d.rounded_rectangle((x0 - 5, y0 - 34, x0 + 5, y0 + 2), radius=5, fill=color + (255,))
        d.rounded_rectangle((x0 - 15, y0 - 24, x0 - 9, y0 - 8), radius=3, fill=color + (255,)); d.line((x0 - 12, y0 - 10, x0 - 4, y0 - 10), fill=color + (255,), width=5)
        d.rounded_rectangle((x0 + 9, y0 - 28, x0 + 15, y0 - 14), radius=3, fill=color + (255,)); d.line((x0 + 4, y0 - 16, x0 + 12, y0 - 16), fill=color + (255,), width=5)
    for x0, r in ((420, 9), (450, 6), (930, 10), (1320, 7)):  # 小石頭
        d.ellipse((x0 - r, top[x0] - r, x0 + r, top[x0] + r // 2), fill=color + (255,))
    return im

far = Image.open(os.path.join(G4, "w2bg", "w2-bg-far_00001_.png")).convert("RGB")
mid = silhouette(os.path.join(G4, "w2bg", "w2-bg-mid_00002_.png"), (44, 32, 78))
for name, im in [("w2-desert-far", seamless(far, 192)), ("w2-desert-mid", cut_at_gaps(mid))]:
    save(im.resize((round(im.width * 540 / im.height), 540), Image.LANCZOS), "backgrounds", name + ".png")
save(dunes(), "backgrounds", "w2-desert-near.png")
print("ok")
