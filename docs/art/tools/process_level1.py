"""把 ComfyUI 產生的第一關候選圖，去背、翻轉、縮成遊戲大小，輸出到 public/assets/。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_level1.py <ComfyUI output/gk1 資料夾> <專案根目錄>
注意：來源圖（ComfyUI 輸出）只在美術的電腦上，沒有放進 repo。
"""
import os, sys
from PIL import Image, ImageDraw, ImageFilter

SRC, ROOT = sys.argv[1], sys.argv[2]

# (類別, 輸出檔名, 來源檔, 是否左右翻轉, 遊戲內尺寸限制 (寬上限, 高上限))
PICKS = [
    ("enemies", "clockbug", "clockbug_00006_.png", False, (80, 56)),
    ("enemies", "coffee-bean-sprite", "coffee-bean-sprite_00005_.png", False, (56, 52)),
    ("enemies", "night-bat", "night-bat_00002_.png", False, (56, 56)),
    ("enemies", "insomnia-hedgehog", "insomnia-hedgehog_00006_.png", False, (96, 72)),
    ("enemies", "night-owl-boss", "night-owl-boss_00003_.png", False, (240, 200)),
    ("weapons", "yawn-bubble", "yawn-bubble_00006_.png", False, (44, 36)),
    ("weapons", "sheep-machine-gun", "sheep-machine-gun_00008_.png", True, (48, 36)),
    ("weapons", "pillow-cannon", "pillow-cannon_00008_.png", True, (48, 36)),
    ("weapons", "milk-spray", "milk-spray_00008_.png", True, (44, 36)),
    ("weapons", "lullaby-harp", "lullaby-harp_00006_.png", False, (40, 40)),
    ("weapons", "blanket-boomerang", "blanket-boomerang_00008_.png", False, (40, 40)),
    ("weapons", "moon-lamp", "moon-lamp_00005_.png", True, (48, 40)),
    ("items", "hot-cocoa", "hot-cocoa_00003_.png", False, (32, 32)),
    ("items", "shooting-star", "shooting-star_00002_.png", False, (32, 32)),
    ("items", "small-pillow", "small-pillow_00003_.png", False, (32, 32)),
    ("items", "milk-bottle", "milk-bottle_00001_.png", False, (32, 32)),
    ("items", "treasure-chest", "treasure-chest_00003_.png", False, (40, 40)),
    ("items", "practice-target", "practice-target_00002_.png", False, (40, 40)),
    ("characters", "default-guard", "default-guard_00002_.png", False, (48, 56)),
    ("characters", "pajama-outline", "pajama-outline_00001_.png", False, (512, 512)),
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
    size = (max(1, round(im.width * s)), max(1, round(im.height * s)))
    return im.resize(size, Image.LANCZOS)

for cat, name, src, flip, box in PICKS:
    im = cutout(os.path.join(SRC, cat, src))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    out = os.path.join(ROOT, "public", "assets", cat); os.makedirs(out, exist_ok=True)
    im = fit(im, box)
    if name == "practice-target":  # 交接規格是 40×40，置中放進 40×40 透明畫布
        canvas = Image.new("RGBA", (40, 40), (255, 255, 255, 0))
        canvas.alpha_composite(im, ((40 - im.width) // 2, 40 - im.height)); im = canvas
    im.save(os.path.join(out, name + ".png"), optimize=True)

# 背景：模型自己在地面中間加了一隻小動物，用右邊同高度的地面、邊緣羽化的橢圓補丁蓋掉，再縮成 960×540
bg = Image.open(os.path.join(SRC, "backgrounds", "insomnia-forest_00007_.png")).convert("RGB")
box = (605, 540, 765, 725)  # 小動物的位置（原圖 1344×768 座標）
w, h = box[2] - box[0], box[3] - box[1]
patch = bg.crop((box[0] + 130, box[1], box[2] + 130, box[3]))
mask = Image.new("L", (w, h), 0); ImageDraw.Draw(mask).ellipse((8, 8, w - 8, h - 8), fill=255)
bg.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(8)))
out = os.path.join(ROOT, "public", "assets", "backgrounds"); os.makedirs(out, exist_ok=True)
bg.resize((960, 540), Image.LANCZOS).save(os.path.join(out, "insomnia-forest.png"), optimize=True)
print("ok")
