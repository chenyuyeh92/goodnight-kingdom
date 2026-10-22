import { describe, test, expect } from 'vitest';
import { SINK_MS, SINK_PX, freshSand, inQuicksand, sinkDepth, stepSand } from '../src/game/sand';
import { PLATE_COOLDOWN_MS, landingTop, onPlate, stepPlate } from '../src/game/traps';

const STEP = { inSand: true, grounded: true, down: false, dtMs: 50 };

function run(n: number, input = STEP) {
  let state = freshSand();
  let sunk = 0;
  for (let i = 0; i < n; i++) {
    const r = stepSand(state, input);
    state = r.state;
    if (r.sunk) sunk += 1;
  }
  return { state, sunk };
}

describe('流沙', () => {
  test('範圍判定', () => {
    expect(inQuicksand(150, [{ x: 100, w: 100 }])).toBe(true);
    expect(inQuicksand(99, [{ x: 100, w: 100 }])).toBe(false);
  });

  test('站滿 2 秒才陷下去一次,之後重新計時', () => {
    expect(run(SINK_MS / 50 - 1).sunk).toBe(0);
    expect(run(SINK_MS / 50).sunk).toBe(1);
    expect(run((SINK_MS / 50) * 2).sunk).toBe(2);
  });

  test('越陷越深,最多 20 px', () => {
    expect(sinkDepth(freshSand())).toBe(0);
    expect(sinkDepth({ ms: SINK_MS / 2 })).toBeCloseTo(SINK_PX / 2);
    expect(sinkDepth({ ms: SINK_MS * 3 })).toBe(SINK_PX);
  });

  test('跳起來或離開流沙會慢慢恢復,不會陷', () => {
    const half = run(SINK_MS / 100).state;
    const air = stepSand(half, { ...STEP, grounded: false });
    expect(air.state.ms).toBeLessThan(half.ms);
    expect(air.sunk).toBe(false);
    expect(stepSand(half, { ...STEP, inSand: false }).state.ms).toBeLessThan(half.ms);
    expect(run(200, { ...STEP, inSand: false }).sunk).toBe(0);
  });

  test('睡著的人不會陷', () => {
    expect(run(200, { ...STEP, down: true }).sunk).toBe(0);
    expect(stepSand({ ms: 1500 }, { ...STEP, down: true }).state.ms).toBe(0);
  });

  test('卡頓時一格最多算 50 毫秒', () => {
    expect(stepSand(freshSand(), { ...STEP, dtMs: 5000 }).sunk).toBe(false);
  });
});

describe('壓力板與沙磚', () => {
  test('踩到就觸發,3 秒內不會再觸發', () => {
    let s = { cooldownMs: 0 };
    let r = stepPlate(s, true, 16);
    expect(r.fire).toBe(true);
    s = r.state;
    let fires = 0;
    for (let t = 0; t < PLATE_COOLDOWN_MS - 100; t += 50) {
      r = stepPlate(s, true, 50);
      s = r.state;
      if (r.fire) fires += 1;
    }
    expect(fires).toBe(0);
    for (let t = 0; t < 200; t += 50) {
      r = stepPlate(s, true, 50);
      s = r.state;
      if (r.fire) fires += 1;
    }
    expect(fires).toBe(1);
  });

  test('沒踩不會觸發', () => {
    expect(stepPlate({ cooldownMs: 0 }, false, 16).fire).toBe(false);
  });

  test('站在壓力板上才算(跳起來、站在旁邊都不算)', () => {
    const plate = { x: 500, drops: [] };
    expect(onPlate(510, 480, true, plate)).toBe(true);
    expect(onPlate(530, 480, true, plate)).toBe(false);
    expect(onPlate(510, 400, false, plate)).toBe(false);
    expect(onPlate(510, 380, true, plate)).toBe(false);
  });

  test('沙磚落在底下最高的表面:平台、已落地的沙磚或地面', () => {
    const plat = { x: 100, y: 380, w: 100, h: 20 };
    expect(landingTop(150, 40, 0, [plat])).toBe(380);
    expect(landingTop(300, 40, 0, [plat])).toBe(480);
    // 只擦到平台邊也算落在上面。
    expect(landingTop(85, 40, 0, [plat])).toBe(380);
    const block = { x: 280, y: 442, w: 40, h: 38 };
    expect(landingTop(300, 40, 0, [plat, block])).toBe(442);
    // 已經在平台下面開始掉的,不會往上「落」到平台。
    expect(landingTop(150, 40, 400, [plat])).toBe(480);
  });
});
