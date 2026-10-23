"""新武器的子彈、故事畫面用的小圖（程式畫的部分）。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/make_story.py <專案根目錄>
清單見 docs/art/story-weapons-assets.md（遊戲組 2026-10-23）。AI 生成的部分在 process_story.py。
"""
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = sys.argv[1]
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
OUTLINE = (58, 42, 90, 255); K = 4

def save(im, *p):
    os.makedirs(os.path.dirname(A(*p)), exist_ok=True); im.save(A(*p), optimize=True)

def canvas(w, h):
    im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

# ---- 子彈（朝右） ----
def yarn_ball():
    im, d = canvas(16, 16)
    d.ellipse((1 * K, 1 * K, 15 * K, 15 * K), fill=(250, 180, 205, 255), outline=OUTLINE, width=2 * K)
    for (x0, y0, x1, y1), a in (((3, 2, 15, 12), 150), ((1, 5, 12, 15), 300), ((4, 4, 12, 12), 20)):  # 不同大小、角度的毛線紋路
        d.arc((x0 * K, y0 * K, x1 * K, y1 * K), a, a + 110, fill=(140, 190, 245, 255), width=K)
    d.line((12 * K, 4 * K, 15 * K, 1 * K), fill=(250, 180, 205, 255), width=K)
    return im.resize((16, 16), Image.LANCZOS)

def marshmallow():
    im, d = canvas(20, 18)
    d.rounded_rectangle((2 * K, 3 * K, 18 * K, 16 * K), radius=6 * K, fill=(255, 250, 245, 255), outline=OUTLINE, width=2 * K)
    d.rounded_rectangle((4 * K, 5 * K, 12 * K, 9 * K), radius=2 * K, fill=(255, 220, 230, 255))
    return im.resize((20, 18), Image.LANCZOS)

def hypno_wave():  # 往右的弧形波「)」，淡紫半透明、一圈一圈（圓心在畫布左外側，弧剛好落在畫布內）
    im, d = canvas(24, 48); cx, cy = -14, 24
    for r, col, w in ((34, OUTLINE, 6), (34, (215, 190, 255, 255), 3), (27, (190, 160, 245, 230), 3), (20, (170, 140, 235, 200), 2)):
        d.arc(((cx - r) * K, (cy - r) * K, (cx + r) * K, (cy + r) * K), -48, 48, fill=col, width=w * K)
    im.putalpha(im.getchannel("A").point(lambda v: v * 220 // 255))
    return im.resize((24, 48), Image.LANCZOS)

def meteor():  # 星星在下、尾巴往上
    im, d = canvas(24, 40)
    for i in range(6):
        y = 2 + i * 3; w = 2 + i
        d.ellipse(((12 - w) * K, y * K, (12 + w) * K, (y + 8) * K), fill=(255, 225 - i * 10, 140, 60 + i * 25))
    cx, cy = 12, 30
    pts = [(cx + (10 if j % 2 == 0 else 4.5) * math.cos(math.radians(-90 + j * 36)), cy + (10 if j % 2 == 0 else 4.5) * math.sin(math.radians(-90 + j * 36))) for j in range(10)]
    d.polygon([(x * K, y * K) for x, y in pts], fill=(250, 225, 120, 255), outline=OUTLINE, width=K)
    return im.resize((24, 40), Image.LANCZOS)

for name, fn in (("yarn-ball", yarn_ball), ("marshmallow", marshmallow), ("hypno-wave", hypno_wave), ("meteor", meteor)):
    save(fn(), "bullets", name + ".png")

# ---- 夢貘剪影：用現有的夢貘睡著圖填成深紫剪影，看不出表情 ----
tapir = Image.open(A("enemies", "w10-dream-tapir-boss-sleep.png")).convert("RGBA")
a = tapir.getchannel("A").point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.GaussianBlur(1))
sil = Image.new("RGBA", tapir.size, (28, 20, 52, 0)); sil.putalpha(a)
s = min(200 / sil.width, 160 / sil.height)
save(sil.resize((round(sil.width * s), round(sil.height * s)), Image.LANCZOS), "story", "tapir-silhouette.png")

# ---- 城下的一排小房子（夜晚），窗戶是空的方格，位置另存 json 給程式點燈 ----
def town():
    W, H = 960, 220; im = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    wins = []; x = 10
    import random
    rnd = random.Random(10)
    while x < W:  # 排滿整個寬度，最後一間可以超出畫布
        w = rnd.randint(80, 120); h = rnd.randint(90, 140); top = H - h
        body = (60 + rnd.randint(0, 20), 54 + rnd.randint(0, 16), 100 + rnd.randint(0, 20), 255)
        roof = (90, 60, 110, 255)
        d.rectangle((x * 2, top * 2, (x + w) * 2, H * 2), fill=body, outline=OUTLINE, width=4)
        d.polygon([((x - 8) * 2, top * 2), ((x + w / 2) * 2, (top - 40) * 2), ((x + w + 8) * 2, top * 2)], fill=roof, outline=OUTLINE, width=4)
        cx = x + w * 0.75; d.rectangle(((cx - 6) * 2, (top - 30) * 2, (cx + 6) * 2, (top - 8) * 2), fill=roof, outline=OUTLINE, width=3)  # 煙囪
        for row in range(2 if h > 115 else 1):
            for col in range(2):
                wx = x + 14 + col * (w - 46); wy = top + 18 + row * 46
                d.rectangle((wx * 2, wy * 2, (wx + 18) * 2, (wy + 22) * 2), fill=(30, 24, 50, 255), outline=OUTLINE, width=3)
                if wx + 18 <= W: wins.append({"x": wx, "y": wy, "w": 18, "h": 22})
        x += w + rnd.randint(8, 20)
    return im.resize((W, H), Image.LANCZOS), wins

im, wins = town()
save(im, "story", "town-houses.png")
with open(A("story", "town-houses-windows.json"), "w", encoding="utf-8") as f:
    json.dump({"note": "窗戶位置（以 town-houses.png 左上角為原點，px）；窗戶畫成深色，程式在上面疊燈光", "windows": wins}, f, ensure_ascii=False, indent=1)
print("ok", len(wins))
