"""第一關角色的動畫格：用現有單張圖做變形，長相和原圖完全一致。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/make_anim.py <專案根目錄>
規則：
- 每一格的畫布大小 = 原圖大小，朝向相同，內容底部貼齊原圖的腳底（同一條線）。
- 原圖已經塞滿畫布，所以只用「不會超出畫布」的變形：變瘦（sx<1）、變矮（sy<1）、身體前後傾（以腳底為軸的斜切，會自動變瘦一點補回寬度）。
  不做整體縮小，角色大小不會一格大一格小。
- 拍翅用網格彎曲（只彎翅膀那一帶，越外側彎越多），不切開，不會留下破洞；頭、耳朵、帽子、地上的東西不動。
"""
import math, os, sys
from PIL import Image

ROOT = sys.argv[1]
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)

def content_box(im):
    return im.getchannel("A").getbbox()

def frame(src, sx=1.0, sy=1.0, shear=0.0):
    """以腳底中央為基準：sx、sy 只能 ≤1；shear>0 上半身往右斜、<0 往左斜。結果不超出原畫布，底部對齊原圖腳底。"""
    W, H = src.size; x0, y0, x1, y1 = content_box(src)
    cw, ch = x1 - x0, y1 - y0; c = src.crop((x0, y0, x1, y1))
    sy = min(sy, 1.0); nh = max(1, round(ch * sy))
    room = W - abs(shear) * nh                 # 斜切會多出 |shear|×高 的寬度，從 sx 扣回來
    sx = min(sx, room / cw, 1.0); nw = max(1, round(cw * sx))
    c = c.resize((nw, nh), Image.LANCZOS)
    if shear:
        extra = round(abs(shear) * nh); out_w = nw + extra
        # 仿射：輸入 x = 輸出 x + shear×y + c；c 讓底部（腳底）不動、上半身往斜的方向移
        c = c.transform((out_w, nh), Image.AFFINE, (1, shear, -shear * nh if shear > 0 else 0, 0, 1, 0), resample=Image.BICUBIC)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx = (x0 + x1) / 2
    out.alpha_composite(c, (max(0, min(W - c.width, round(cx - c.width / 2))), y1 - c.height))
    return out

def flap(src, amp, band=(0.40, 0.85), inner=0.28, cells=24):
    """網格彎曲拍翅：amp>0 翅膀往上、<0 往下（px）。位移量 = amp × 外側程度² × 高度權重（band 內為 1，邊緣平滑變 0）。"""
    W, H = src.size; cx = W / 2; b0, b1 = H * band[0], H * band[1]; feather = H * 0.08
    def off(x, y):
        s = max(0.0, (abs(x - cx) / (W / 2) - inner) / (1 - inner)) ** 2
        if y < b0 - feather or y > b1 + feather: w = 0.0
        elif y < b0: w = (y - (b0 - feather)) / feather
        elif y > b1: w = ((b1 + feather) - y) / feather
        else: w = 1.0
        return amp * s * w
    mesh = []
    xs = [W * i / cells for i in range(cells + 1)]; ys = [H * j / cells for j in range(cells + 1)]
    for i in range(cells):
        for j in range(cells):
            xa, xb, ya, yb = xs[i], xs[i + 1], ys[j], ys[j + 1]
            box = (round(xa), round(ya), round(xb), round(yb))
            # 輸出格子的四個角 → 輸入的四個角（輸出位置往上移 d，等於從下方 d 取樣）
            quad = (xa, ya + off(xa, ya), xa, yb + off(xa, yb), xb, yb + off(xb, yb), xb, ya + off(xb, ya))
            mesh.append((box, quad))
    return src.transform((W, H), Image.MESH, mesh, resample=Image.BICUBIC)

def save_frames(frames, folder, name):
    for i, f in enumerate(frames, 1):
        f.save(A(folder, f"{name}-{i}.png" if len(frames) > 1 else f"{name}.png"), optimize=True)

def load(*p):
    return Image.open(A(*p)).convert("RGBA")

def walk4(src, lean=0.06, squash=0.95, thin=0.95):
    """走路 4 格：踩地（變矮）→ 往前傾 → 踩地 → 往後傾。腳底都在同一條線，不往上抬（上下晃動交給程式）。"""
    return [frame(src, sy=squash), frame(src, sx=thin, shear=-lean), frame(src, sy=squash), frame(src, sx=thin, shear=lean)]

# 小綿羊守衛（朝右：往前傾＝往右）
guard = load("characters", "default-guard.png")
save_frames(walk4(guard, lean=-0.06), "characters", "default-guard-walk")
save_frames([frame(guard, sx=0.88)], "characters", "default-guard-jump")  # 跳躍：身體收瘦，離地高度由程式控制

# 鬧鐘蟲（朝左）：蠕動，伸長和縮起交替
bug = load("enemies", "clockbug.png")
save_frames([frame(bug, sy=0.90), frame(bug, sx=0.92, shear=-0.05), frame(bug, sy=0.94, sx=0.96), frame(bug, sx=0.92, shear=0.03)], "enemies", "clockbug-walk")

# 咖啡豆精靈：跳起（變瘦）、落地（變矮）
bean = load("enemies", "coffee-bean-sprite.png")
save_frames([frame(bean, sx=0.85)], "enemies", "coffee-bean-sprite-jump")
save_frames([frame(bean, sy=0.85)], "enemies", "coffee-bean-sprite-land")

# 熬夜蝙蝠：拍翅 4 格（上、平、下、平）；翅膀在身體兩側中段，不含耳朵和拿杯子的手
bat = load("enemies", "night-bat.png")
BAT = dict(band=(0.48, 0.80), inner=0.34)
save_frames([flap(bat, 9, **BAT), bat.copy(), flap(bat, -7, **BAT), bat.copy()], "enemies", "night-bat-flap")

# 失眠刺蝟（朝左：往前傾＝往左）：走路 4 格；縮成球（滾球圖放進同樣大小的畫布，底部貼齊原圖腳底）
hog = load("enemies", "insomnia-hedgehog.png")
save_frames(walk4(hog, lean=0.04), "enemies", "insomnia-hedgehog-walk")
ball = load("enemies", "insomnia-hedgehog-roll.png"); ball = ball.crop(content_box(ball))
canvas = Image.new("RGBA", hog.size, (0, 0, 0, 0)); foot = content_box(hog)[3]
canvas.alpha_composite(ball, ((hog.width - ball.width) // 2, foot - ball.height))
save_frames([canvas], "enemies", "insomnia-hedgehog-ball")

# 熬夜貓頭鷹：三個階段各一套拍翅 4 格；翅膀在身體兩側中下段，避開睡帽、毛球和地上的羽毛、杯子
OWL = dict(band=(0.45, 0.82), inner=0.30)
for src_name, out_name in [("night-owl-boss.png", "night-owl-boss-flap"), ("night-owl-boss-phase2.png", "night-owl-boss-phase2-flap"), ("night-owl-boss-phase3.png", "night-owl-boss-phase3-flap")]:
    owl = load("enemies", src_name)
    save_frames([flap(owl, 10, **OWL), owl.copy(), flap(owl, -8, **OWL), owl.copy()], "enemies", out_name)
# 俯衝：上半身往左下大幅前傾（斜切，不旋轉，地面和腳底不歪）
owl = load("enemies", "night-owl-boss.png")
save_frames([frame(owl, sy=0.92, shear=0.22)], "enemies", "night-owl-boss-dive")
print("ok")
