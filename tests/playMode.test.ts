import { test, expect } from 'vitest';
import { intentsForMode, parsePlayMode } from '../src/input/playMode';

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
