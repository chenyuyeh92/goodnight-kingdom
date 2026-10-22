"""十大世界 Boss（每世界第 1、2 關小頭目＋世界關主）：醒著、睡著、關主二三階段，以及攻擊道具小圖。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_bosses.py <ComfyUI output 資料夾> <專案根目錄>
規格（遊戲組 2026-10-22）：Q 版動物、深紫外框、朝左、透明 PNG、腳底貼齊圖片底部；
小頭目高 120–160 px，關主高 160–240 px；攻擊道具寬 16–48 px。
檔名照現有慣例：Boss 放 enemies/（例如 w1-boss1-squirrel.png、w1-boss1-squirrel-sleep.png），攻擊道具放 bullets/（例如 w1-acorn.png）。
縮放以高度為準、寬度不限；同一隻的醒著、睡著、二三階段用同一個倍率（醒著那張決定），睡著趴下來會比較矮是正常的。
來源圖（ComfyUI 輸出的 gk13、gk14）只在美術的電腦上，沒有放進 repo。
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from artlib import cutout, save, OUTLINE

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G13, G14, G15 = os.path.join(OUT_DIR, "gk13"), os.path.join(OUT_DIR, "gk14"), os.path.join(OUT_DIR, "gk15")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
MINI_H, BOSS_H = 150, 220

def keep_largest(im):
    """只保留不透明像素中最大的連通塊（以 1/4 解析度計算，再放大成遮罩）。"""
    a = im.getchannel("A"); sm = a.resize((max(1, a.width // 4), max(1, a.height // 4)))
    w, h = sm.size; px = sm.load(); seen = bytearray(w * h); best = []
    for y0 in range(h):
        for x0 in range(w):
            if px[x0, y0] < 60 or seen[y0 * w + x0]: continue
            stack = [(x0, y0)]; seen[y0 * w + x0] = 1; comp = []
            while stack:
                x, y = stack.pop(); comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny] >= 60:
                        seen[ny * w + nx] = 1; stack.append((nx, ny))
            if len(comp) > len(best): best = comp
    m = Image.new("L", (w, h), 0); mp = m.load()
    for x, y in best: mp[x, y] = 255
    from PIL import ImageFilter
    m = m.filter(ImageFilter.MaxFilter(3)).resize(a.size)
    im.putalpha(Image.composite(a, Image.new("L", a.size, 0), m)); return im

def load(src, flip):
    im = cutout(src.replace("G13/", G13 + "/").replace("G14/", G14 + "/").replace("G15/", G15 + "/"))
    # 清掉很淡的雜點（地面陰影殘留），再重新裁切，讓最底列是身體
    im.putalpha(im.getchannel("A").point(lambda v: 0 if v < 60 else v))
    im = keep_largest(im)  # 只留最大的一塊：拿掉模型自己加在旁邊的小角色、花草
    im = im.crop(im.getchannel("A").getbbox())
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im

# {Boss 檔名: (目標高度, 是否翻轉, {"": 醒著來源, "-sleep": 睡著來源, "-phase2": …, "-phase3": …})}
BOSSES = {
    "w1-boss1-squirrel": (MINI_H, False, {"": "G13/b1/b1-1-squirrel_00004_.png", "-sleep": "G14/b1s/b1-1-squirrel-sleep_00002_.png"}),
    "w1-boss2-beaver": (MINI_H, False, {"": "G13/b1/b1-2-beaver_00001_.png", "-sleep": "G14/b1s/b1-2-beaver-sleep_00002_.png"}),
    "w2-boss1-camel": (MINI_H, False, {'': 'G13/b2/b2-1-camel_00005_.png', '-sleep': 'G14/b2s/b2-1-camel-sleep_00001_.png'}),
    "w2-boss2-fennec-fox": (MINI_H, False, {'': 'G13/b2/b2-2-fennec-fox_00003_.png', '-sleep': 'G14/b2s/b2-2-fennec-fox-sleep_00002_.png'}),
    "w3-boss1-hermit-crab": (MINI_H, False, {"": "G15/r3/r3-1-hermit-crab-v2_00001_.png", "-sleep": "G15/r3s/r3-1-hermit-crab-sleep_00001_.png"}),
    "w3-boss2-electric-eel": (MINI_H, False, {'': 'G13/b3/b3-2-electric-eel_00004_.png', '-sleep': 'G14/b3s/b3-2-electric-eel-sleep_00002_.png'}),
    "w4-boss1-polar-bear": (MINI_H, False, {'': 'G13/b4/b4-1-polar-bear_00004_.png', '-sleep': 'G14/b4s/b4-1-polar-bear-sleep_00002_.png'}),
    "w4-boss2-narwhal": (MINI_H, False, {'': 'G13/b4/b4-2-narwhal_00003_.png', '-sleep': 'G14/b4s/b4-2-narwhal-sleep_00002_.png'}),
    "w5-boss1-hippo": (MINI_H, False, {'': 'G13/b5/b5-1-hippo_00002_.png', '-sleep': 'G14/b5s/b5-1-hippo-sleep_00002_.png'}),
    "w5-boss2-volcano-snail": (MINI_H, False, {'': 'G13/b5/b5-2-volcano-snail_00004_.png', '-sleep': 'G14/b5s/b5-2-volcano-snail-sleep_00002_.png'}),
    "w6-boss1-sloth": (MINI_H, False, {'': 'G13/b6/b6-1-sloth_00007_.png', '-sleep': 'G14/b6s/b6-1-sloth-sleep_00001_.png'}),
    "w6-boss2-jaguar": (MINI_H, False, {'': 'G13/b6/b6-2-jaguar_00002_.png', '-sleep': 'G14/b6s/b6-2-jaguar-sleep_00002_.png'}),
    "w7-boss1-giraffe": (MINI_H, True, {'': 'G13/b7/b7-1-giraffe_00002_.png', '-sleep': 'G14/b7s/b7-1-giraffe-sleep_00002_.png'}),
    "w7-boss2-elephant": (MINI_H, False, {'': 'G13/b7/b7-2-elephant_00004_.png', '-sleep': 'G14/b7s/b7-2-elephant-sleep_00002_.png'}),
    "w8-boss1-mountain-goat": (MINI_H, False, {'': 'G13/b8/b8-1-mountain-goat_00004_.png', '-sleep': 'G14/b8s/b8-1-mountain-goat-sleep_00002_.png'}),
    "w8-boss2-panda": (MINI_H, False, {'': 'G13/b8/b8-2-panda_00004_.png', '-sleep': 'G14/b8s/b8-2-panda-sleep_00002_.png'}),
    "w9-boss1-firefly-queen": (MINI_H, False, {'': 'G13/b9/b9-1-firefly-queen_00008_.png', '-sleep': 'G14/b9s/b9-1-firefly-queen-sleep_00001_.png'}),
    "w9-boss2-axolotl": (MINI_H, True, {'': 'G13/b9/b9-2-axolotl_00003_.png', '-sleep': 'G14/b9s/b9-2-axolotl-sleep_00002_.png'}),
    "w10-boss1-moon-rabbit": (MINI_H, False, {'': 'G13/b10/b10-1-moon-rabbit_00004_.png', '-sleep': 'G14/b10s/b10-1-moon-rabbit-sleep_00002_.png'}),
    "w10-boss2-peacock": (MINI_H, False, {'': 'G13/b10/b10-2-peacock_00002_.png', '-sleep': 'G14/b10s/b10-2-peacock-sleep_00002_.png'}),
    "w8-thunderbird-boss": (BOSS_H, False, {"": "G15/r8/r8-thunderbird-boss_00001_.png", "-sleep": "G15/r8s/r8-thunderbird-boss-sleep_00001_.png", "-phase2": "G15/r8s/r8-thunderbird-boss-phase2_00001_.png", "-phase3": "G15/r8s/r8-thunderbird-boss-phase3_00001_.png"}),
    "w9-giant-mole-boss": (BOSS_H, False, {"": "G15/r9/r9-giant-mole-boss_00003_.png", "-sleep": "G15/r9s/r9-giant-mole-boss-sleep_00002_.png", "-phase2": "G15/r9s/r9-giant-mole-boss-phase2_00001_.png", "-phase3": "G15/r9s/r9-giant-mole-boss-phase3_00002_.png"}),
    "w10-dream-tapir-boss": (BOSS_H, False, {"": "G15/r10/r10-dream-tapir-boss_00002_.png", "-sleep": "G15/r10s/r10-dream-tapir-boss-sleep_00001_.png", "-phase2": "G15/r10s/r10-dream-tapir-boss-phase2_00001_.png", "-phase3": "G15/r10s/r10-dream-tapir-boss-phase3_00002_.png"}),
}
# 旁邊黏著多出來的小角色（和本體連在一起，keep_largest 拿不掉）：翻轉後只保留左邊這個比例的寬度
CROP_KEEP = {}  # 2026-10-22 巨鼴鼠重畫後旁邊沒有多的角色，不用再切

for name, (h, flip, srcs) in BOSSES.items():
    if not all(os.path.exists(v.replace("G13/", G13 + "/").replace("G14/", G14 + "/").replace("G15/", G15 + "/")) for v in srcs.values()):
        print(f"提醒：{name} 的來源圖還沒齊，先跳過"); continue
    def prep(src):
        im = load(src, flip)
        if name in CROP_KEEP:
            im = im.crop((0, 0, round(im.width * CROP_KEEP[name]), im.height)); im = im.crop(im.getchannel("A").getbbox())
        return im
    base = prep(srcs[""]); k = h / base.height
    for suf, src in srcs.items():
        im = base if suf == "" else prep(src)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        save(im, A("enemies", name + suf + ".png"))

# ---- 攻擊道具（程式畫，放大 4 倍畫再縮小） ----
K = 4
def canvas(w, h):
    im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

def acorn():  # 1-1 松鼠丟的橡實
    im, d = canvas(20, 26)
    d.ellipse((3 * K, 9 * K, 17 * K, 25 * K), fill=(196, 132, 74, 255), outline=OUTLINE, width=2 * K)
    d.chord((2 * K, 5 * K, 18 * K, 17 * K), 180, 360, fill=(120, 80, 50, 255), outline=OUTLINE, width=2 * K)
    d.rectangle((4 * K, 10 * K, 16 * K, 12 * K), fill=(120, 80, 50, 255))
    d.line((2 * K, 11 * K, 18 * K, 11 * K), fill=OUTLINE, width=2 * K)  # 殼斗下緣外框
    d.line((10 * K, 6 * K, 12 * K, 2 * K), fill=OUTLINE, width=3 * K)   # 蒂（留在畫布內）
    d.ellipse((6 * K, 14 * K, 9 * K, 18 * K), fill=(240, 190, 130, 255))
    return im.resize((20, 26), Image.LANCZOS)

def log():  # 1-2 河狸丟的木頭
    im, d = canvas(40, 18)
    d.rounded_rectangle((2 * K, 3 * K, 34 * K, 15 * K), radius=5 * K, fill=(150, 98, 60, 255), outline=OUTLINE, width=2 * K)
    d.ellipse((28 * K, 2 * K, 38 * K, 16 * K), fill=(230, 190, 130, 255), outline=OUTLINE, width=2 * K)
    d.ellipse((31 * K, 6 * K, 35 * K, 12 * K), outline=(160, 110, 70, 255), width=K)
    for x in (10, 18):
        d.line((x * K, 6 * K, (x + 5) * K, 6 * K), fill=(110, 70, 40, 255), width=K)
    return im.resize((40, 18), Image.LANCZOS)

def water_wave():  # 1-2 河狸尾巴拍出的水波：左邊是捲起來的浪頭，右邊拖長，往左推進
    im, d = canvas(48, 28)
    pts = [(4, 26), (4, 14), (8, 6), (15, 3), (21, 5), (22, 10), (17, 11), (15, 14), (22, 16), (32, 20), (46, 26)]
    d.polygon([(x * K, y * K) for x, y in pts], fill=(140, 200, 240, 240), outline=OUTLINE, width=2 * K)
    d.line([(x * K, y * K) for x, y in pts], fill=OUTLINE, width=2 * K, joint="curve")
    d.arc((9 * K, 5 * K, 19 * K, 13 * K), 190, 330, fill=(235, 248, 255, 255), width=2 * K)
    d.line((24 * K, 21 * K, 34 * K, 23 * K), fill=(235, 248, 255, 255), width=2 * K)
    return im.resize((48, 28), Image.LANCZOS)

def blob(w, h, fill, hi=(255, 255, 255, 220), alpha=255):
    """圓圓的小東西（口水、泡泡、熔岩球、麻糬…）：深紫外框＋左上角亮點。"""
    im, d = canvas(w, h)
    d.ellipse((2 * K, 2 * K, (w - 2) * K, (h - 2) * K), fill=fill[:3] + (alpha,), outline=OUTLINE, width=2 * K)
    d.ellipse((w * K * 0.28, h * K * 0.22, w * K * 0.45, h * K * 0.4), fill=hi)
    return im.resize((w, h), Image.LANCZOS)

def puff(w, h, color, alpha=200):
    """蒸氣、沙塵、夢霧：幾顆重疊的圓，半透明，沒有外框。"""
    im, d = canvas(w, h); circles = []
    for fx, fy, fr in ((0.3, 0.58, 0.24), (0.55, 0.45, 0.3), (0.74, 0.6, 0.2), (0.48, 0.66, 0.2)):
        r = fr * min(w, h) * K * 1.2; circles.append((fx * w * K - r, fy * h * K - r, fx * w * K + r, fy * h * K + r))
    for b in circles:  # 先畫外框（放大一點的深紫），再畫填色，整團只有外圍一圈深紫線
        d.ellipse((b[0] - 2 * K, b[1] - 2 * K, b[2] + 2 * K, b[3] + 2 * K), fill=OUTLINE)
    for b in circles:
        d.ellipse(b, fill=color + (255,))
    im.putalpha(im.getchannel("A").point(lambda v: v * alpha // 255))
    return im.resize((w, h), Image.LANCZOS)

def shockwave(color=(230, 210, 170)):
    """跺腳／砸地的地面震波：往左右擴散的半圓弧（放在地面上）。"""
    im, d = canvas(48, 16)
    for i, r in enumerate((20, 14, 8)):
        d.arc((24 * K - r * K, 16 * K - r * K * 0.7, 24 * K + r * K, 16 * K + r * K * 0.7), 180, 360, fill=OUTLINE if i == 0 else color + (255,), width=2 * K)
    return im.resize((48, 16), Image.LANCZOS)

def zigzag(w, h, fill, glow, horizontal=True):
    """閃電／電流：鋸齒線，外層發光。horizontal=True 時左右兩端在同一高度，可以橫向重複接成整條。"""
    im, d = canvas(w, h)
    if horizontal:
        pts = [(x * K, (h / 2 + (h * 0.3 if i % 2 else -h * 0.3)) * K if 0 < i < 6 else h / 2 * K) for i, x in enumerate([0, w * .17, w * .33, w * .5, w * .67, w * .83, w])]
    else:
        pts = [((w / 2 + (w * 0.3 if i % 2 else -w * 0.3)) * K if 0 < i < 5 else w / 2 * K, y * K) for i, y in enumerate([0, h * .2, h * .4, h * .6, h * .8, h])]
    d.line(pts, fill=OUTLINE, width=7 * K, joint="curve"); d.line(pts, fill=glow + (255,), width=5 * K, joint="curve"); d.line(pts, fill=fill + (255,), width=2 * K, joint="curve")
    return im.resize((w, h), Image.LANCZOS)

def water_jet():  # 7-2 大象鼻子噴的水柱：往左噴，橫向可以重複接長
    im, d = canvas(32, 14)
    d.rectangle((0, 3 * K, 32 * K, 11 * K), fill=(150, 205, 245, 235))
    d.line((0, 3 * K, 32 * K, 3 * K), fill=OUTLINE, width=2 * K); d.line((0, 11 * K, 32 * K, 11 * K), fill=OUTLINE, width=2 * K)
    for x in (6, 20): d.line((x * K, 6 * K, (x + 6) * K, 6 * K), fill=(235, 248, 255, 255), width=2 * K)
    return im.resize((32, 14), Image.LANCZOS)

def mango():  # 6-1 樹懶丟的水果
    im, d = canvas(22, 22)
    d.ellipse((3 * K, 5 * K, 19 * K, 21 * K), fill=(250, 180, 60, 255), outline=OUTLINE, width=2 * K)
    d.ellipse((5 * K, 7 * K, 12 * K, 15 * K), fill=(255, 120, 90, 200))
    d.polygon([(11 * K, 6 * K), (16 * K, 1 * K), (19 * K, 4 * K)], fill=(110, 170, 80, 255), outline=OUTLINE)
    return im.resize((22, 22), Image.LANCZOS)

def bamboo():  # 8-2 熊貓丟的迴旋竹子（程式可以讓它旋轉）
    im, d = canvas(40, 12)
    d.rounded_rectangle((2 * K, 2 * K, 38 * K, 10 * K), radius=3 * K, fill=(140, 200, 100, 255), outline=OUTLINE, width=2 * K)
    for x in (13, 26): d.line((x * K, 2 * K, x * K, 10 * K), fill=OUTLINE, width=2 * K)
    return im.resize((40, 12), Image.LANCZOS)

def rock():  # 8-1 山羊撞山壁掉的落石、9-3 鼴鼠挖出的石塊
    im, d = canvas(24, 22)
    d.polygon([(4 * K, 8 * K), (10 * K, 2 * K), (19 * K, 4 * K), (22 * K, 13 * K), (16 * K, 20 * K), (6 * K, 19 * K), (2 * K, 13 * K)], fill=(140, 130, 150, 255), outline=OUTLINE, width=2 * K)
    d.line((8 * K, 9 * K, 13 * K, 12 * K), fill=(100, 90, 110, 255), width=K)
    return im.resize((24, 22), Image.LANCZOS)

def firefly():  # 9-1 螢火蟲女王召喚的小螢火蟲（發光）
    im, d = canvas(18, 16)
    d.ellipse((1 * K, 2 * K, 8 * K, 8 * K), fill=(220, 235, 255, 230), outline=OUTLINE, width=K)   # 翅膀
    d.ellipse((10 * K, 2 * K, 17 * K, 8 * K), fill=(220, 235, 255, 230), outline=OUTLINE, width=K)
    d.ellipse((4 * K, 5 * K, 14 * K, 15 * K), fill=(255, 230, 90, 255), outline=OUTLINE, width=2 * K)  # 發光的身體
    d.ellipse((6 * K, 7 * K, 9 * K, 10 * K), fill=(255, 255, 220, 255))
    return im.resize((18, 16), Image.LANCZOS)

def mochi():  # 10-1 月兔丟的麻糬（打到會變慢）
    im, d = canvas(24, 18)
    d.ellipse((2 * K, 4 * K, 22 * K, 17 * K), fill=(255, 248, 240, 255), outline=OUTLINE, width=2 * K)
    d.ellipse((7 * K, 9 * K, 9 * K, 11 * K), fill=OUTLINE); d.ellipse((15 * K, 9 * K, 17 * K, 11 * K), fill=OUTLINE)
    d.ellipse((5 * K, 11 * K, 8 * K, 13 * K), fill=(247, 168, 196, 255)); d.ellipse((16 * K, 11 * K, 19 * K, 13 * K), fill=(247, 168, 196, 255))
    return im.resize((24, 18), Image.LANCZOS)

def feather():  # 10-2 孔雀的羽毛飛鏢：尖端朝左（往左飛）
    im, d = canvas(36, 14)
    d.line((3 * K, 7 * K, 34 * K, 7 * K), fill=OUTLINE, width=2 * K)
    d.polygon([(2 * K, 7 * K), (14 * K, 1 * K), (30 * K, 4 * K), (30 * K, 10 * K), (14 * K, 13 * K)], fill=(70, 160, 140, 255), outline=OUTLINE, width=2 * K)
    d.ellipse((20 * K, 4 * K, 27 * K, 10 * K), fill=(60, 80, 180, 255), outline=(250, 210, 90, 255), width=K)
    return im.resize((36, 14), Image.LANCZOS)

PROPS = {"w1-acorn": acorn, "w1-log": log, "w1-water-wave": water_wave,
         "w2-spit": lambda: blob(16, 16, (230, 240, 210), alpha=230), "w2-sand-dust": lambda: puff(40, 24, (220, 190, 140)),
         "w3-bubble": lambda: blob(18, 18, (190, 225, 255), alpha=150), "w3-electric-beam": lambda: zigzag(32, 16, (255, 245, 150), (255, 230, 80)),
         "w5-steam": lambda: puff(36, 28, (240, 240, 245), alpha=170), "w5-shockwave": lambda: shockwave((240, 160, 90)),
         "w5-lava-ball": lambda: blob(20, 20, (245, 120, 40), hi=(255, 230, 120, 255)),
         "w6-mango": mango, "w7-water-jet": water_jet, "w7-shockwave": lambda: shockwave((220, 190, 130)),
         "w8-rock": rock, "w8-bamboo": bamboo, "w8-lightning": lambda: zigzag(24, 48, (255, 245, 150), (200, 220, 255), horizontal=False),
         "w9-firefly": firefly, "w9-water-bubble": lambda: blob(18, 18, (180, 220, 250), alpha=170), "w9-rock": rock,
         "w10-mochi": mochi, "w10-shockwave": lambda: shockwave((250, 240, 200)), "w10-feather": feather,
         "w10-dream-mist": lambda: puff(40, 28, (230, 170, 230), alpha=180)}
for name, fn in PROPS.items():
    save(fn(), A("bullets", name + ".png"))
print("ok")
