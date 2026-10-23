"""新武器與故事畫面（AI 生成＋程式畫／合成的部分）。程式畫的子彈、剪影、房子在 make_story.py（要先跑）。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_story.py <ComfyUI output 資料夾> <專案根目錄>
來源圖（ComfyUI 輸出的 gk19）只在美術的電腦上，沒有放進 repo。
整幕插圖一律用遊戲裡現有的背景與角色合成（世界 10 王座背景、夢貘、守衛背影），角色才會和遊戲裡一致。
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter
from artlib import cutout, fit, keep_largest, save, OUTLINE

OUT, ROOT = sys.argv[1], sys.argv[2]
G = lambda *p: os.path.join(OUT, "gk19", *p)
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
SD = lambda n: A("story", n)
K = 4

def obj(src, box, rot=0, largest=True):
    im = cutout(src)
    if largest: im = keep_largest(im); im = im.crop(im.getchannel("A").getbbox())
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC); im = im.crop(im.getchannel("A").getbbox())
    return fit(im, box)

def canvas(w, h):
    im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

def line2(d, pts, col, w):  # 先畫深紫外框再畫顏色
    d.line(pts, fill=OUTLINE, width=(w + 3) * K, joint="curve"); d.line(pts, fill=col, width=w * K, joint="curve")

# ---- 武器（握把在左下、發射口在右）----
def yarn_launcher():  # 彈彈毛線球：Y 字彈弓，握把在左下，皮筋上夾著毛線球、朝右
    im, d = canvas(40, 36)
    wood = (200, 150, 100, 255)
    line2(d, [(6 * K, 34 * K), (16 * K, 20 * K)], wood, 4)
    line2(d, [(16 * K, 20 * K), (13 * K, 7 * K)], wood, 3); line2(d, [(16 * K, 20 * K), (28 * K, 15 * K)], wood, 3)
    d.line((13 * K, 7 * K, 30 * K, 10 * K), fill=(250, 180, 205, 255), width=2 * K); d.line((28 * K, 15 * K, 30 * K, 10 * K), fill=(250, 180, 205, 255), width=2 * K)
    d.ellipse((26 * K, 3 * K, 38 * K, 15 * K), fill=(170, 210, 250, 255), outline=OUTLINE, width=2 * K)
    d.arc((28 * K, 5 * K, 36 * K, 13 * K), 200, 340, fill=(250, 180, 205, 255), width=K)
    return im.resize((40, 36), Image.LANCZOS)

def marshmallow_bundle():  # 晚安棉花糖炸彈：一串棉花糖綁緞帶（左下握），右上一條小引信冒火花；不像真的炸彈
    im, d = canvas(42, 36)
    for x, y, c in ((8, 16, (255, 250, 245)), (18, 10, (255, 225, 235)), (26, 18, (255, 250, 245)), (15, 22, (255, 225, 235))):
        d.rounded_rectangle((x * K, y * K, (x + 12) * K, (y + 10) * K), radius=4 * K, fill=c + (255,), outline=OUTLINE, width=2 * K)
    line2(d, [(4 * K, 34 * K), (14 * K, 28 * K)], (190, 160, 230, 255), 2)
    d.polygon([(12 * K, 27 * K), (6 * K, 23 * K), (15 * K, 23 * K)], fill=(190, 160, 230, 255), outline=OUTLINE)
    d.line((36 * K, 19 * K, 39 * K, 9 * K), fill=OUTLINE, width=2 * K)
    for dx, dy in ((0, 0), (-2, -2), (2, -1), (0, -3)):
        d.ellipse(((39 + dx - 1) * K, (7 + dy - 1) * K, (39 + dx + 1) * K, (7 + dy + 1) * K), fill=(255, 220, 120, 255))
    return im.resize((42, 36), Image.LANCZOS)

save(yarn_launcher(), A("weapons", "yarn-ball.png"))
save(marshmallow_bundle(), A("weapons", "marshmallow-bomb.png"))
save(obj(G("sw", "hypno-watch_00002_.png"), (36, 40), rot=40), A("weapons", "hypno-watch.png"))  # 鍊子原本在上面，轉 40° 到左上（手握的地方）
save(obj(G("sw", "wishing-star_00003_.png"), (30, 44)), A("weapons", "wishing-star.png"))

# ---- 故事小圖 ----
def castle_roof():  # 月亮城堡屋頂一角：斜屋頂＋圓塔，透明背景（月亮由插圖或程式加）
    W, H = 400, 200; im = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.polygon([(0, 400), (0, 230), (520, 130), (800, 170), (800, 400)], fill=(70, 60, 120, 255), outline=OUTLINE, width=6)
    for i in range(1, 9):  # 屋瓦
        d.line((0, 230 + i * 22, 800, 170 + i * 28), fill=(90, 78, 140, 255), width=3)
    d.rectangle((600, 50, 700, 400), fill=(130, 120, 180, 255), outline=OUTLINE, width=6)
    d.polygon([(585, 54), (650, 0), (715, 54)], fill=(90, 70, 140, 255), outline=OUTLINE)
    d.rectangle((636, 120, 664, 170), fill=(248, 224, 142, 255), outline=OUTLINE, width=4)
    return im.resize((W, H), Image.LANCZOS)

def exam():  # 考卷：紅色叉叉、圈起來的分數（不寫字，用線條表示）
    im, d = canvas(96, 96)
    d.polygon([(18 * K, 8 * K), (78 * K, 12 * K), (74 * K, 90 * K), (14 * K, 86 * K)], fill=(255, 252, 240, 255), outline=OUTLINE, width=2 * K)
    for i in range(5):
        y = 30 + i * 11; d.line((24 * K, y * K, 62 * K, (y + 1) * K), fill=(170, 160, 190, 255), width=2 * K)
        if i in (1, 3):
            d.line((64 * K, (y - 4) * K, 72 * K, (y + 4) * K), fill=(220, 60, 70, 255), width=3 * K); d.line((72 * K, (y - 4) * K, 64 * K, (y + 4) * K), fill=(220, 60, 70, 255), width=3 * K)
    d.ellipse((52 * K, 10 * K, 74 * K, 26 * K), outline=(220, 60, 70, 255), width=3 * K)
    d.line((58 * K, 14 * K, 58 * K, 22 * K), fill=(220, 60, 70, 255), width=2 * K)
    return im.resize((96, 96), Image.LANCZOS)

def cup():  # 打破的杯子：杯身裂成兩半、碎片、灑出來的牛奶
    im, d = canvas(96, 96)
    d.ellipse((10 * K, 72 * K, 90 * K, 90 * K), fill=(250, 248, 240, 220))
    d.polygon([(22 * K, 40 * K), (44 * K, 34 * K), (40 * K, 52 * K), (48 * K, 58 * K), (40 * K, 80 * K), (24 * K, 80 * K)], fill=(240, 200, 220, 255), outline=OUTLINE, width=2 * K)
    d.polygon([(54 * K, 36 * K), (76 * K, 40 * K), (74 * K, 80 * K), (54 * K, 80 * K), (60 * K, 62 * K), (52 * K, 54 * K)], fill=(240, 200, 220, 255), outline=OUTLINE, width=2 * K)
    d.arc((72 * K, 48 * K, 90 * K, 68 * K), -80, 80, fill=OUTLINE, width=3 * K)
    for x, y in ((14, 64), (84, 82), (50, 86)):
        d.polygon([(x * K, y * K), ((x + 5) * K, (y - 3) * K), ((x + 4) * K, (y + 3) * K)], fill=(240, 200, 220, 255), outline=OUTLINE, width=K)
    return im.resize((96, 96), Image.LANCZOS)

def lost():  # 找不到回家的路：分岔的小路＋指向不同方向的空白路標
    im, d = canvas(96, 96)
    d.polygon([(40 * K, 92 * K), (56 * K, 92 * K), (52 * K, 60 * K), (44 * K, 60 * K)], fill=(230, 210, 170, 255))
    d.polygon([(44 * K, 62 * K), (20 * K, 34 * K), (28 * K, 32 * K), (48 * K, 58 * K)], fill=(230, 210, 170, 255))
    d.polygon([(52 * K, 62 * K), (76 * K, 34 * K), (68 * K, 32 * K), (48 * K, 58 * K)], fill=(230, 210, 170, 255))
    d.rectangle((46 * K, 20 * K, 50 * K, 66 * K), fill=(150, 100, 60, 255), outline=OUTLINE, width=K)
    for y, s in ((22, -1), (34, 1), (46, -1)):
        x0 = 48 if s > 0 else 20; x1 = 76 if s > 0 else 48
        tip = x1 + 6 if s > 0 else x0 - 6
        d.polygon([(x0 * K, y * K), (x1 * K, y * K), (tip * K, (y + 4) * K), (x1 * K, (y + 8) * K), (x0 * K, (y + 8) * K)] if s > 0 else
                  [(x1 * K, y * K), (x0 * K, y * K), (tip * K, (y + 4) * K), (x0 * K, (y + 8) * K), (x1 * K, (y + 8) * K)],
                  fill=(200, 150, 100, 255), outline=OUTLINE, width=K)
    return im.resize((96, 96), Image.LANCZOS)

def closet():  # 黑黑的衣櫥，門開一條縫透出一點暖光（不可怕）
    im, d = canvas(96, 96)
    d.rounded_rectangle((20 * K, 8 * K, 76 * K, 88 * K), radius=4 * K, fill=(50, 40, 70, 255), outline=OUTLINE, width=2 * K)
    d.rectangle((47 * K, 12 * K, 50 * K, 84 * K), fill=(250, 220, 150, 255))
    d.ellipse((40 * K, 44 * K, 44 * K, 48 * K), fill=(200, 170, 110, 255)); d.ellipse((53 * K, 44 * K, 57 * K, 48 * K), fill=(200, 170, 110, 255))
    d.rectangle((24 * K, 88 * K, 30 * K, 92 * K), fill=OUTLINE); d.rectangle((66 * K, 88 * K, 72 * K, 92 * K), fill=OUTLINE)
    return im.resize((96, 96), Image.LANCZOS)

def lunch():  # 忘記帶的便當：空空的桌子上一個大問號
    im, d = canvas(96, 96)
    d.rectangle((10 * K, 58 * K, 86 * K, 66 * K), fill=(200, 150, 100, 255), outline=OUTLINE, width=2 * K)
    for x in (16, 76): d.rectangle((x * K, 66 * K, (x + 5) * K, 90 * K), fill=(170, 120, 80, 255), outline=OUTLINE, width=K)
    d.arc((36 * K, 12 * K, 60 * K, 36 * K), 180, 450, fill=OUTLINE, width=6 * K); d.arc((36 * K, 12 * K, 60 * K, 36 * K), 180, 450, fill=(190, 160, 230, 255), width=3 * K)
    line2(d, [(48 * K, 36 * K), (48 * K, 42 * K)], (190, 160, 230, 255), 3)
    d.ellipse((45 * K, 47 * K, 51 * K, 53 * K), fill=(190, 160, 230, 255), outline=OUTLINE, width=K)
    return im.resize((96, 96), Image.LANCZOS)

save(castle_roof(), SD("castle-roof.png"))
save(obj(G("ss", "guards-back_00004_.png"), (140, 100)), SD("guards-back.png"))
gate = Image.open(G("ss", "nm-gate_00002_.png")).convert("RGB")
save(gate.resize((160, 160), Image.LANCZOS), SD("nightmare-gate.png"))
for name, fn in (("exam", exam), ("cup", cup), ("lost", lost), ("closet", closet), ("lunch", lunch)):
    save(fn(), SD(f"nightmare-{name}.png"))

# ---- 整幕插圖 960×540（用遊戲裡的背景與角色合成）----
THRONE = Image.open(A("backgrounds", "w10-s4-far.png")).convert("RGBA").crop((240, 0, 1200, 540))  # 月光王座在畫面正中
TAPIR_SLEEP = Image.open(A("enemies", "w10-dream-tapir-boss-sleep.png")).convert("RGBA")
GUARDS = Image.open(SD("guards-back.png")).convert("RGBA")

def put(base, im, cx, bottom, scale=1.0):
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    base.alpha_composite(im, (round(cx - im.width / 2), bottom - im.height))

def bubble(content, r):
    """圓形泡泡：半透明、亮邊、裡面放惡夢小圖。"""
    S = r * 2; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((0, 0, S - 1, S - 1), fill=(220, 210, 255, 70), outline=(240, 235, 255, 230), width=max(2, r // 14))
    c = content.copy(); c.thumbnail((int(S * 0.62), int(S * 0.62)))
    im.alpha_composite(c, ((S - c.width) // 2, (S - c.height) // 2))
    d.ellipse((S * 0.22, S * 0.16, S * 0.36, S * 0.28), fill=(255, 255, 255, 200))
    return im

def star(d, x, y, r):
    pts = [(x + (r if j % 2 == 0 else r * .45) * math.cos(math.radians(-90 + j * 36)), y + (r if j % 2 == 0 else r * .45) * math.sin(math.radians(-90 + j * 36))) for j in range(10)]
    d.polygon(pts, fill=(250, 230, 140, 255), outline=OUTLINE)

# 開場第 3 幕：夜空大月亮、城堡屋頂一角，夢貘剪影坐在屋頂上；城下房子的煙囪飄出細細黑霧飄向牠
op3 = Image.open(A("backgrounds", "w10-s4-far.png")).convert("RGBA").crop((0, 0, 960, 540))
roof = Image.open(SD("castle-roof.png")).convert("RGBA").resize((800, 400), Image.LANCZOS)
op3.alpha_composite(roof, (200, 160))
sil = Image.open(SD("tapir-silhouette.png")).convert("RGBA")
put(op3, sil, 470, 352, 0.9)  # 腳踩在屋頂斜面上（x 470 處屋面約 y 352）
town = Image.open(SD("town-houses.png")).convert("RGBA")
dark = Image.new("RGBA", town.size, (24, 18, 44, 255)); dark.putalpha(town.getchannel("A"))
op3.alpha_composite(dark, (0, 330))
mist = Image.new("RGBA", op3.size, (0, 0, 0, 0)); md = ImageDraw.Draw(mist)
for sx in (90, 260, 420, 610, 820):
    pts = [(sx + (470 - sx) * t / 20 + 10 * math.sin(t * 0.9 + sx), 370 - (370 - 300) * t / 20 - 50 * math.sin(math.pi * t / 20)) for t in range(21)]
    md.line(pts, fill=(30, 20, 50, 170), width=7, joint="curve")
op3.alpha_composite(mist.filter(ImageFilter.GaussianBlur(3)))
save(op3.convert("RGB"), SD("opening-3.png"))

# 結局第 3 幕：月光王座前，睡著的夢貘身邊飄出五顆惡夢泡泡
e3 = THRONE.copy(); put(e3, TAPIR_SLEEP, 480, 500)
for name, (x, y, r) in zip(("exam", "cup", "closet", "lost", "lunch"), ((170, 170, 70), (320, 90, 62), (520, 110, 74), (690, 160, 62), (830, 250, 66))):
    e3.alpha_composite(bubble(Image.open(SD(f"nightmare-{name}.png")), r), (x - r, y - r))
save(e3.convert("RGB"), SD("ending-3.png"))

# 結局第 9 幕：泡泡往上飄、越高越變成星星
e9 = THRONE.copy(); put(e9, TAPIR_SLEEP, 480, 500); d = ImageDraw.Draw(e9); rnd = random.Random(9)
for i in range(26):
    x = rnd.randint(60, 900); y = rnd.randint(30, 300)
    if y / 300 > 0.55:
        r = rnd.randint(10, 18); d.ellipse((x - r, y - r, x + r, y + r), fill=(220, 210, 255, 70), outline=(240, 235, 255, 220), width=2)
    else:
        star(d, x, y, rnd.randint(7, 13))
save(e9.convert("RGB"), SD("ending-9.png"))

# 結局第 10 幕：夢貘睡在王座前，兩位守衛（小綿羊背影）坐在旁邊
e10 = THRONE.copy(); put(e10, TAPIR_SLEEP, 470, 505, 1.15); put(e10, GUARDS, 700, 512)
save(e10.convert("RGB"), SD("ending-10.png"))
print("ok")
