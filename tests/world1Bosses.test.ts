import { describe, test, expect } from 'vitest';
import { SQUIRREL_SHIELD_MS, hopSpot, initialSquirrelBrain, stepSquirrel, type SquirrelBrain, type SquirrelSense } from '../src/game/squirrel';
import { BEAVER_WALK_MS, initialBeaverBrain, stepBeaver, type BeaverSense } from '../src/game/beaver';

describe('失眠大松鼠', () => {
  const s = (over: Partial<SquirrelSense> = {}): SquirrelSense => ({ x: 800, grounded: true, hpRatio: 1, targetX: 300, targetY: 456, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  function run(ms: number, over: Partial<SquirrelSense> = {}) {
    let brain = initialSquirrelBrain();
    const steps = [];
    for (let t = 0; t < ms; t += 50) {
      const st = stepSquirrel(brain, s(over));
      brain = st.brain;
      steps.push(st);
    }
    return { steps, brain };
  }

  test('丟三顆橡實(往玩家那邊)→ 轉身用尾巴擋 1.5 秒', () => {
    const { steps } = run(1500 + SQUIRREL_SHIELD_MS);
    const acorns = steps.flatMap((x) => x.acorns);
    expect(acorns).toHaveLength(3);
    expect(acorns.every((a) => a.vx < 0 && a.vy < 0)).toBe(true);
    const shield = steps.filter((x) => x.armored);
    expect(shield.length).toBeGreaterThanOrEqual(SQUIRREL_SHIELD_MS / 50 - 1);
    // 擋的時候背對玩家(玩家在左邊,所以面向右)。
    expect(steps.find((x) => x.armored)!.brain.facing).toBe(1);
  });

  test('擋完跳到另一個位置,落地再丟', () => {
    let brain: SquirrelBrain = { ...initialSquirrelBrain(), mode: 'shield', timerMs: SQUIRREL_SHIELD_MS };
    const hop = stepSquirrel(brain, s());
    brain = hop.brain;
    expect(brain.mode).toBe('hop');
    expect(hop.vy).toBeLessThan(0);
    expect(hop.vx).not.toBe(0);
    for (let t = 0; t < 300; t += 50) brain = stepSquirrel(brain, s({ grounded: t > 200 })).brain;
    expect(brain.mode).toBe('throw');
    expect(brain.thrown).toBe(0);
  });

  test('跳的位置在畫面右半邊兩個點之間輪流', () => {
    const far = hopSpot(10000, 0, 960);
    const near = hopSpot(far, 0, 960);
    expect(near).toBeGreaterThan(480);
    expect(hopSpot(near, 0, 960)).toBe(far);
    expect(far).toBeLessThan(960);
  });

  test('血量一半以下丟五顆', () => {
    expect(run(2500, { hpRatio: 0.4 }).steps.flatMap((x) => x.acorns)).toHaveLength(5);
  });
});

describe('熬夜大河狸', () => {
  const s = (over: Partial<BeaverSense> = {}): BeaverSense => ({ x: 800, hpRatio: 1, targetX: 300, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  function run(ms: number, over: Partial<BeaverSense> = {}) {
    let brain = initialBeaverBrain();
    const steps = [];
    for (let t = 0; t < ms; t += 50) {
      const st = stepBeaver(brain, s(over));
      brain = st.brain;
      steps.push(st);
    }
    return steps;
  }

  test('輪流:尾巴拍出水波(往玩家那邊)→ 木頭掉在玩家頭上', () => {
    const steps = run(BEAVER_WALK_MS * 2 + 3000);
    const attacks = steps.filter((x) => x.waves.length + x.logs.length > 0);
    expect(attacks[0].waves).toEqual([{ dir: -1, delayMs: 0 }]);
    expect(attacks[1].logs).toEqual([300]);
  });

  test('血量一半以下水波兩道、木頭兩根', () => {
    const attacks = run(BEAVER_WALK_MS * 2 + 3000, { hpRatio: 0.4 }).filter((x) => x.waves.length + x.logs.length > 0);
    expect(attacks[0].waves).toHaveLength(2);
    expect(attacks[1].logs).toHaveLength(2);
  });

  test('和玩家保持距離,沒有玩家時不出招', () => {
    expect(run(100, { x: 400, targetX: 350 })[0].vx).toBeGreaterThan(0);
    expect(run(8000, { targetX: null }).every((x) => x.waves.length + x.logs.length === 0)).toBe(true);
  });
});
