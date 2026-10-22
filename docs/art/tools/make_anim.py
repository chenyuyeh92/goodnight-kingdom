"""第一關角色的動畫格：用現有單張圖做變形（彈跳、壓扁拉長、傾斜、翅膀旋轉），長相和原圖完全一致。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/make_anim.py <專案根目錄>
規則：每一格的畫布大小 = 原圖大小，朝向和原圖相同，內容底部對齊畫布底部（腳底在同一條線）。
"""
import os, sys
from PIL import Image

ROOT = sys.argv[1]
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)

def frame(src, sx=1.0, sy=1.0, rot=0.0, lift=0, dx=0):
    """在和原圖同大小的畫布上：以底部中央為基準縮放（sx、sy）、旋轉（度，正值逆時針）、往上抬 lift px、水平移 dx px。
    變形後如果超出畫布，整體等比縮小到放得下，底部仍貼齊畫布底部（減掉 lift）。"""
    W, H = src.size
    im = src.resize((max(1, round(W * sx)), max(1, round(H * sy))), Image.LANCZOS)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    im = im.crop(im.getchannel("A").getbbox())
    k = min(1.0, W / im.width, (H - lift) / im.height)
    if k < 1:
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - im.width) // 2 + dx
    out.alpha_composite(im, (max(0, min(W - im.width, x)), H - lift - im.height))
    return out

def flap(src, angle, wing=0.30, pivot_y=0.42, band=(0.40, 0.90)):
    """翅膀拍動：把左右外側（各 wing 比例寬）、高度在 band 範圍內的部分當成翅膀（不含頭、耳朵、帽子），
    以靠身體那邊、pivot_y 高度為支點旋轉；正 angle = 翅膀往上。"""
    W, H = src.size; ww = round(W * wing); py = round(H * pivot_y); y0, y1 = round(H * band[0]), round(H * band[1])
    body = src.copy(); body.paste((0, 0, 0, 0), (0, y0, ww, y1)); body.paste((0, 0, 0, 0), (W - ww, y0, W, y1))
    left = Image.new("RGBA", (ww, H), (0, 0, 0, 0)); left.paste(src.crop((0, y0, ww, y1)), (0, y0))
    right = Image.new("RGBA", (ww, H), (0, 0, 0, 0)); right.paste(src.crop((W - ww, y0, W, y1)), (0, y0))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # 左翅以右緣中點 (ww, py) 為支點；右翅以左緣 (0, py) 為支點。往上 = 左翅順時針、右翅逆時針
    lw = Image.new("RGBA", (W, H), (0, 0, 0, 0)); lw.alpha_composite(left, (0, 0))
    out.alpha_composite(lw.rotate(-angle, resample=Image.BICUBIC, center=(ww, py)))
    rw = Image.new("RGBA", (W, H), (0, 0, 0, 0)); rw.alpha_composite(right, (W - ww, 0))
    out.alpha_composite(rw.rotate(angle, resample=Image.BICUBIC, center=(W - ww, py)))
    out.alpha_composite(body)
    return out

def walk4(src, tilt=4, bob=2):
    """走路 4 格：落地壓扁 → 抬起傾斜 → 落地壓扁 → 抬起反向傾斜。"""
    return [frame(src, 1.04, 0.96),
            frame(src, 0.98, 1.02, rot=tilt, lift=bob),
            frame(src, 1.04, 0.96),
            frame(src, 0.98, 1.02, rot=-tilt, lift=bob)]

def save(frames, name):
    for i, f in enumerate(frames, 1):
        f.save(A("enemies", f"{name}-{i}.png") if len(frames) > 1 else A("enemies", f"{name}.png"), optimize=True)

def load(*p):
    return Image.open(A(*p)).convert("RGBA")

# 小綿羊守衛（玩家預設角色，放在 characters/）
guard = load("characters", "default-guard.png")
for i, f in enumerate(walk4(guard, tilt=5, bob=3), 1):
    f.save(A("characters", f"default-guard-walk-{i}.png"), optimize=True)
frame(guard, 0.9, 1.1, lift=6).save(A("characters", "default-guard-jump.png"), optimize=True)

# 鬧鐘蟲：走路 4 格（蟲子扭動，用水平伸縮代替傾斜）
bug = load("enemies", "clockbug.png")
save([frame(bug, 1.06, 0.95), frame(bug, 0.96, 1.03, lift=1), frame(bug, 1.06, 0.95, dx=-1), frame(bug, 0.96, 1.03, lift=1, dx=-1)], "clockbug-walk")

# 咖啡豆精靈：跳起（拉長、離地）、落地（壓扁）
bean = load("enemies", "coffee-bean-sprite.png")
save([frame(bean, 0.88, 1.12, lift=8)], "coffee-bean-sprite-jump")
save([frame(bean, 1.15, 0.85)], "coffee-bean-sprite-land")

# 熬夜蝙蝠：拍翅 4 格（上、平、下、平），上拍時身體微微抬高
bat = load("enemies", "night-bat.png")
B = dict(wing=0.30, pivot_y=0.55, band=(0.45, 0.85))  # 蝙蝠翅膀在身體兩側中段
save([frame(flap(bat, 22, **B), lift=2), bat.copy(), flap(bat, -18, **B), bat.copy()], "night-bat-flap")

# 失眠刺蝟：走路 4 格（刺盾在前，傾斜小一點）；縮成球 1 格（滾球圖放進同樣大小的畫布、底部貼齊）
hog = load("enemies", "insomnia-hedgehog.png")
save(walk4(hog, tilt=3, bob=2), "insomnia-hedgehog-walk")
ball = load("enemies", "insomnia-hedgehog-roll.png")
canvas = Image.new("RGBA", hog.size, (0, 0, 0, 0)); canvas.alpha_composite(ball, ((hog.width - ball.width) // 2, hog.height - ball.height))
save([canvas], "insomnia-hedgehog-ball")

O = dict(wing=0.24, pivot_y=0.55, band=(0.48, 0.92))  # 貓頭鷹翅膀在身體兩側下半，避開睡帽和毛球
# 熬夜貓頭鷹：三個階段各一套拍翅 4 格（上、平、下、平），翅膀在身體兩側、範圍窄一點；俯衝 1 格（往左下傾斜）
for src_name, out_name in [("night-owl-boss.png", "night-owl-boss-flap"), ("night-owl-boss-phase2.png", "night-owl-boss-phase2-flap"), ("night-owl-boss-phase3.png", "night-owl-boss-phase3-flap")]:
    owl = load("enemies", src_name)
    save([frame(flap(owl, 12, **O), lift=4), owl.copy(), flap(owl, -10, **O), owl.copy()], out_name)
owl = load("enemies", "night-owl-boss.png")
save([frame(owl, 1.0, 0.95, rot=22)], "night-owl-boss-dive")  # 正角度逆時針＝頭往左下（魔物朝左）
print("ok")
