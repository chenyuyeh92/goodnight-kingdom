import { test, expect } from 'vitest';
import { bulletVelocity, initialFireState, muzzleOffset, stepFire, type FireState } from '../src/game/fire';

test('點一下立刻發射', () => {
  expect(stepFire(initialFireState(), true, 16, 160).fired).toBe(true);
});

test('按住每 160ms 一發', () => {
  let s: FireState = initialFireState();
  const firedAt: number[] = [];
  for (let i = 1; i <= 20; i++) {
    const r = stepFire(s, true, 16, 160);
    s = r.state;
    if (r.fired) firedAt.push(i);
  }
  expect(firedAt).toEqual([1, 11]);
});

test('放開期間冷卻照樣倒數', () => {
  let s = stepFire(initialFireState(), true, 16, 160).state;
  for (let i = 0; i < 10; i++) s = stepFire(s, false, 16, 160).state;
  expect(stepFire(s, true, 16, 160).fired).toBe(true);
});

test('超大 dtMs 不會一次補很多發', () => {
  const big = stepFire(initialFireState(), true, 5000, 160);
  expect(big.fired).toBe(true);
  expect(big.state.cooldownMs).toBe(160);
  expect(stepFire(big.state, true, 16, 160).fired).toBe(false);
});

test('forward 子彈速度依面向', () => {
  expect(bulletVelocity('forward', -1, 620)).toEqual({ vx: -620, vy: 0 });
});

test('up 子彈往上', () => {
  expect(bulletVelocity('up', 1, 620)).toEqual({ vx: 0, vy: -620 });
});

test('down 子彈往下', () => {
  expect(bulletVelocity('down', 1, 620)).toEqual({ vx: 0, vy: 620 });
});

test('蹲下 forward 面向 -1 的槍口', () => {
  expect(muzzleOffset('forward', -1, true)).toEqual({ x: -16, y: -14 });
});
