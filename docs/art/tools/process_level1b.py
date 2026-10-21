"""第一關補充素材：關主二三階段、魔物睡著版、特效、三層視差背景。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_level1b.py <ComfyUI output/gk2 資料夾> <專案根目錄>
注意：來源圖（ComfyUI 輸出）只在美術的電腦上，沒有放進 repo。
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

SRC, ROOT = sys.argv[1], sys.argv[2]
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)

# (類別資料夾, 輸出檔名, 來源, 左右翻轉, (寬上限, 高上限))
PICKS = [
    ("enemies", "night-owl-boss-phase2", "boss/owl-phase2_00011_.png", False, (240, 200)),
    ("enemies", "night-owl-boss-phase3", "boss/owl-phase3_00005_.png", False, (240, 200)),
    ("enemies", "clockbug-sleep", "sleep/clockbug-sleep_00005_.png", False, (80, 56)),
    ("enemies", "coffee-bean-sprite-sleep", "sleep/coffee-bean-sprite-sleep_00005_.png", False, (56, 52)),
    ("enemies", "night-bat-sleep", "sleep/night-bat-sleep_00006_.png", False, (56, 56)),
    ("enemies", "insomnia-hedgehog-sleep", "sleep/insomnia-hedgehog-sleep_00007_.png", False, (96, 72)),
    ("enemies", "night-owl-boss-sleep", "sleep/night-owl-boss-sleep_00007_.png", False, (240, 200)),
    ("fx", "dream-sheep", "fx/dream-sheep_00004_.png", False, (40, 40)),
]

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

for cat, name, src, flip, box in PICKS:
    im = cutout(os.path.join(SRC, src))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    os.makedirs(A(cat), exist_ok=True)
    fit(im, box).save(A(cat, name + ".png"), optimize=True)

# Zzz：用程式畫（模型不會寫字）。三個由小到大的 Z，月光黃填色、深紫外框
def zzz():
    S = 256; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for size, xy in [(70, (20, 150)), (95, (85, 80)), (125, (130, 0))]:
        f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", size)
        d.text(xy, "Z", font=f, fill=(248, 224, 142, 255), stroke_width=8, stroke_fill=(58, 42, 90, 255))
    return fit(im.crop(im.getchannel("A").getbbox()), (32, 32))
os.makedirs(A("fx"), exist_ok=True); zzz().save(A("fx", "zzz.png"), optimize=True)

# 三層視差背景：高度 540，左右可以無縫接續（頭尾交叉淡化）
def seamless(im, n):
    w = im.width; out = im.crop((0, 0, w - n, im.height))
    head, tail = im.crop((0, 0, n, im.height)), im.crop((w - n, 0, w, im.height))
    ramp = Image.linear_gradient("L").rotate(90).resize((n, im.height))  # 左 0 → 右 255
    out.paste(Image.composite(head, tail, ramp), (0, 0))
    return out

def silhouette(path, color, strip_spikes=False):
    """白底黑剪影 → 依深淺轉成透明度，再染成指定顏色。"""
    g = Image.open(path).convert("L"); w, h = g.size
    alpha = g.point(lambda v: 0 if v > 235 else min(255, int((235 - v) * 255 / 200)))
    if strip_spikes:  # 近景：把高出草叢的東西（模型自己加的小動物）切掉
        px = alpha.load(); tops = []
        for x in range(w):
            y = next((y for y in range(h) if px[x, y] > 128), h); tops.append(y)
        line = sorted(tops)[len(tops) // 2] - 18
        ImageDraw.Draw(alpha).rectangle((0, 0, w, line), fill=0)
    layer = Image.new("RGBA", (w, h), color + (0,)); layer.putalpha(alpha)
    return layer

os.makedirs(A("backgrounds"), exist_ok=True)
far = Image.open(os.path.join(SRC, "bg/bg-far_00001_.png")).convert("RGB")
mid = silhouette(os.path.join(SRC, "bg/bg-mid_00006_.png"), (30, 27, 75))
near = silhouette(os.path.join(SRC, "bg/bg-near_00006_.png"), (20, 18, 46), strip_spikes=True)
for name, im in [("forest-far", far), ("forest-mid", mid), ("forest-near", near)]:
    im = seamless(im, 192)
    im = im.resize((round(im.width * 540 / im.height), 540), Image.LANCZOS)
    im.save(A("backgrounds", name + ".png"), optimize=True)
print("ok")
