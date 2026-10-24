import { test, expect } from 'vitest';
import { hintText, HINT_KINDS } from '../src/ui/hints';

test('鍵盤單人顯示按鍵', () => {
  expect(hintText('jump', 'single', false)).toContain('V');
  expect(hintText('crouch', 'single', false)).toContain('S');
});

test('雙人同時列出 A、B 的按鍵', () => {
  const t = hintText('jump', 'duo', false);
  expect(t).toContain('V');
  expect(t).toContain('.');
});

test('手機不提鍵盤', () => {
  for (const k of HINT_KINDS) expect(hintText(k, 'single', true)).not.toMatch(/\b[ACDSVW]\b/);
});

test('英文告示牌:按鍵提示換到下一行,用半形括號', async () => {
  const { setLang } = await import('../src/i18n/lang');
  const mem = new Map<string, string>();
  const s = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
  setLang('en', s);
  try {
    expect(hintText('jump', 'single', false)).toBe('Jump over the thorns\n(V)');
    expect(hintText('chest', 'single', false)).not.toContain('(');
  } finally {
    setLang('zh', s);
  }
});
