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
G13, G14 = os.path.join(OUT_DIR, "gk13"), os.path.join(OUT_DIR, "gk14")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)
MINI_H, BOSS_H = 150, 220

def load(src, flip):
    im = cutout(src.replace("G13/", G13 + "/").replace("G14/", G14 + "/"))
    # 清掉很淡的雜點（地面陰影殘留），再重新裁切，讓最底列是身體
    im.putalpha(im.getchannel("A").point(lambda v: 0 if v < 60 else v))
    im = im.crop(im.getchannel("A").getbbox())
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im

# {Boss 檔名: (目標高度, 是否翻轉, {"": 醒著來源, "-sleep": 睡著來源, "-phase2": …, "-phase3": …})}
BOSSES = {
    "w1-boss1-squirrel": (MINI_H, False, {"": "G13/b1/b1-1-squirrel_00004_.png", "-sleep": "G14/b1s/b1-1-squirrel-sleep_00002_.png"}),
    "w1-boss2-beaver": (MINI_H, False, {"": "G13/b1/b1-2-beaver_00001_.png", "-sleep": "G14/b1s/b1-2-beaver-sleep_00002_.png"}),
}
for name, (h, flip, srcs) in BOSSES.items():
    base = load(srcs[""], flip); k = h / base.height
    for suf, src in srcs.items():
        im = base if suf == "" else load(src, flip)
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

PROPS = {"w1-acorn": acorn, "w1-log": log, "w1-water-wave": water_wave}
for name, fn in PROPS.items():
    save(fn(), A("bullets", name + ".png"))
print("ok")
