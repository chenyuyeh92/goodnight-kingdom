"""世界 3「亞特蘭提斯海底王國」：魔物、睡著版、關主三階段、4 個場景背景與過渡圖。

用法：C:/ai-studio/ComfyUI_windows_portable/python_embeded/python.exe -I docs/art/tools/process_world3.py <ComfyUI output 資料夾> <專案根目錄>
近景海草（s1–s3）改用程式畫：AI 畫的海草太稀疏，處理後會碎掉。
注意：來源圖（ComfyUI 輸出的 gk7、gk8）只在美術的電腦上，沒有放進 repo。
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import cutout, fit, far, mid_from, seabed, seaweed, transition, save

OUT_DIR, ROOT = sys.argv[1], sys.argv[2]
G7, G8 = os.path.join(OUT_DIR, "gk7"), os.path.join(OUT_DIR, "gk8")
A = lambda *p: os.path.join(ROOT, "public", "assets", *p)

SPRITES = [  # (檔名, 來源, (寬上限, 高上限))
    ("w3-sleepy-jellyfish", (G7, "w3/w3-sleepy-jellyfish_00002_.png"), (48, 60)),
    ("w3-sleepy-jellyfish-sleep", (G8, "w3s/w3-sleepy-jellyfish-sleep_00003_.png"), (48, 60)),
    ("w3-alarm-clownfish", (G7, "w3/w3-alarm-clownfish_00002_.png"), (60, 48)),
    ("w3-alarm-clownfish-sleep", (G8, "w3s/w3-alarm-clownfish-sleep_00003_.png"), (60, 48)),
    ("w3-coffee-octopus", (G7, "w3/w3-coffee-octopus_00001_.png"), (56, 56)),
    ("w3-coffee-octopus-sleep", (G8, "w3s/w3-coffee-octopus-sleep_00003_.png"), (56, 56)),
    ("w3-puffer-fish", (G7, "w3/w3-puffer-fish_00001_.png"), (72, 72)),
    ("w3-puffer-fish-sleep", (G8, "w3s/w3-puffer-fish-sleep_00003_.png"), (72, 72)),
    ("w3-nessie-boss", (G7, "w3/w3-nessie-boss_00001_.png"), (240, 220)),
    ("w3-nessie-boss-phase2", (G8, "w3s/w3-nessie-phase2_00004_.png"), (240, 220)),
    ("w3-nessie-boss-phase3", (G8, "w3s/w3-nessie-phase3_00001_.png"), (240, 220)),
    ("w3-nessie-boss-sleep", (G8, "w3s/w3-nessie-boss-sleep_00002_.png"), (240, 220)),
]
for name, (base, src), box in SPRITES:
    save(fit(cutout(os.path.join(base, src)), box), A("enemies", name + ".png"))

B = lambda name: A("backgrounds", name)
SCENES = {
    "w3-s1": (far(os.path.join(G7, "w3bg/w3s1-far_00002_.png")), mid_from(os.path.join(G7, "w3bg/w3s1-mid_00002_.png"), (40, 110, 130)),
              seaweed((26, 80, 98), seed=1)),
    "w3-s2": (far(os.path.join(G8, "w3bg2/w3s2-far_00004_.png")), mid_from(os.path.join(G7, "w3bg/w3s2-mid_00002_.png"), (96, 52, 70)),
              seaweed((70, 38, 54), seed=2, kelp=8, coral=14)),
    "w3-s3": (far(os.path.join(G7, "w3bg/w3s3-far_00001_.png")), mid_from(os.path.join(G7, "w3bg/w3s3-mid_00002_.png"), (22, 30, 78)),
              seaweed((14, 20, 56), seed=3, kelp=20, coral=4)),
    "w3-s4": (far(os.path.join(G8, "w3bg2/w3s4-far_00001_.png"), darken=(0.45, (20, 16, 60))), mid_from(os.path.join(G7, "w3bg/w3s4-mid_00002_.png"), (18, 14, 50)),
              seabed((12, 10, 36), phase=1.7, rocks=((260, 10), (780, 8), (1200, 12)))),
}
for key, layers in SCENES.items():
    for n, im in zip(("far", "mid", "near"), layers):
        save(im, B(f"{key}-{n}.png"))
for s1, s2 in ((1, 2), (2, 3), (3, 4)):
    for i, n in enumerate(("far", "mid", "near")):
        im = transition(SCENES[f"w3-s{s1}"][i], SCENES[f"w3-s{s2}"][i])
        save(im.convert("RGB") if n == "far" else im, B(f"w3-t{s1}{s2}-{n}.png"))
print("ok")
