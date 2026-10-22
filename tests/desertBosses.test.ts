import { describe, test, expect } from 'vitest';
import { initialCamelBrain, stepCamel, type CamelSense } from '../src/game/camel';
import { FENNEC_BURROW_MS, FENNEC_DAZED_MS, FENNEC_RUN_MS, FENNEC_WARN_MS, initialFennecBrain, stepFennec, type FennecSense } from '../src/game/fennec';
import { blockDrops, initialSphinxBrain, stepSphinx, type SphinxSense } from '../src/game/sphinx';

describe('失眠駱駝', () => {
  const sense = (over: Partial<CamelSense> = {}): CamelSense => ({ x: 800, hpRatio: 1, targetX: 400, targetY: 460, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  function run(ms: number, over: Partial<CamelSense> = {}) {
    let brain = initialCamelBrain();
    const steps = [];
    for (let t = 0; t < ms; t += 50) {
      const s = stepCamel(brain, sense(over));
      brain = s.brain;
      steps.push(s);
    }
    return steps;
  }

  test('輪流吐三顆口水、踢沙浪', () => {
    const steps = run(8000);
    const attacks = steps.filter((s) => s.spits.length > 0 || s.wave !== null);
    expect(attacks.length).toBeGreaterThanOrEqual(2);
    expect(attacks[0].spits).toHaveLength(3);
    expect(attacks[1].wave).toBe(-1);
  });

  test('血量一半以下口水變五顆', () => {
    const first = run(3000, { hpRatio: 0.4 }).find((s) => s.spits.length > 0)!;
    expect(first.spits).toHaveLength(5);
  });

  test('踢沙前用屁股對著玩家,沙浪往玩家那邊', () => {
    const steps = run(8000);
    const i = steps.findIndex((s) => s.wave !== null);
    expect(steps[i - 1].brain.facing).toBe(1);
    expect(steps[i].wave).toBe(-1);
  });

  test('走路時和玩家保持距離,不走出畫面', () => {
    const steps = run(1500, { x: 120, targetX: 100 });
    expect(steps[0].vx).toBeGreaterThan(0);
    const walls = run(1500, { x: 900, targetX: 940, arenaRight: 960 });
    expect(walls[0].vx).toBeLessThan(0);
  });

  test('沒有醒著的玩家時站著不動', () => {
    expect(run(5000, { targetX: null, targetY: null }).every((s) => s.vx === 0 && s.spits.length === 0)).toBe(true);
  });
});

describe('熬夜耳廓狐', () => {
  const sense = (over: Partial<FennecSense> = {}): FennecSense => ({ x: 800, grounded: true, hpRatio: 1, targetX: 400, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  test('跑 → 鑽沙(看不見)→ 到玩家腳下 → 跳出來 → 頭暈 → 再跑', () => {
    let brain = initialFennecBrain();
    /** 一直走到換下一個動作,回傳經過的時間與每一格的結果。 */
    const until = (over: Partial<FennecSense> = {}) => {
      const mode = brain.mode;
      const steps = [];
      while (brain.mode === mode && steps.length < 200) {
        const s = stepFennec(brain, sense(over));
        brain = s.brain;
        steps.push(s);
      }
      return { ms: steps.length * 50, steps };
    };
    const run = until();
    expect(run.steps[0].vx).toBeLessThan(0);
    expect(run.ms).toBe(FENNEC_RUN_MS);
    expect(brain.mode).toBe('burrow');
    const burrow = until();
    expect(burrow.ms).toBe(FENNEC_BURROW_MS);
    expect(burrow.steps.every((s) => s.hidden)).toBe(true);
    expect(burrow.steps.at(-1)!.teleportX).toBe(400);
    expect(brain.mode).toBe('under');
    const under = until();
    expect(under.ms).toBe(FENNEC_WARN_MS);
    expect(under.steps.slice(0, -1).every((s) => s.hidden)).toBe(true);
    const pop = under.steps.at(-1)!;
    expect(brain.mode).toBe('pop');
    expect(pop.hidden).toBe(false);
    expect(pop.vy).toBeLessThan(0);
    expect(pop.clumps).toHaveLength(0);
    // 還在空中不算落地。
    expect(until({ grounded: false }).ms).toBe(10000);
    expect(brain.mode).toBe('pop');
    until();
    expect(brain.mode).toBe('dazed');
    expect(until().ms).toBe(FENNEC_DAZED_MS);
    expect(brain.mode).toBe('run');
  });

  test('鑽到玩家腳下的位置夾在畫面裡', () => {
    const brain = { ...initialFennecBrain(), mode: 'burrow' as const, timerMs: FENNEC_BURROW_MS };
    const s = stepFennec(brain, sense({ targetX: 5 }));
    expect(s.teleportX).toBeGreaterThanOrEqual(35);
  });

  test('血量一半以下跳出來時往兩邊丟沙塊', () => {
    const brain = { ...initialFennecBrain(), mode: 'under' as const, timerMs: FENNEC_WARN_MS };
    const s = stepFennec(brain, sense({ hpRatio: 0.4 }));
    expect(s.clumps).toHaveLength(2);
    expect(s.clumps[0].vx).toBeLessThan(0);
    expect(s.clumps[1].vx).toBeGreaterThan(0);
  });
});

describe('人面獅身', () => {
  let seed = 1;
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const sense = (over: Partial<SphinxSense> = {}): SphinxSense => ({
    mouthX: 850,
    mouthY: 400,
    hpRatio: 1,
    targetX: 400,
    targetY: 460,
    dropLeft: 60,
    dropRight: 760,
    minionsAlive: 0,
    dtMs: 50,
    rand,
    ...over,
  });

  function run(ms: number, over: Partial<SphinxSense> = {}, brain = initialSphinxBrain()) {
    const steps = [];
    for (let t = 0; t < ms; t += 50) {
      const s = stepSphinx(brain, sense(over));
      brain = s.brain;
      steps.push(s);
    }
    return { steps, brain };
  }

  test('輪流沙磚雨、沙浪、沙球', () => {
    const { steps } = run(7000);
    const attacks = steps.filter((s) => s.blocks.length + s.waves.length + s.balls.length > 0);
    expect(attacks.length).toBe(3);
    expect(attacks[0].blocks).toHaveLength(3);
    expect(attacks[1].waves).toEqual([0]);
    expect(attacks[2].balls).toHaveLength(3);
    // 沙球朝玩家(左邊)飛。
    expect(attacks[2].balls.every((b) => b.vx < 0)).toBe(true);
  });

  test('血量掉到 2/3 以下:發抖 1 秒打不動,進入第二階段', () => {
    const { steps, brain } = run(100, { hpRatio: 0.6 });
    expect(steps[0].enteredPhase).toBe(2);
    expect(steps[0].invulnerable).toBe(true);
    expect(brain.phase).toBe(2);
    const after = run(1100, { hpRatio: 0.6 }, brain);
    expect(after.steps.at(-1)!.invulnerable).toBe(false);
  });

  test('第三階段沙磚五塊、沙浪兩道、沙球五顆', () => {
    const brain = { ...initialSphinxBrain(), phase: 3 as const };
    const { steps } = run(5000, { hpRatio: 0.2 }, brain);
    const attacks = steps.filter((s) => s.blocks.length + s.waves.length + s.balls.length > 0);
    expect(attacks[0].blocks).toHaveLength(5);
    expect(attacks[1].waves).toEqual([0, 700]);
    expect(attacks[2].balls).toHaveLength(5);
  });

  test('第二階段起每兩招叫一隻小怪,場上 3 隻就不叫', () => {
    const brain = { ...initialSphinxBrain(), phase: 2 as const };
    expect(run(8000, { hpRatio: 0.5 }, brain).steps.filter((s) => s.summon).length).toBeGreaterThanOrEqual(2);
    expect(run(8000, { hpRatio: 0.5, minionsAlive: 3 }, brain).steps.some((s) => s.summon)).toBe(false);
    expect(run(8000).steps.some((s) => s.summon)).toBe(false);
  });

  test('沙磚一塊瞄準玩家,其他散開、彼此留空隙,都在範圍內', () => {
    for (let k = 0; k < 20; k++) {
      const xs = blockDrops(5, 300, 60, 760, rand);
      expect(xs[0]).toBe(300);
      expect(xs).toHaveLength(5);
      for (const x of xs) expect(x >= 60 && x <= 760).toBe(true);
      for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) expect(Math.abs(xs[i] - xs[j])).toBeGreaterThanOrEqual(60);
    }
    expect(blockDrops(3, 2000, 60, 760, rand)[0]).toBe(760);
  });

  test('沒有醒著的玩家時不出招', () => {
    expect(run(8000, { targetX: null, targetY: null }).steps.every((s) => s.blocks.length + s.waves.length + s.balls.length === 0)).toBe(true);
  });
});
