"""封面標題字、按鈕、面板（程式繪製）＋封面與主頁示意圖。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/make_ui.py <專案根目錄> [封面背景圖] [封面守衛圖]
字型：public/assets/fonts/jf-openhuninn-2.1.ttf（jf open 粉圓，SIL OFL 1.1，可商用、可內嵌）
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = sys.argv[1]
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
FONT = A("fonts", "jf-openhuninn-2.1.ttf")
OUTLINE = (58, 42, 90, 255); YELLOW = (248, 224, 142, 255); CREAM = (255, 246, 229, 255)
LAV = (190, 170, 235, 255); LAV_D = (150, 128, 210, 255); PINK = (247, 168, 196, 255); NIGHT = (43, 42, 107, 255)

def save(im, *p):
    os.makedirs(os.path.dirname(A(*p)), exist_ok=True); im.save(A(*p), optimize=True)

def glow(im, radius=10, color=(248, 224, 142), strength=0.6):
    a = im.getchannel("A").filter(ImageFilter.GaussianBlur(radius)).point(lambda v: int(v * strength))
    g = Image.new("RGBA", im.size, color + (0,)); g.putalpha(a); g.alpha_composite(im); return g

def logo():
    W, H = 1400, 520; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, 230); f2 = ImageFont.truetype(FONT, 64)
    text = "晚安王國"; tw = d.textlength(text, font=f); x = (W - tw) / 2
    d.text((x + 10, 70 + 12), text, font=f, fill=OUTLINE, stroke_width=26, stroke_fill=OUTLINE)  # 陰影
    d.text((x, 70), text, font=f, fill=YELLOW, stroke_width=22, stroke_fill=OUTLINE)
    sub = "Goodnight Kingdom"; sw = d.textlength(sub, font=f2)
    d.text(((W - sw) / 2, 360), sub, font=f2, fill=CREAM, stroke_width=10, stroke_fill=OUTLINE)
    # 右上角的小月亮：大圓減去偏移的圓得到月牙，再整圈加外框（放大 4 倍畫再縮小，邊緣才平滑）
    cx, cy, r = x + tw + 40, 70, 60; K = 4; R = r * K
    m = Image.new("L", (R * 3, R * 3), 0); md = ImageDraw.Draw(m)
    md.ellipse((R // 2, R // 2, R // 2 + 2 * R, R // 2 + 2 * R), fill=255)
    md.ellipse((R // 2 + 34 * K, R // 2 - 14 * K, R // 2 + 2 * R + 34 * K, R // 2 + 2 * R - 14 * K), fill=0)
    ring = m.filter(ImageFilter.MaxFilter(12 * K + 1))
    moon = Image.new("RGBA", m.size, OUTLINE[:3] + (0,)); moon.putalpha(ring)
    fill = Image.new("RGBA", m.size, YELLOW[:3] + (0,)); fill.putalpha(m); moon.alpha_composite(fill)
    moon = moon.resize((m.width // K, m.height // K), Image.LANCZOS)
    im.alpha_composite(moon, (int(cx - r * 1.5), int(cy - r * 1.5)))
    d = ImageDraw.Draw(im)
    fz = ImageFont.truetype(FONT, 56)
    for i, (dx, dy, s) in enumerate([(-150, 40, 40), (-110, -10, 52), (-60, -70, 64)]):
        d.text((x + dx, 70 + dy), "Z", font=ImageFont.truetype(FONT, s), fill=LAV, stroke_width=8, stroke_fill=OUTLINE)
    im = im.crop(im.getchannel("A").getbbox())
    pad = Image.new("RGBA", (im.width + 80, im.height + 80), (0, 0, 0, 0)); pad.alpha_composite(im, (40, 40))  # 留邊，光暈才不會被切成方塊
    im = glow(pad, 18)
    return im

def button(state, W=240, H=64, label=None):
    S = 4; im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fill = {"normal": LAV, "hover": (206, 190, 245, 255), "pressed": LAV_D}[state]
    dy = 6 * S if state == "pressed" else 0
    if state != "pressed":  # 底部厚度（按下去時消失）
        d.rounded_rectangle((2 * S, 8 * S, (W - 2) * S, (H - 2) * S), radius=(H // 2) * S, fill=OUTLINE)
    d.rounded_rectangle((2 * S, 2 * S + dy, (W - 2) * S, (H - 8) * S + dy), radius=(H // 2 - 4) * S, fill=fill, outline=OUTLINE, width=4 * S)
    d.rounded_rectangle((14 * S, 8 * S + dy, (W - 14) * S, 18 * S + dy), radius=5 * S, fill=tuple(min(255, c + 30) for c in fill[:3]) + (255,))  # 亮面（實色，不要半透明，否則會透出底色）
    if label:
        f = ImageFont.truetype(FONT, 30 * S); tw = d.textlength(label, font=f)
        d.text(((W * S - tw) / 2, 13 * S + dy), label, font=f, fill=CREAM, stroke_width=4 * S, stroke_fill=OUTLINE)
    return im.resize((W, H), Image.LANCZOS)

def panel(W=96, H=96):
    S = 4; im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((2 * S, 2 * S, (W - 2) * S, (H - 2) * S), radius=20 * S, fill=(255, 246, 229, 235), outline=OUTLINE, width=4 * S)
    d.rounded_rectangle((8 * S, 8 * S, (W - 8) * S, (H - 8) * S), radius=15 * S, outline=LAV, width=2 * S)
    return im.resize((W, H), Image.LANCZOS)

LABELS = [("start", "開始遊戲"), ("duo", "雙人遊戲"), ("draw", "畫你的守衛"), ("backpack", "背包"), ("settings", "設定")]
save(logo(), "ui", "logo.png")
for st in ("normal", "hover", "pressed"):
    save(button(st), "ui", f"button-{st}.png")
for key, label in LABELS:
    save(button("normal", label=label), "ui", f"button-{key}.png")
    for st in ("hover", "pressed"):
        save(button(st, label=label), "ui", f"button-{key}-{st}.png")
save(panel(), "ui", "panel.png")

# 封面與主頁示意圖（給負責人看、給程式參考排版）
if len(sys.argv) > 3:
    bg = Image.open(sys.argv[2]).convert("RGBA").resize((960, 540), Image.LANCZOS)
    guard = Image.open(sys.argv[3]).convert("RGBA")
    scene = bg.copy(); lg = Image.open(A("ui", "logo.png")); lg = lg.resize((560, round(lg.height * 560 / lg.width)), Image.LANCZOS)
    g = guard.resize((round(guard.width * 200 / guard.height), 200), Image.LANCZOS); scene.alpha_composite(g, (90, 520 - g.height))
    for i, n in enumerate(("clockbug-sleep", "coffee-bean-sprite-sleep", "night-bat-sleep")):
        e = Image.open(A("enemies", n + ".png")); e = e.resize((e.width * 2, e.height * 2), Image.LANCZOS)
        scene.alpha_composite(e, (640 + i * 90, 515 - e.height))
    z = Image.open(A("fx", "zzz.png")); z = z.resize((z.width * 2, z.height * 2), Image.LANCZOS); scene.alpha_composite(z, (700, 380))
    cover = scene.copy(); cover.alpha_composite(lg, ((960 - lg.width) // 2, 40))
    save(cover.convert("RGB"), "ui", "cover.png")
    menu = scene.copy()
    shade = Image.new("RGBA", (960, 540), NIGHT[:3] + (90,)); menu.alpha_composite(shade)
    menu.alpha_composite(lg.resize((400, round(lg.height * 400 / lg.width)), Image.LANCZOS), (280, 10))
    for i, (key, _) in enumerate(LABELS):
        b = Image.open(A("ui", f"button-{key}.png")); menu.alpha_composite(b, ((960 - b.width) // 2, 180 + i * 66))
    os.makedirs(os.path.join(ROOT, "docs", "art", "ui"), exist_ok=True)
    menu.convert("RGB").save(os.path.join(ROOT, "docs", "art", "ui", "main-menu-mockup.png"))
print("ok")
