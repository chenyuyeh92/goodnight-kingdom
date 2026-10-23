"""新武器與故事畫面（AI 生成＋程式合成的部分）。程式畫的子彈、剪影、房子在 make_story.py（要先跑）。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_story.py <ComfyUI output 資料夾> <專案根目錄>
來源圖（ComfyUI 輸出的 gk19）只在美術的電腦上，沒有放進 repo。
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter
from artlib import cutout, fit, keep_largest, save, OUTLINE

OUT, ROOT = sys.argv[1], sys.argv[2]
G = lambda *p: os.path.join(OUT, "gk19", *p)
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
K = 4

def obj(src, box, rot=0, largest=True):
    im = cutout(src)
    if largest: im = keep_largest(im); im = im.crop(im.getchannel("A").getbbox())
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC); im = im.crop(im.getchannel("A").getbbox())
    return fit(im, box)

# ---- 武器（握把在左下、發射口在右）----
save(obj(G("sw", "yarn-ball_00002_.png"), (40, 36)), A("weapons", "yarn-ball.png"))
save(obj(G("sw", "marshmallow-bomb_00004_.png"), (42, 36)), A("weapons", "marshmallow-bomb.png"))
save(obj(G("sw", "hypno-watch_00002_.png"), (36, 40), rot=40), A("weapons", "hypno-watch.png"))  # 鍊子原本在上面，轉 40° 到左上（手握的地方）
save(obj(G("sw", "wishing-star_00003_.png"), (30, 44)), A("weapons", "wishing-star.png"))

# ---- 故事小圖 ----
SD = lambda n: A("story", n)
roof = Image.open(G("ss", "castle-roof_00002_.png")).convert("RGB")
save(roof.resize((400, round(roof.height * 400 / roof.width)), Image.LANCZOS).crop((0, 0, 400, 200)) if False else
     roof.crop((0, roof.height - round(roof.width / 2), roof.width, roof.height)).resize((400, 200), Image.LANCZOS), SD("castle-roof.png"))
save(obj(G("ss", "guards-back_00004_.png"), (140, 100)), SD("guards-back.png"))
save(obj(G("ss", "nm-closet_00001_.png"), (96, 96)), SD("nightmare-closet.png"))
save(obj(G("ss", "nm-lunch_00003_.png"), (96, 96), largest=False), SD("nightmare-lunch.png"))
gate = Image.open(G("ss", "nm-gate_00002_.png")).convert("RGB"); g0 = gate.getbbox()
save(gate.resize((160, 160), Image.LANCZOS), SD("nightmare-gate.png"))

def canvas(w, h):
    im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

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

def lost():  # 找不到回家的路：分岔的小路＋指向不同方向的路標
    im, d = canvas(96, 96)
    d.polygon([(40 * K, 92 * K), (56 * K, 92 * K), (52 * K, 60 * K), (44 * K, 60 * K)], fill=(230, 210, 170, 255))
    d.polygon([(44 * K, 62 * K), (20 * K, 34 * K), (28 * K, 32 * K), (48 * K, 58 * K)], fill=(230, 210, 170, 255))
    d.polygon([(52 * K, 62 * K), (76 * K, 34 * K), (68 * K, 32 * K), (48 * K, 58 * K)], fill=(230, 210, 170, 255))
    d.rectangle((46 * K, 20 * K, 50 * K, 66 * K), fill=(150, 100, 60, 255), outline=OUTLINE, width=K)
    for y, s in ((22, -1), (34, 1), (46, -1)):  # 三個方向的空白牌子
        x0 = 48 if s > 0 else 20; x1 = 76 if s > 0 else 48
        tip = x1 + 6 if s > 0 else x0 - 6
        d.polygon([(x0 * K, y * K), (x1 * K, y * K), (tip * K, (y + 4) * K), (x1 * K, (y + 8) * K), (x0 * K, (y + 8) * K)] if s > 0 else
                  [(x1 * K, y * K), (x0 * K, y * K), (tip * K, (y + 4) * K), (x0 * K, (y + 8) * K), (x1 * K, (y + 8) * K)],
                  fill=(200, 150, 100, 255), outline=OUTLINE, width=K)
    d.text((70 * K, 70 * K), "", fill=OUTLINE)
    return im.resize((96, 96), Image.LANCZOS)

save(exam(), SD("nightmare-exam.png")); save(cup(), SD("nightmare-cup.png")); save(lost(), SD("nightmare-lost.png"))

# ---- 整幕插圖 960×540 ----
def scene(src):
    im = Image.open(src).convert("RGB"); return im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS).crop((0, 0, 960, 540))

def bubble(content, r):
    """圓形泡泡：半透明、亮邊、裡面放惡夢小圖。"""
    S = r * 2; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((0, 0, S - 1, S - 1), fill=(220, 210, 255, 70), outline=(240, 235, 255, 230), width=max(2, r // 14))
    c = content.copy(); c.thumbnail((int(S * 0.62), int(S * 0.62)))
    im.alpha_composite(c, ((S - c.width) // 2, (S - c.height) // 2))
    d.ellipse((S * 0.22, S * 0.16, S * 0.36, S * 0.28), fill=(255, 255, 255, 200))
    return im

# 開場第 3 幕：城堡屋頂＋夢貘剪影＋各家屋頂飄來的黑霧
op3 = scene(G("ss", "castle-roof_00002_.png")).convert("RGBA")
sil = Image.open(A("story", "tapir-silhouette.png")); sil = sil.resize((round(sil.width * 1.1), round(sil.height * 1.1)), Image.LANCZOS)
op3.alpha_composite(sil, (480 - sil.width // 2, 330 - sil.height))
mist = Image.new("RGBA", op3.size, (0, 0, 0, 0)); md = ImageDraw.Draw(mist); rnd = random.Random(3)
for sx in (60, 200, 760, 900):
    pts = [(sx + (480 - sx) * t / 20 + 14 * math.sin(t * 0.9 + sx), 520 - (520 - 260) * t / 20) for t in range(21)]
    md.line(pts, fill=(30, 20, 50, 150), width=10, joint="curve")
op3.alpha_composite(mist.filter(ImageFilter.GaussianBlur(4)))
save(op3.convert("RGB"), SD("opening-3.png"))

# 結局第 3 幕：月光王座前飄著五顆惡夢泡泡
e3 = scene(G("ss", "ending-10_00003_.png")).convert("RGBA")
for name, (x, y, r) in zip(("exam", "cup", "closet", "lost", "lunch"), ((150, 160, 78), (330, 90, 70), (520, 170, 86), (700, 100, 70), (840, 230, 72))):
    e3.alpha_composite(bubble(Image.open(SD(f"nightmare-{name}.png")), r), (x - r, y - r))
save(e3.convert("RGB"), SD("ending-3.png"))

# 結局第 9 幕：夜空下的城堡，泡泡往上飄、越高越變成星星
e9 = scene(G("ss", "ending-9_00002_.png")).convert("RGBA"); d = ImageDraw.Draw(e9); rnd = random.Random(9)
for i in range(22):
    x = rnd.randint(60, 900); y = rnd.randint(40, 380); t = y / 380  # 越低越像泡泡、越高越像星星
    if t > 0.55:
        r = rnd.randint(10, 18); d.ellipse((x - r, y - r, x + r, y + r), fill=(220, 210, 255, 60), outline=(240, 235, 255, 200), width=2)
    else:
        r = rnd.randint(6, 12)
        pts = [(x + (r if j % 2 == 0 else r * .45) * math.cos(math.radians(-90 + j * 36)), y + (r if j % 2 == 0 else r * .45) * math.sin(math.radians(-90 + j * 36))) for j in range(10)]
        d.polygon(pts, fill=(250, 230, 140, 255), outline=OUTLINE)
save(e9.convert("RGB"), SD("ending-9.png"))

# 結局第 10 幕：夢貘睡在王座上
save(scene(G("ss", "ending-10_00002_.png")), SD("ending-10.png"))
print("ok")
