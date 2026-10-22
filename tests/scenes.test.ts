import { test, expect } from 'vitest';
import { SCENE_LAYERS, sceneBlend, sceneKeys, tileCount } from '../src/art/scenes';
import { SPRITES } from '../src/art/sprites';

const PLAN = [
  { scene: 'w1-s3', fromScrollX: 0 },
  { scene: 'w1-s4', fromScrollX: 9300 },
] as const;

test('換場前只畫第一個場景', () => {
  expect(sceneBlend(PLAN, 5000)).toEqual({ from: 'w1-s3', to: null, t: 0 });
});

test('換場時依鏡頭位置淡入下一個場景', () => {
  const mid = sceneBlend(PLAN, 9600);
  expect(mid.from).toBe('w1-s3');
  expect(mid.to).toBe('w1-s4');
  expect(mid.t).toBeCloseTo(0.5);
});

test('淡入完成後只畫新場景', () => {
  expect(sceneBlend(PLAN, 9950)).toEqual({ from: 'w1-s4', to: null, t: 0 });
});

test('從檢查點重來(鏡頭直接在後面)也對', () => {
  expect(sceneBlend(PLAN, 10000).from).toBe('w1-s4');
});

test('每個場景三層都有圖,小張的近景鋪得滿畫面', () => {
  for (const layers of Object.values(SCENE_LAYERS)) {
    expect(layers).toHaveLength(3);
    for (const k of layers) {
      const w = SPRITES[k].w;
      expect(tileCount(w) * w).toBeGreaterThanOrEqual(960 + w);
    }
  }
  expect(sceneKeys(['w1-s3', 'w1-s4'])).toContain('w1-s4-near');
});
