"""產生網頁用的素材(結果放在 public/web/,要 commit):

1. 粉圓字型子集:只留 src/ 裡出現過的字加上 ASCII,轉 woff2,依 OFL 改名為 Goodnight Round。
   改了遊戲文字之後要重跑(tests/webAssets.test.ts 會檢查有沒有漏字)。
2. 背景與封面背景 PNG 轉 WebP(美術原檔不動)。

用法:python3 tools/build_web_assets.py [--font]   (--font 只重做字型;需要 pip install fonttools brotli pillow)
"""
from pathlib import Path
import shutil

from fontTools import subset
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FONT_SRC = ROOT / 'public/assets/fonts/jf-openhuninn-2.1.ttf'
LICENSE_SRC = ROOT / 'public/assets/fonts/jf-openhuninn-LICENSE.txt'
OUT = ROOT / 'public/web'
# OFL:修改過(子集化)的字型不能用保留名稱(open huninn、huninn、Varela、Varela Round),連部分都不用。
FAMILY = 'Goodnight Round'
WEBP_QUALITY = 85


def used_chars() -> set[str]:
    chars = {chr(c) for c in range(0x20, 0x7F)}
    for path in (ROOT / 'src').rglob('*.ts'):
        chars.update(ch for ch in path.read_text(encoding='utf-8') if ord(ch) > 0x7F)
    return chars


def build_font() -> None:
    font = TTFont(FONT_SRC)
    cmap = font.getBestCmap()
    wanted = sorted(ch for ch in used_chars() if ord(ch) in cmap)
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=[ord(ch) for ch in wanted])
    subsetter.subset(font)
    # OFL:修改過的字型不能沿用保留名稱。
    for rec in font['name'].names:
        if rec.nameID in (1, 4, 16):
            rec.string = FAMILY
        elif rec.nameID == 6:
            rec.string = FAMILY.replace(' ', '')
        elif rec.nameID == 3:
            rec.string = f'{FAMILY} subset'
    (OUT / 'fonts').mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(OUT / 'fonts/goodnight-round.woff2')
    (OUT / 'fonts/goodnight-round-chars.txt').write_text(''.join(wanted), encoding='utf-8')
    shutil.copy(LICENSE_SRC, OUT / 'fonts/LICENSE-OFL.txt')


def build_backgrounds() -> None:
    dst = OUT / 'backgrounds'
    dst.mkdir(parents=True, exist_ok=True)
    for png in sorted((ROOT / 'public/assets/backgrounds').glob('*.png')):
        Image.open(png).save(dst / (png.stem + '.webp'), 'WEBP', quality=WEBP_QUALITY, method=6)
    # 封面背景原圖 1920×1080,遊戲畫面只有 960×540,縮小再轉。
    (OUT / 'ui').mkdir(parents=True, exist_ok=True)
    cover = Image.open(ROOT / 'public/assets/ui/cover-bg.png').convert('RGB').resize((960, 540), Image.LANCZOS)
    cover.save(OUT / 'ui/cover-bg.webp', 'WEBP', quality=WEBP_QUALITY, method=6)


if __name__ == '__main__':
    import sys
    build_font()
    if '--font' not in sys.argv:
        build_backgrounds()
    total = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
    print(f'public/web: {total / 1024 / 1024:.1f} MB')
