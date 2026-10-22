"""美術處理共用工具（世界 3 起使用；世界 1、2 的舊腳本保留原樣）。"""
import math, os
from PIL import Image, ImageDraw, ImageEnhance

H = 540
OUTLINE = (58, 42, 90, 255)

def cutout(path):
    """白底圖從四角填色去背，裁掉空白。"""
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

def seamless(im, n=192):
    """頭尾交叉淡化（不透明圖用；透明圖先乘 alpha）。"""
    mode = im.mode; im = im.convert("RGBa") if mode == "RGBA" else im
    w = im.width; out = im.crop((0, 0, w - n, im.height))
    head, tail = im.crop((0, 0, n, im.height)), im.crop((w - n, 0, w, im.height))
    ramp = Image.linear_gradient("L").rotate(90).resize((n, im.height))
    out.paste(Image.composite(head, tail, ramp), (0, 0))
    return out.convert("RGBA") if mode == "RGBA" else out

def cut_at_gaps(im, margin=260):
    """剪影：在左右兩端各找最空的一欄直接切開。"""
    a = im.getchannel("A"); w, h = a.size; px = a.load()
    col = [sum(px[x, y] for y in range(0, h, 4)) for x in range(w)]
    left = min(range(margin), key=lambda x: col[x]); right = min(range(w - margin, w), key=lambda x: col[x])
    if col[left] or col[right]:
        print(f"提醒：中景切點不是完全空白（左 {col[left]}、右 {col[right]}），接縫要放大檢查")
    return im.crop((left, 0, right, h))

def silhouette(path, color, strip_spikes=False):
    """白底黑剪影 → 依深淺轉透明並染色；strip_spikes 會把高出草叢的東西用旁邊的內容換掉。"""
    g = Image.open(path).convert("L"); w, h = g.size
    alpha = g.point(lambda v: 0 if v > 235 else min(255, int((235 - v) * 255 / 200)))
    if strip_spikes:
        px = alpha.load(); tops = [next((y for y in range(h) if px[x, y] > 128), h) for x in range(w)]
        filled = sorted(t for t in tops if t < h) or [h]  # 只看有東西的欄（稀疏的海草也適用）
        line = filled[len(filled) // 2] - 18; x = 0
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

def far(path, darken=None):
    """遠景：可選擇壓暗並偏色（例如把白天的圖變成深夜）。"""
    im = Image.open(path).convert("RGB")
    if darken:
        factor, tint = darken
        im = ImageEnhance.Brightness(im).enhance(factor)
        im = Image.blend(im, Image.new("RGB", im.size, tint), 0.35)
    return to_h(seamless(im))

def mid_from(path, color):
    return to_h(cut_at_gaps(silhouette(path, color)))

def near_from(path, color, max_h=46, bottom=512):
    """近景：裁掉兩端空白、限制高度，貼齊地面線下方（底部在 y=bottom），左右無縫。"""
    lay = silhouette(path, color, strip_spikes=True); a = lay.getchannel("A"); w, h = a.size; px = a.load()
    col = [sum(1 for y in range(0, h, 2) if px[x, y] > 128) for x in range(w)]
    nz = sorted(v for v in col if v) or [1]; full = nz[len(nz) // 2] * 0.3; xs = [x for x, v in enumerate(col) if v >= full]
    bb = a.getbbox(); lay = lay.crop((xs[0] + 8, bb[1], xs[-1] - 8, bb[3]))
    k = min(max_h / lay.height, H / h)
    lay = seamless(lay.resize((round(lay.width * k), round(lay.height * k)), Image.LANCZOS), 32)
    out = Image.new("RGBA", (lay.width, H), (0, 0, 0, 0)); out.alpha_composite(lay, (0, bottom - lay.height)); return out

def seabed(color, W=1440, phase=0.0, rocks=()):
    """近景海床：低矮起伏＋石頭（程式畫），頂端在地面線附近。"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = color + (255,)
    top = [H - 44 + 6 * math.sin(2 * math.pi * x / 480 + phase) + 3 * math.sin(2 * math.pi * x / 160 + 1 + phase) for x in range(W)]
    d.polygon([(0, 522)] + [(x, top[x]) for x in range(W)] + [(W - 1, 522)], fill=c)
    for x0, r in rocks: d.ellipse((x0 - r, top[x0] - r, x0 + r, top[x0] + r // 2), fill=c)
    return im

def tiled(im, W, end_aligned=False):
    im = im.convert("RGBA"); out = Image.new("RGBA", (W, H), (0, 0, 0, 0)); w = im.width
    x = W - math.ceil(W / w) * w if end_aligned else 0
    while x < W:
        out.alpha_composite(im, (x, 0)) if x >= 0 else out.alpha_composite(im.crop((-x, 0, w, H)), (0, 0)); x += w
    return out

def transition(a, b, W=1440, blend=480):
    """過渡圖：左邊延續 a、右邊接上 b，中間 blend px 平滑換過去（先乘 alpha 再混合）。"""
    ramp = Image.new("L", (W, H), 0); d = ImageDraw.Draw(ramp)
    for x in range(W):
        t = min(1, max(0, (x - (W - blend) / 2) / blend)); t = t * t * (3 - 2 * t)
        d.line([(x, 0), (x, H)], fill=int(255 * t))
    return Image.composite(tiled(b, W, end_aligned=True).convert("RGBa"), tiled(a, W).convert("RGBa"), ramp).convert("RGBA")

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True)

def seaweed(color, W=1440, seed=0, kelp=14, coral=8, bottom=512):
    """近景海草（程式畫）：彎曲的海帶葉片＋圓圓的珊瑚，底部貼齊 y=bottom，左右兩端留空可接續。"""
    import random
    rnd = random.Random(seed); im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = color + (255,)
    d.rectangle((0, bottom - 6, W, bottom), fill=c)  # 一條低矮的海床
    for _ in range(kelp):
        x0 = rnd.randint(40, W - 40); hgt = rnd.randint(26, 44); n = rnd.randint(2, 3)
        for k in range(n):
            ph = rnd.random() * 6; xs = x0 + (k - n / 2) * 7
            pts = [(xs + 5 * math.sin(ph + t / 3), bottom - hgt * t / 8) for t in range(9)]
            d.line(pts, fill=c, width=5, joint="curve")
    for _ in range(coral):
        x0 = rnd.randint(40, W - 40); r = rnd.randint(7, 12)
        for dx, dy in ((0, 0), (-r * .8, r * .4), (r * .8, r * .4)):
            d.ellipse((x0 + dx - r, bottom - 2 * r + dy, x0 + dx + r, bottom + dy), fill=c)
    return im
