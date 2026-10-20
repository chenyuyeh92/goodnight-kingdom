import { test, expect } from 'vitest';
import { controlHint, intentsForMode, parsePlayMode } from '../src/input/playMode';

test('single 合併兩組按鍵', () => {
  const r = intentsForMode(new Set(['KeyD', 'Comma']), 'single');
  expect(r).toHaveLength(1);
  expect(r[0].right).toBe(true);
  expect(r[0].shoot).toBe(true);
});

test('duo 分開兩組', () => {
  const r = intentsForMode(new Set(['KeyD', 'Comma']), 'duo');
  expect(r).toHaveLength(2);
  expect(r[0].right).toBe(true);
  expect(r[0].shoot).toBe(false);
  expect(r[1].shoot).toBe(true);
  expect(r[1].right).toBe(false);
});

test('parsePlayMode', () => {
  expect(parsePlayMode('duo')).toBe('duo');
  expect(parsePlayMode('single')).toBe('single');
  expect(parsePlayMode('x')).toBeNull();
  expect(parsePlayMode(null)).toBeNull();
});

test('單人提示說兩組按鍵都可以用', () => {
  expect(controlHint('single')).toBe('A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍(方向鍵 , . 也可以)');
});

test('雙人提示分開列出兩位玩家的按鍵', () => {
  const hint = controlHint('duo');
  expect(hint).toContain('A:A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍');
  expect(hint).toContain('B:← → 移動  ↑ 上  ↓ 蹲/下  , 射擊  . 跳躍');
  expect(hint).not.toContain('也可以');
});
