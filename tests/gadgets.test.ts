import { test, expect } from 'vitest';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { CRUMBLE_RESPAWN_MS, CRUMBLE_SHAKE_MS, SPRING_VY, moverOffset, stepCrumble, type CrumbleState } from '../src/game/gadgets';

test('移動平台在起點和起點 +(dx, dy) 之間平滑來回', () => {
  const m = { x: 100, y: 300, w: 120, dx: 200, dy: -80, periodMs: 4000 };
  expect(moverOffset(m, 0).x).toBeCloseTo(0);
  expect(moverOffset(m, 0).y).toBeCloseTo(0);
  const half = moverOffset(m, 2000);
  expect(half.x).toBeCloseTo(200);
  expect(half.y).toBeCloseTo(-80);
  const full = moverOffset(m, 4000);
  expect(full.x).toBeCloseTo(0);
  expect(full.y).toBeCloseTo(0);
  // 兩端慢、中間快。
  expect(moverOffset(m, 100).x).toBeLessThan(moverOffset(m, 1100).x - moverOffset(m, 1000).x);
});

test('彈跳墊大約跳一般跳的兩倍高', () => {
  const h = (v: number) => (v * v) / (2 * DEFAULT_TUNING.gravity);
  expect(h(SPRING_VY) / h(DEFAULT_TUNING.jumpVelocity)).toBeGreaterThanOrEqual(1.8);
});

test('會掉的平台:站上去抖 0.8 秒後掉下去,4 秒後長回來;抖的時候離開也會掉', () => {
  const run = (s: CrumbleState, ms: number, on: boolean) => {
    for (let t = 0; t < ms; t += 50) s = stepCrumble(s, on, 50);
    return s;
  };
  let s: CrumbleState = { phase: 'solid', ms: 0 };
  expect(run(s, 1000, false).phase).toBe('solid');
  s = stepCrumble(s, true, 50);
  expect(s.phase).toBe('shaking');
  expect(run(s, CRUMBLE_SHAKE_MS - 100, false).phase).toBe('shaking');
  s = run(s, CRUMBLE_SHAKE_MS, false);
  expect(s.phase).toBe('fallen');
  expect(run(s, CRUMBLE_RESPAWN_MS - 100, true).phase).toBe('fallen');
  expect(run(s, CRUMBLE_RESPAWN_MS, false).phase).toBe('solid');
});
