"""世界 2–10 的小怪、中階怪與全部 Boss（含第一關的松鼠、河狸）的動畫格（第一關小怪另見 make_anim.py）。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/make_anim_all.py <專案根目錄>
規則同第一關：每格畫布 = 原圖大小、朝向相同、腳底在同一條線、不整體縮放（角色不會忽大忽小）。
動作種類（每種 4 格，檔名 <原檔名>-<動作>-1..4.png，放在原圖旁邊）：
- walk 走路：踩地（變矮）→ 往前傾 → 踩地 → 往後傾
- flap 拍翅：翅膀那一帶網格彎曲 上 → 平 → 下 → 平
- swim 游動：身體前後擺動（斜切），不變矮
- bounce 彈跳：變矮 → 原樣 → 變瘦拉高（用變瘦表現）→ 原樣
上下移動、跳躍高度請程式控制。
"""
import os, sys
from PIL import Image

ROOT = sys.argv[1]
E = os.path.join(ROOT, "public", "assets", "enemies")

def box(im):
    return im.getchannel("A").getbbox()

def frame(src, sx=1.0, sy=1.0, shear=0.0):
    """以腳底中央為基準：sx、sy ≤ 1；shear > 0 上半身往右、< 0 往左。不超出原畫布，底部對齊原圖腳底。"""
    W, H = src.size; x0, y0, x1, y1 = box(src); cw, ch = x1 - x0, y1 - y0; c = src.crop((x0, y0, x1, y1))
    nh = max(1, round(ch * min(sy, 1.0)))
    sx = min(sx, (W - abs(shear) * nh) / cw, 1.0); nw = max(1, round(cw * sx))
    c = c.resize((nw, nh), Image.LANCZOS); extra = 0
    if shear:
        extra = round(abs(shear) * nh)
        c = c.transform((nw + extra, nh), Image.AFFINE, (1, shear, -shear * nh if shear > 0 else 0, 0, 1, 0), resample=Image.BICUBIC)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0)); cx = (x0 + x1) / 2
    # 以腳底為支點：斜切後最底列的中心對齊原圖中心，腳不會左右滑
    x = round(cx - nw / 2 - (extra if shear < 0 else 0))
    out.alpha_composite(c, (max(0, min(W - c.width, x)), y1 - c.height))
    return out

def flap(src, amp, band=(0.35, 0.72), inner=0.30, cells=24, head_band=(0.55, 0.80)):
    """網格彎曲：只彎左右外側、band 高度範圍內的部分；amp > 0 往上。整數網格，彎曲量 0 時和原圖完全一樣。
    魔物朝左，頭和嘴在左邊，所以左側改用較低的 head_band，避免彎到嘴和臉。"""
    W, H = src.size; cx = W / 2; fe = H * 0.08
    def off(x, y):
        b0, b1 = (H * head_band[0], H * head_band[1]) if x < cx else (H * band[0], H * band[1])
        s = max(0.0, (abs(x - cx) / (W / 2) - inner) / (1 - inner)) ** 2
        w = 0.0 if (y < b0 - fe or y > b1 + fe) else (y - (b0 - fe)) / fe if y < b0 else ((b1 + fe) - y) / fe if y > b1 else 1.0
        return amp * s * w
    xs = [round(W * i / cells) for i in range(cells + 1)]; ys = [round(H * j / cells) for j in range(cells + 1)]
    mesh = [((xs[i], ys[j], xs[i + 1], ys[j + 1]),
             (xs[i], ys[j] + off(xs[i], ys[j]), xs[i], ys[j + 1] + off(xs[i], ys[j + 1]),
              xs[i + 1], ys[j + 1] + off(xs[i + 1], ys[j + 1]), xs[i + 1], ys[j] + off(xs[i + 1], ys[j])))
            for i in range(cells) for j in range(cells)]
    return src.transform((W, H), Image.MESH, mesh, resample=Image.BICUBIC)

def anim(src, kind):
    H = src.height
    if kind == "walk":   # 魔物朝左：先往前（左）傾
        return [frame(src, sy=0.95), frame(src, sx=0.95, shear=-0.05), frame(src, sy=0.95), frame(src, sx=0.95, shear=0.05)]
    if kind == "flap":
        a = max(4, round(H * 0.07))
        return [flap(src, a), src.copy(), flap(src, -a * 0.8), src.copy()]
    if kind == "swim":
        return [frame(src, shear=-0.05), src.copy(), frame(src, shear=0.05), src.copy()]
    if kind == "bounce":
        return [frame(src, sy=0.90), src.copy(), frame(src, sx=0.90), src.copy()]
    raise ValueError(kind)

# 每隻的動作種類（沒列在這裡的都是 walk）
KIND = {
    # 世界 2
    "w2-insomnia-vulture": "flap", "w2-mummy-cat": "bounce",
    # 世界 3
    "w3-sleepy-jellyfish": "bounce", "w3-alarm-clownfish": "swim", "w3-coffee-octopus": "bounce", "w3-puffer-fish": "swim",
    "w3-nessie-boss": "swim", "w3-boss2-electric-eel": "swim", "w3-boss1-hermit-crab": "bounce",
    # 世界 4
    "w4-noisy-puffin": "flap", "w4-boss2-narwhal": "swim", "w4-sleepy-penguin": "swim",
    # 世界 5
    "w5-noisy-volcano-bird": "flap", "w5-coffee-lava-blob": "bounce", "w5-boss2-volcano-snail": "bounce", "w5-boss1-hippo": "bounce",
    # 世界 6
    "w6-alarm-parrot": "flap", "w6-tree-frog": "bounce",
    # 世界 7
    "w7-noisy-hornbill": "flap",
    # 世界 8–10 小怪
    "w8-noisy-eagle": "flap", "w8-coffee-cloud": "bounce", "w9-noisy-moth": "flap", "w9-mushroom-sprite": "bounce", "w9-coffee-worm": "bounce",
    "w10-noisy-star": "bounce", "w10-coffee-teapot": "bounce",
    # 世界 8–10 Boss
    "w8-thunderbird-boss": "flap", "w9-boss1-firefly-queen": "bounce",  # 翅膀在背上、手提燈在旁邊，用彈跳比較不會變形 "w9-boss2-axolotl": "swim",
}

def targets():
    """世界 2–10 的醒著圖（含關主二三階段），不含睡著版、已經是動畫格的檔、第一關。"""
    for f in sorted(os.listdir(E)):
        if not f.endswith(".png") or not f.startswith(tuple(f"w{i}-" for i in range(1, 11))):
            continue
        if f.startswith("w1-") and "-boss" not in f:  # 第一關小怪另見 make_anim.py
            continue
        name = f[:-4]
        if name.endswith("-sleep") or any(f"-{k}-" in name for k in ("walk", "flap", "swim", "bounce")):
            continue
        yield name

made = 0
for name in targets():
    base = name.replace("-phase2", "").replace("-phase3", "")
    kind = KIND.get(base, "walk")
    src = Image.open(os.path.join(E, name + ".png")).convert("RGBA")
    for i, fr in enumerate(anim(src, kind), 1):
        fr.save(os.path.join(E, f"{name}-{kind}-{i}.png"), optimize=True); made += 1
print("ok", made)
