import { describe, test, expect } from 'vitest';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { DIVE_VY, RELEASE_VY, RISE_VY, SINK_VY, STROKE_VY, SWIM_TOP, clampToWater, swimVy, waterTuning } from '../src/game/swim';
import { currentAt, pushed } from '../src/game/currents';

const IN = { jump: false, jumpPressed: false, down: false, grounded: false, asleep: false };

describe('游泳', () => {
  test('水裡重力小、左右慢一點、從海床只小跳', () => {
    const w = waterTuning(DEFAULT_TUNING);
    expect(w.gravity).toBeLessThan(DEFAULT_TUNING.gravity / 2);
    expect(w.walkSpeed).toBeLessThan(DEFAULT_TUNING.walkSpeed);
    expect(w.jumpVelocity).toBeLessThan(DEFAULT_TUNING.jumpVelocity);
  });

  test('按一下往上划、按住往上游', () => {
    expect(swimVy(100, { ...IN, jump: true, jumpPressed: true })).toBe(-STROKE_VY);
    expect(swimVy(100, { ...IN, jump: true })).toBe(-RISE_VY);
    // 剛划完速度更快時不會被拉慢。
    expect(swimVy(-280, { ...IN, jump: true })).toBe(-280);
  });

  test('放開:往上的速度馬上變慢,往下最快 SINK_VY', () => {
    expect(swimVy(-300, IN)).toBe(-RELEASE_VY);
    expect(swimVy(500, IN)).toBe(SINK_VY);
    expect(swimVy(50, IN)).toBe(50);
  });

  test('按住下往下潛', () => {
    expect(swimVy(-100, { ...IN, down: true })).toBe(DIVE_VY);
  });

  test('站在海床上交給一般跳躍;睡著的人只會沉', () => {
    expect(swimVy(-335, { ...IN, grounded: true, jump: true, jumpPressed: true })).toBe(-335);
    expect(swimVy(300, { ...IN, grounded: true })).toBe(SINK_VY);
    expect(swimVy(-200, { ...IN, asleep: true, jump: true, jumpPressed: true })).toBe(-200);
    expect(swimVy(300, { ...IN, asleep: true })).toBe(SINK_VY);
  });

  test('不能游出水面', () => {
    expect(clampToWater(SWIM_TOP + 1, -100)).toBeNull();
    expect(clampToWater(SWIM_TOP - 30, -200)).toEqual({ feetY: SWIM_TOP, vy: 0 });
    expect(clampToWater(SWIM_TOP - 30, 50)).toEqual({ feetY: SWIM_TOP, vy: 50 });
  });
});

describe('水流與氣泡柱', () => {
  const flow = { x: 100, y: 100, w: 200, h: 200, vx: -80, vy: 0 };
  const vent = { x: 400, y: 100, w: 60, h: 380, vx: 0, vy: -260 };

  test('範圍內才有作用,重疊時相加', () => {
    expect(currentAt(150, 150, [flow, vent])).toEqual({ vx: -80, vy: 0 });
    expect(currentAt(420, 300, [flow, vent])).toEqual({ vx: 0, vy: -260 });
    expect(currentAt(50, 50, [flow, vent])).toEqual({ vx: 0, vy: 0 });
    expect(currentAt(150, 150, [flow, flow])).toEqual({ vx: -160, vy: 0 });
  });

  test('左右直接加上去;氣泡柱往上的速度至少是氣泡柱的速度,不會越疊越快', () => {
    expect(pushed(200, 50, { vx: -80, vy: 0 })).toEqual({ vx: 120, vy: 50 });
    expect(pushed(0, 100, { vx: 0, vy: -260 })).toEqual({ vx: 0, vy: -260 });
    expect(pushed(0, -300, { vx: 0, vy: -260 })).toEqual({ vx: 0, vy: -300 });
  });
});
