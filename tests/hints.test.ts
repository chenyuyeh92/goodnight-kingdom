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
