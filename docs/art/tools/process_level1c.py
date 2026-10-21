"""第一關補圖：關著的寶箱（程式畫）、正面刺盾的刺蝟、子彈。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_level1c.py <ComfyUI output/gk3 資料夾> <專案根目錄>
注意：來源圖（ComfyUI 輸出）只在美術的電腦上，沒有放進 repo。
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFilter

SRC, ROOT = sys.argv[1], sys.argv[2]
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
OUTLINE = (58, 42, 90, 255)      # 外框深紫
GOLD = (233, 185, 73, 255)
CREAM = (255, 246, 229, 255)
YELLOW = (248, 224, 142, 255)
LAVENDER = (190, 170, 235, 255)

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

def outlined(im, color=OUTLINE):
    """清掉低透明度雜點，再加 1 px 深紫外框。"""
    a = im.getchannel("A").point(lambda v: 0 if v < 40 else v); im.putalpha(a)
    ring = a.filter(ImageFilter.MaxFilter(3))
    out = Image.new("RGBA", im.size, color[:3] + (0,)); out.putalpha(ring)
    out.alpha_composite(im); return out

def pad(im, n=1):
    c = Image.new("RGBA", (im.width + 2 * n, im.height + 2 * n), (0, 0, 0, 0)); c.alpha_composite(im, (n, n)); return c

def save(im, *path):
    os.makedirs(os.path.dirname(A(*path)), exist_ok=True); im.save(A(*path), optimize=True)

def star(cx, cy, r1, r2, n=5, rot=-90):
    return [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.radians(rot + i * 180 / n)),
             cy + (r1 if i % 2 == 0 else r2) * math.sin(math.radians(rot + i * 180 / n))) for i in range(2 * n)]

# 1. 關著的寶箱：模型一直畫成打開的，改用程式畫；顏色照打開的寶箱（木頭棕、金邊、星星鎖）
def chest_colors():
    """從打開的寶箱取木頭和金邊的顏色，讓兩張一致。"""
    im = Image.open(A("items", "treasure-chest.png")).convert("RGBA"); wood, gold = [], []
    for r, g, b, a in im.getdata():
        if a < 200: continue
        if r > 200 and g > 160 and b < 170 and r - b > 60: gold.append((r, g, b))
        elif 70 < r < 190 and r > g + 25 and g > b: wood.append((r, g, b))
    med = lambda L, i: sorted(c[i] for c in L)[len(L) // 2]
    return tuple(med(wood, i) for i in range(3)) + (255,), tuple(med(gold, i) for i in range(3)) + (255,)

def closed_chest():
    WOOD, GOLD = chest_colors()
    LID = tuple(int(c * 0.85) for c in WOOD[:3]) + (255,)
    S = 4; W, H = 100 * S, 92 * S
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    o = 5 * S
    body = (8 * S, 40 * S, 92 * S, 86 * S)
    d.rounded_rectangle(body, radius=6 * S, fill=WOOD, outline=OUTLINE, width=o)
    d.pieslice((8 * S, 6 * S, 92 * S, 74 * S), 180, 360, fill=LID, outline=OUTLINE, width=o)
    d.line((8 * S, 40 * S, 92 * S, 40 * S), fill=OUTLINE, width=o)
    for x in (22, 78):  # 左右金色箍
        d.rectangle(((x - 5) * S, 14 * S, (x + 5) * S, 84 * S), fill=GOLD, outline=OUTLINE, width=3 * S)
    d.rectangle((10 * S, 36 * S, 90 * S, 44 * S), fill=GOLD, outline=OUTLINE, width=3 * S)
    d.rounded_rectangle((40 * S, 34 * S, 60 * S, 58 * S), radius=4 * S, fill=GOLD, outline=OUTLINE, width=3 * S)
    d.polygon(star(50 * S, 46 * S, 9 * S, 4 * S), fill=YELLOW, outline=OUTLINE, width=3 * S)
    return im

save(fit(closed_chest(), (40, 40)), "items", "treasure-chest-closed.png")

# 2. 正面刺盾的失眠刺蝟：原圖朝右、拿的是金屬圓盾 → 先在盾的位置畫一面放射狀尖刺的「刺盾」蓋上去，再左右翻轉成朝左（盾朝玩家）
def spiky_shield(im):
    px = im.load(); w, h = im.size; pts = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and min(r, g, b) > 140 and max(r, g, b) - min(r, g, b) < 40: pts.append((x, y))  # 銀灰色＝金屬盾
    xs, ys = sorted(p[0] for p in pts), sorted(p[1] for p in pts)
    cx, cy = xs[len(xs) // 2], ys[len(ys) // 2]
    R = (xs[int(len(xs) * .95)] - xs[int(len(xs) * .05)]) / 2 + 6
    d = ImageDraw.Draw(im); n = 14
    spikes = []
    for i in range(2 * n):
        rr = R * (1.35 if i % 2 == 0 else 0.95); t = math.pi * i / n
        spikes.append((cx + rr * math.cos(t), cy + rr * math.sin(t)))
    d.polygon(spikes, fill=(150, 98, 62, 255), outline=OUTLINE, width=8)
    d.ellipse((cx - R * .8, cy - R * .8, cx + R * .8, cy + R * .8), fill=(178, 124, 82, 255), outline=OUTLINE, width=8)
    d.polygon(star(cx, cy, R * .4, R * .17), fill=YELLOW, outline=OUTLINE, width=6)
    return im

hog = spiky_shield(cutout(os.path.join(SRC, "fix", "hedgehog-front_00001_.png")))
hog = pad(hog, 120); hog = hog.crop(hog.getchannel("A").getbbox()).transpose(Image.FLIP_LEFT_RIGHT)
save(fit(hog, (96, 72)), "enemies", "insomnia-hedgehog.png")

# 3. 子彈：小羊、枕頭用模型畫的（翻成朝右）；泡泡、牛奶滴、音符、光束用程式畫
save(outlined(pad(fit(cutout(os.path.join(SRC, "fix", "bullet-sheep_00001_.png")).transpose(Image.FLIP_LEFT_RIGHT), (18, 16)))), "bullets", "sheep.png")
save(outlined(pad(fit(cutout(os.path.join(SRC, "fix", "bullet-pillow_00001_.png")), (30, 22)))), "bullets", "pillow.png")

def bubble():
    S = 64; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((4, 4, S - 4, S - 4), fill=(200, 230, 255, 170), outline=OUTLINE, width=5)
    d.ellipse((16, 14, 30, 26), fill=(255, 255, 255, 230))
    return fit(im, (12, 12))

def milk_drop():
    S = 64; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.polygon([(8, 32), (40, 14), (40, 50)], fill=CREAM)  # 尖端朝左（往右飛）
    d.ellipse((24, 14, 60, 50), fill=CREAM, outline=OUTLINE, width=5)
    d.line([(8, 32), (40, 14)], fill=OUTLINE, width=5); d.line([(8, 32), (40, 50)], fill=OUTLINE, width=5)
    d.ellipse((30, 22, 38, 30), fill=(255, 255, 255, 255))
    return fit(im, (10, 10))

def note():
    S = 96; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.line([(58, 14), (58, 70)], fill=OUTLINE, width=12)
    d.polygon([(58, 10), (84, 26), (84, 42), (58, 28)], fill=YELLOW, outline=OUTLINE, width=6)
    d.ellipse((24, 56, 64, 86), fill=YELLOW, outline=OUTLINE, width=6)
    d.line([(58, 18), (58, 66)], fill=YELLOW, width=4)
    return fit(im.crop(im.getchannel("A").getbbox()), (14, 14))

def beam():
    W, H = 128, 40; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for i, (a, c) in enumerate([(170, YELLOW), (230, YELLOW), (255, CREAM)]):
        pad = 4 + i * 7
        d.rectangle((0, pad, W, H - pad), fill=c[:3] + (a,))
    return im.resize((32, 10), Image.LANCZOS)  # 橫向可以重複接成長光束

save(bubble(), "bullets", "yawn-bubble.png")
save(milk_drop(), "bullets", "milk-drop.png")
save(note(), "bullets", "music-note.png")
save(beam(), "bullets", "moon-beam.png")
print("ok")
