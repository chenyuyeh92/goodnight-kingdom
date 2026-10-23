import { describe, test, expect } from 'vitest';
import { bulletVelocity, initialChargeState, initialFireState, muzzleOffset, stepCharge, stepFire, type ChargeState, type FireState } from '../src/game/fire';

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

test('連射時保留剩餘時間,射速不受畫面更新率影響', () => {
  const count = (frameMs: number) => {
    let s = initialFireState();
    let n = 0;
    for (let t = 0; t < 700; t += frameMs) {
      const r = stepFire(s, true, frameMs, 35);
      s = r.state;
      if (r.fired) n++;
    }
    return n;
  };
  // 700ms ÷ 35ms = 20 發;畫面格數不同只允許差 1 發(第一發與最後一格的取整)。
  const at60 = count(1000 / 60);
  const at165 = count(1000 / 165);
  expect(at60).toBeGreaterThanOrEqual(19);
  expect(at60).toBeLessThanOrEqual(21);
  expect(Math.abs(at60 - at165)).toBeLessThanOrEqual(1);
});

describe('懷錶集氣', () => {
  const run = (s: ChargeState, held: boolean, ms: number, ready = true) => {
    let release: number | null = null;
    for (let t = 0; t < ms; t += 16) {
      const r = stepCharge(s, { held, canFire: ready, dtMs: 16, intervalMs: 300 });
      s = r.state;
      if (r.releaseMs !== null) release = r.releaseMs;
    }
    return { s, release };
  };

  test('按住時集氣、不射;放開才射出,帶著集了多久', () => {
    const a = run(initialChargeState(), true, 800);
    expect(a.release).toBeNull();
    expect(a.s.chargeMs).toBeGreaterThanOrEqual(784);
    const b = run(a.s, false, 16);
    expect(b.release).toBeGreaterThanOrEqual(784);
    expect(b.s.chargeMs).toBe(0);
  });

  test('射完要等間隔(300 ms)才能再開始集氣', () => {
    const shot = run(run(initialChargeState(), true, 100).s, false, 16);
    const again = run(shot.s, true, 160);
    expect(again.s.charging).toBe(false);
    const later = run(shot.s, true, 480);
    expect(later.s.charging).toBe(true);
  });

  test('沒在集氣時放開不會射;不能射(過熱、沒有武器)時不集氣', () => {
    expect(run(initialChargeState(), false, 200).release).toBeNull();
    expect(run(initialChargeState(), true, 200, false).s.charging).toBe(false);
  });
});
