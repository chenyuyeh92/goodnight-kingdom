import { test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SPRITES, SPRITE_KEYS, assetPath } from '../src/art/sprites';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith('.ts') ? [p] : [];
  });
}

test('子集字型包含原始碼裡所有中文字(漏字會顯示成方框,請重跑 tools/build_web_assets.py)', () => {
  const have = new Set(readFileSync('public/web/fonts/goodnight-round-chars.txt', 'utf8'));
  const missing = new Set<string>();
  for (const f of sourceFiles('src')) {
    // 註解不會顯示在畫面上,不算。
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
    for (const ch of code) {
      const c = ch.codePointAt(0)!;
      const cjk = (c >= 0x3000 && c <= 0x9fff) || (c >= 0xff00 && c <= 0xffef);
      if (cjk && !have.has(ch)) missing.add(ch);
    }
  }
  expect([...missing].join('')).toBe('');
});

/** WebP 檔頭裡的寬高(VP8X、VP8L、VP8 三種格式)。 */
function webpSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
}

test('每張圖都有轉好的 WebP,而且和原圖一樣大(美術換圖後忘了重轉會抓到)', () => {
  for (const k of SPRITE_KEYS) {
    const path = `public/${assetPath(k)}`;
    expect(existsSync(path), path).toBe(true);
    // 封面背景是故意縮小的。
    if (k === 'ui-cover-bg') continue;
    expect(webpSize(path), `${path}(請重跑 python3 tools/build_web_assets.py --sprites)`).toEqual({ w: SPRITES[k].w, h: SPRITES[k].h });
  }
  expect(SPRITES['bg-far'].file).toContain('backgrounds/');
});
