"""產生 src/art/animSprites.ts:美術畫的世界 2–10 與 Boss 動畫格的素材對照表。

美術把每個角色的動畫格放在原圖旁邊,命名是「原圖名-動作-1..4.png」
(動作:walk 走路、flap 拍翅、swim 游動、bounce 彈跳;關主第二、三階段各一套),
見 docs/art/animations.md。美術新增或重做動畫格後重跑:python3 tools/gen_anim_sprites.py
(世界 1 小怪的動畫格在 sprites.ts 裡手寫,這裡只收檔名 w<數字>- 開頭的。)
"""
from pathlib import Path
import re

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ENEMIES = ROOT / 'public/assets/enemies'
OUT = ROOT / 'src/art/animSprites.ts'
FRAME = re.compile(r'^(w\d+-.+)-(walk|flap|swim|bounce)-([1-4])\.png$')
DOC = ROOT / 'docs/art/animations.md'
DOC_KIND = {'走路': 'walk', '拍翅': 'flap', '游動': 'swim', '彈跳': 'bounce'}


def doc_kinds() -> dict[str, str]:
    """美術文件表格裡每個原圖用哪一種動作(同一個角色留有兩種舊檔時以文件為準)。"""
    out = {}
    for m in re.finditer(r'^\| `([^`]+)` \| (走路|拍翅|游動|彈跳) \|', DOC.read_text(encoding='utf-8'), re.M):
        out[m.group(1)] = DOC_KIND[m.group(2)]
    return out


def main() -> None:
    wanted = doc_kinds()
    groups: dict[str, dict[str, list[str]]] = {}
    sizes: dict[str, tuple[int, int]] = {}
    for png in sorted(ENEMIES.glob('*.png')):
        m = FRAME.match(png.name)
        if not m:
            continue
        base, kind, _ = m.groups()
        if base in wanted and wanted[base] != kind:
            continue
        sizes[png.stem] = Image.open(png).size
        groups.setdefault(base, {}).setdefault(kind, []).append(png.stem)
    lines = [
        '// 由 tools/gen_anim_sprites.py 產生,不要手改(美術更新動畫格後重跑)。',
        '',
        '/** 動畫格素材(檔名、大小),併進 SPRITES。 */',
        'export const ANIM_SPRITES = {',
    ]
    for key, (w, h) in sizes.items():
        lines.append(f"  '{key}': {{ file: 'enemies/{key}.png', w: {w}, h: {h} }},")
    lines += [
        '} as const;',
        '',
        "export type AnimKind = 'walk' | 'flap' | 'swim' | 'bounce';",
        '',
        '/** 原圖檔名 → 動作種類與 4 格的素材 key。 */',
        'export const ANIMS: Readonly<Record<string, { kind: AnimKind; frames: readonly (keyof typeof ANIM_SPRITES)[] }>> = {',
    ]
    for base, kinds in sorted(groups.items()):
        for kind, frames in kinds.items():
            if len(frames) != 4:
                raise SystemExit(f'{base} {kind} 只有 {len(frames)} 格')
            keys = ', '.join(f"'{f}'" for f in sorted(frames))
            lines.append(f"  'enemies/{base}.png': {{ kind: '{kind}', frames: [{keys}] }},")
    lines += ['};', '']
    OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {len(groups)} 個角色(含階段)、{len(sizes)} 格')


if __name__ == '__main__':
    main()
