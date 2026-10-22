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
  const have = new Set(readFileSync('public/web/fonts/gk-huninn-chars.txt', 'utf8'));
  const missing = new Set<string>();
  for (const f of sourceFiles('src')) {
    for (const ch of readFileSync(f, 'utf8')) {
      const c = ch.codePointAt(0)!;
      const cjk = (c >= 0x3000 && c <= 0x9fff) || (c >= 0xff00 && c <= 0xffef);
      if (cjk && !have.has(ch)) missing.add(ch);
    }
  }
  expect([...missing].join('')).toBe('');
});

test('背景都有對應的 WebP', () => {
  for (const k of SPRITE_KEYS) {
    const path = `public/${assetPath(k)}`;
    expect(existsSync(path), path).toBe(true);
  }
  expect(SPRITES['bg-far'].file).toContain('backgrounds/');
});
