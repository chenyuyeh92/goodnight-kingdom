import { test, expect } from 'vitest';
import { drawnGuardSize } from '../src/game/playerEntity';

test('畫的守衛照比例縮放:一般高 60,很寬的畫寬 90 且不變形', () => {
  expect(drawnGuardSize(64, 128)).toEqual({ w: 30, h: 60 });
  const wide = drawnGuardSize(192, 12);
  expect(wide.w).toBeCloseTo(90);
  expect(wide.w / wide.h).toBeCloseTo(16);
});
