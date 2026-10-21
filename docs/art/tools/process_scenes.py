"""世界 1、2 的 4 個場景背景（白天→黃昏→晚上→深夜）與場景之間的過渡圖。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_scenes.py <ComfyUI output 資料夾> <專案根目錄>
注意：來源圖（ComfyUI 輸出的 gk2、gk4、gk6）只在美術的電腦上，沒有放進 repo。
第三段（晚上）沿用已完成的 forest-* 和 w2-desert-*。

輸出（public/assets/backgrounds/）：
- w<世界>-s<段>-far|mid|near.png：場景三層，高 540，左右可無縫接續
- w<世界>-t<前段><後段>-far|mid|near.png：過渡圖，寬 1440；左邊接前一個場景、右邊接下一個場景
"""
import math, os, random, sys
from PIL import Image, ImageDraw

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G = lambda *p: os.path.join(OUT_DIR, *p)
BG = lambda name: os.path.join(ROOT, "public", "assets", "backgrounds", name)
H = 540

def seamless(im, n=192):
    w = im.width; out = im.crop((0, 0, w - n, im.height))
    head, tail = im.crop((0, 0, n, im.height)), im.crop((w - n, 0, w, im.height))
    ramp = Image.linear_gradient("L").rotate(90).resize((n, im.height))
    out.paste(Image.composite(head, tail, ramp), (0, 0)); return out

def cut_at_gaps(im, margin=260):
    a = im.getchannel("A"); w, h = a.size; px = a.load()
    col = [sum(px[x, y] for y in range(0, h, 4)) for x in range(w)]
    left = min(range(margin), key=lambda x: col[x]); right = min(range(w - margin, w), key=lambda x: col[x])
    if col[left] or col[right]:
        print(f"提醒：{im.info.get('name', '')} 切點不是完全空白（左 {col[left]}、右 {col[right]}）")
    return im.crop((left, 0, right, h))

def silhouette(path, color, strip_spikes=False):
    g = Image.open(path).convert("L"); w, h = g.size
    alpha = g.point(lambda v: 0 if v > 235 else min(255, int((235 - v) * 255 / 200)))
    if strip_spikes:  # 近景：高出草叢的東西（模型自己加的小動物）用旁邊的草整欄換掉
        px = alpha.load(); tops = [next((y for y in range(h) if px[x, y] > 128), h) for x in range(w)]
        line = sorted(tops)[len(tops) // 2] - 18; x = 0
        while x < w:
            if tops[x] < line:
                x2 = x
                while x2 < w and tops[x2] < line: x2 += 1
                if x2 - x > 6:
                    a0, a1 = max(0, x - 12), min(w, x2 + 12); width = a1 - a0
                    src = a0 - width if a0 - width >= 0 else a1
                    alpha.paste(alpha.crop((src, 0, src + width, h)), (a0, 0))
                x = x2
            else:
                x += 1
    layer = Image.new("RGBA", (w, h), color + (0,)); layer.putalpha(alpha); return layer

def to_h(im):
    return im.resize((round(im.width * H / im.height), H), Image.LANCZOS)

def save(im, name):
    os.makedirs(os.path.dirname(BG(name)), exist_ok=True); im.save(BG(name), optimize=True)

# ---- 程式畫的中景（模型畫不好的） ----
def meadow_mid(color, W=1440):
    """草原：圓樹、矮樹叢、木柵欄。位置固定，左右邊緣留空，可直接接續。"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = color + (255,)
    base = 470; rnd = random.Random(1)
    for x, r in [(150, 70), (420, 52), (640, 86), (980, 60), (1220, 76)]:
        d.rectangle((x - 8, base - r - 40, x + 8, base), fill=c)
        d.ellipse((x - r, base - r * 2 - 50, x + r, base - 30), fill=c)
        d.ellipse((x - r * .7 - r * .5, base - r * 1.4 - 40, x + r * .2, base - 20), fill=c)
    for x in range(40, W - 40, 22):  # 柵欄
        if 700 < x < 900: continue
        d.rectangle((x - 3, base - 34, x + 3, base), fill=c)
    d.rectangle((40, base - 28, 700, base - 22), fill=c); d.rectangle((900, base - 28, W - 40, base - 22), fill=c)
    for x in range(80, W - 80, 160):  # 矮樹叢
        rr = 18 + rnd.randint(0, 14); d.ellipse((x - rr * 1.6, base - rr * 1.6, x + rr * 1.6, base + 6), fill=c)
    return im

def reeds_mid(color, W=1440):
    """河邊：蘆葦和香蒲（對岸的樹林已經畫在遠景裡；程式畫的柳樹不好看，所以不畫樹）。"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = color + (255,)
    base = 470
    for x in range(30, W - 30, 9):  # 蘆葦
        hgt = 40 + 30 * (0.5 + 0.5 * math.sin(x * 0.13)) + 10 * math.sin(x * 0.7)
        d.line([(x, base), (x + 4, base - hgt)], fill=c, width=3)
        if x % 27 == 0: d.ellipse((x, base - hgt - 16, x + 8, base - hgt + 4), fill=c)
    return im

def dunes(color, W=1440, phase=0.0, rocks=(), stubs=()):
    """近景沙丘（同世界 2 第三段的做法）：頂端約 y 487–505，在地面線下，不擋腳。"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = color + (255,)
    top = [H - 44 + 6 * math.sin(2 * math.pi * x / 480 + phase) + 3 * math.sin(2 * math.pi * x / 160 + 1 + phase) for x in range(W)]
    d.polygon([(0, 522)] + [(x, top[x]) for x in range(W)] + [(W - 1, 522)], fill=c)
    for x0, r in rocks: d.ellipse((x0 - r, top[x0] - r, x0 + r, top[x0] + r // 2), fill=c)
    for x0, hh in stubs:  # 斷掉的石柱
        d.rectangle((x0 - 10, top[x0] - hh, x0 + 10, top[x0] + 2), fill=c); d.rectangle((x0 - 14, top[x0] - hh - 6, x0 + 14, top[x0] - hh), fill=c)
    return im

# ---- 場景 ----
def far(path):
    return to_h(seamless(Image.open(path).convert("RGB")))

def mid_from(path, color):
    return to_h(cut_at_gaps(silhouette(path, color)))

def near_from(path, color):
    return to_h(seamless(silhouette(path, color, strip_spikes=True), 48))

SCENES = {
    # 世界 1 失眠森林
    "w1-s1": (far(G("gk6", "w1", "w1s1-far_00003_.png")), meadow_mid((96, 146, 116)), near_from(G("gk6", "w1", "w1s1-near_00003_.png"), (62, 108, 82))),
    "w1-s2": (far(G("gk6", "w1", "w1s2-far_00002_.png")), reeds_mid((96, 58, 92)), near_from(G("gk6", "w1", "w1s2-near_00003_.png"), (70, 40, 70))),
    "w1-s4": (far(G("gk6", "w1", "w1s4-far_00003_.png")), mid_from(G("gk6", "w1", "w1s4-mid_00004_.png"), (22, 18, 58)), near_from(G("gk2", "bg", "bg-near_00006_.png"), (14, 12, 40))),
    # 世界 2 沙漠金字塔王國
    "w2-s1": (far(G("gk6", "w2", "w2s1-far_00003_.png")), mid_from(G("gk6", "w2", "w2s1-mid_00003_.png"), (124, 98, 78)), near_from(G("gk6", "w2", "w2s1-near_00003_.png"), (98, 112, 70))),
    "w2-s2": (far(G("gk6", "w2", "w2s2-far_00004_.png")), mid_from(G("gk6", "w2", "w2s2-mid_00001_.png"), (100, 60, 86)), dunes((76, 46, 66), phase=1.3, rocks=((300, 9), (860, 7)))),
    "w2-s4": (far(G("gk6", "w2", "w2s4-far_00002_.png")), mid_from(G("gk6", "w2", "w2s4-mid_00001_.png"), (24, 20, 60)), dunes((16, 13, 42), phase=2.6, stubs=((380, 34), (1010, 22)))),
}
for key, layers in SCENES.items():
    for name, im in zip(("far", "mid", "near"), layers):
        save(im, f"{key}-{name}.png")

# 第三段沿用已完成的晚上背景
def load(name):
    return Image.open(BG(name)).convert("RGBA")
SCENES["w1-s3"] = tuple(load(f"forest-{n}.png") for n in ("far", "mid", "near"))
SCENES["w2-s3"] = tuple(load(f"w2-desert-{n}.png") for n in ("far", "mid", "near"))

# ---- 過渡圖：左邊延續前一個場景、右邊接上下一個場景，中間 480 px 慢慢換 ----
def tiled(im, W, end_aligned=False):
    im = im.convert("RGBA"); out = Image.new("RGBA", (W, H), (0, 0, 0, 0)); w = im.width
    x = W - math.ceil(W / w) * w if end_aligned else 0  # end_aligned：右邊緣剛好接上下一張的開頭
    while x < W:
        out.alpha_composite(im, (x, 0)) if x >= 0 else out.alpha_composite(im.crop((-x, 0, w, H)), (0, 0)); x += w
    return out

def transition(a, b, W=1440, blend=480):
    ramp = Image.new("L", (W, H), 0); d = ImageDraw.Draw(ramp)
    for x in range(W):
        t = min(1, max(0, (x - (W - blend) / 2) / blend)); t = t * t * (3 - 2 * t)  # 平滑
        d.line([(x, 0), (x, H)], fill=int(255 * t))
    return Image.composite(tiled(b, W, end_aligned=True), tiled(a, W), ramp)

for w in ("w1", "w2"):
    for s1, s2 in ((1, 2), (2, 3), (3, 4)):
        A, B = SCENES[f"{w}-s{s1}"], SCENES[f"{w}-s{s2}"]
        for i, name in enumerate(("far", "mid", "near")):
            im = transition(A[i], B[i])
            save(im.convert("RGB") if name == "far" else im, f"{w}-t{s1}{s2}-{name}.png")
print("ok")
