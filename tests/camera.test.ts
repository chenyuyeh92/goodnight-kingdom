import { test, expect } from 'vitest';
import { advanceCamera, minPlayerX } from '../src/game/camera';

test('角色往前,鏡頭跟上', () => {
  expect(advanceCamera(0, 1000, 960, 3200, 0.4)).toBe(616);
});

test('角色往回,鏡頭不退', () => {
  expect(advanceCamera(616, 500, 960, 3200, 0.4)).toBe(616);
});

test('不超過世界右邊界', () => {
  expect(advanceCamera(0, 5000, 960, 3200, 0.4)).toBe(2240);
});

test('不小於 0', () => {
  expect(advanceCamera(0, 100, 960, 3200, 0.4)).toBe(0);
});

test('minPlayerX', () => {
  expect(minPlayerX(616, 16)).toBe(632);
});
