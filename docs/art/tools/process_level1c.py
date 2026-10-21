"""第一關補圖：關著的寶箱（程式畫）、正面刺盾的刺蝟、子彈。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_level1c.py <ComfyUI output/gk3 資料夾> <專案根目錄>
注意：來源圖（ComfyUI 輸出）只在美術的電腦上，沒有放進 repo。
"""
import math, os, sys
from PIL import Image, ImageDraw

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

def save(im, *path):
    os.makedirs(os.path.dirname(A(*path)), exist_ok=True); im.save(A(*path), optimize=True)

def star(cx, cy, r1, r2, n=5, rot=-90):
    return [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.radians(rot + i * 180 / n)),
             cy + (r1 if i % 2 == 0 else r2) * math.sin(math.radians(rot + i * 180 / n))) for i in range(2 * n)]

# 1. 關著的寶箱：模型一直畫成打開的，改用程式畫；顏色照打開的寶箱（木頭棕、金邊、星星鎖）
def closed_chest():
    S = 4; W, H = 100 * S, 92 * S
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    o = 5 * S
    body = (8 * S, 40 * S, 92 * S, 86 * S)
    d.rounded_rectangle(body, radius=6 * S, fill=(140, 90, 60, 255), outline=OUTLINE, width=o)
    d.pieslice((8 * S, 6 * S, 92 * S, 74 * S), 180, 360, fill=(120, 74, 50, 255), outline=OUTLINE, width=o)
    d.line((8 * S, 40 * S, 92 * S, 40 * S), fill=OUTLINE, width=o)
    for x in (22, 78):  # 左右金色箍
        d.rectangle(((x - 5) * S, 14 * S, (x + 5) * S, 84 * S), fill=GOLD, outline=OUTLINE, width=3 * S)
    d.rectangle((10 * S, 36 * S, 90 * S, 44 * S), fill=GOLD, outline=OUTLINE, width=3 * S)
    d.rounded_rectangle((40 * S, 34 * S, 60 * S, 58 * S), radius=4 * S, fill=GOLD, outline=OUTLINE, width=3 * S)
    d.polygon(star(50 * S, 46 * S, 8 * S, 3.5 * S), fill=YELLOW, outline=OUTLINE)
    return im

save(fit(closed_chest(), (40, 40)), "items", "treasure-chest-closed.png")

# 2. 正面刺盾的失眠刺蝟（盾牌在左邊、朝向玩家）
save(fit(cutout(os.path.join(SRC, "fix", "hedgehog-front_00001_.png")), (96, 72)), "enemies", "insomnia-hedgehog.png")

# 3. 子彈：小羊、枕頭用模型畫的（翻成朝右）；泡泡、牛奶滴、音符、光束用程式畫
save(fit(cutout(os.path.join(SRC, "fix", "bullet-sheep_00001_.png")).transpose(Image.FLIP_LEFT_RIGHT), (18, 16)), "bullets", "sheep.png")
save(fit(cutout(os.path.join(SRC, "fix", "bullet-pillow_00001_.png")), (22, 18)), "bullets", "pillow.png")

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
    return fit(im, (10, 8))

def note():
    S = 96; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.line([(58, 14), (58, 70)], fill=OUTLINE, width=12)
    d.polygon([(58, 10), (84, 26), (84, 42), (58, 28)], fill=YELLOW, outline=OUTLINE)
    d.ellipse((24, 56, 64, 86), fill=YELLOW, outline=OUTLINE, width=6)
    d.line([(58, 18), (58, 66)], fill=YELLOW, width=4)
    return fit(im.crop(im.getchannel("A").getbbox()), (14, 14))

def beam():
    W, H = 128, 40; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for i, (a, c) in enumerate([(70, YELLOW), (150, YELLOW), (255, CREAM)]):
        pad = 4 + i * 7
        d.rectangle((0, pad, W, H - pad), fill=c[:3] + (a,))
    return im.resize((32, 10), Image.LANCZOS)  # 橫向可以重複接成長光束

save(bubble(), "bullets", "yawn-bubble.png")
save(milk_drop(), "bullets", "milk-drop.png")
save(note(), "bullets", "music-note.png")
save(beam(), "bullets", "moon-beam.png")
print("ok")
