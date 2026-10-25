import { test, expect } from 'vitest';
import { FREE_WORLDS, needsFullVersion } from '../src/config/edition';

test('免費版(網頁版)可以玩世界 1–3,世界 4–10 要完整版', () => {
  expect(FREE_WORLDS).toBe(3);
  expect(needsFullVersion('w1-1', false)).toBe(false);
  expect(needsFullVersion('w3-3', false)).toBe(false);
  expect(needsFullVersion('w4-1', false)).toBe(true);
  expect(needsFullVersion('w10-3', false)).toBe(true);
  // 練習關不算任何世界,一直可以玩。
  expect(needsFullVersion('range', false)).toBe(false);
});

test('完整版全部可以玩', () => {
  expect(needsFullVersion('w4-1', true)).toBe(false);
  expect(needsFullVersion('w10-3', true)).toBe(false);
});
