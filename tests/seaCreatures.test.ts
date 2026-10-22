import { describe, test, expect } from 'vitest';
import { ENEMY_DEFS, PUFF_MS, bulletEffect, initialBrain, pufferHit, stepEnemy, type EnemyBrain, type EnemySense, type EnemyType } from '../src/game/enemies';
import { CRAB_SHELL_MS, CRAB_WALK_MS, initialCrabBrain, stepCrab, type CrabSense } from '../src/game/crab';
import { BEAM_MAX_Y, BEAM_MIN_Y, EEL_CHARGE_MS, EEL_SWIM_MS, EEL_ZAP_MS, eelBeams, initialEelBrain, stepEel, type EelSense } from '../src/game/eel';
import { LANE_MAX_Y, LANE_MIN_Y, NESSIE_WINDUP_MS, initialNessieBrain, stepNessie, type NessieBrain, type NessieSense } from '../src/game/nessie';

const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 300, grounded: false, targetX: 200, targetY: 300, dtMs: 50, ...over });

function simulate(type: EnemyType, ms: number, over: Partial<EnemySense> = {}, brain: EnemyBrain = initialBrain(type)) {
  const moves = [];
  for (let t = 0; t < ms; t += 50) {
    const m = stepEnemy(type, brain, sense(over));
    brain = m.brain;
    moves.push(m);
  }
  return moves;
}

describe('世界 3 的魔物', () => {
  test('魚類都在水中游(不受重力),寄居蟹在海床上走', () => {
    for (const t of ['jellyfish', 'clownfish', 'octopus', 'puffer', 'eel', 'nessie'] as const) expect(ENEMY_DEFS[t].flying).toBe(true);
    expect(ENEMY_DEFS.hermitCrab.flying).toBe(false);
  });

  test('水母上下漂、慢慢往玩家漂', () => {
    const moves = simulate('jellyfish', 2400);
    expect(moves.some((m) => (m.vy ?? 0) > 50)).toBe(true);
    expect(moves.some((m) => (m.vy ?? 0) < -50)).toBe(true);
    expect(moves.every((m) => m.vx <= 0)).toBe(true);
  });

  test('小丑魚直直游,游過頭 2.5 秒後才轉身', () => {
    let brain = initialBrain('clownfish');
    let m = stepEnemy('clownfish', brain, sense({ targetX: 200 }));
    brain = m.brain;
    expect(m.vx).toBeLessThan(0);
    // 玩家跑到背後:還是往前游。
    for (let t = 0; t < 2000; t += 50) {
      m = stepEnemy('clownfish', brain, sense({ targetX: 900 }));
      brain = m.brain;
      expect(m.vx).toBeLessThan(0);
    }
    for (let t = 0; t < 600; t += 50) {
      m = stepEnemy('clownfish', brain, sense({ targetX: 900 }));
      brain = m.brain;
    }
    expect(m.vx).toBeGreaterThan(0);
  });

  test('章魚每 2.8 秒朝玩家噴一口直線墨汁,太遠不噴', () => {
    const moves = simulate('octopus', 6000, { targetX: 150, targetY: 300 });
    const inks = moves.filter((m) => m.spit);
    expect(inks).toHaveLength(2);
    expect(inks[0].spit!.gravity).toBe(0);
    expect(inks[0].spit!.vx).toBeLessThan(0);
    expect(Math.abs(inks[0].spit!.vy)).toBeLessThan(1);
    expect(simulate('octopus', 6000, { targetX: 1200 }).filter((m) => m.spit)).toHaveLength(0);
  });

  test('章魚離玩家太近會退開', () => {
    expect(simulate('octopus', 100, { targetX: 450 })[0].vx).toBeGreaterThan(0);
  });

  test('河豚被打到膨脹 1.5 秒,膨脹時子彈全彈開;消氣後 1 秒內不會再膨脹', () => {
    let brain: EnemyBrain = { ...initialBrain('puffer'), timerMs: 2000 };
    brain = pufferHit(brain);
    expect(brain.phase).toBe('puff');
    expect(bulletEffect(ENEMY_DEFS.puffer, -1, -600, 0, true)).toBe('blocked');
    expect(bulletEffect(ENEMY_DEFS.puffer, -1, -600, 0, false)).toBe('hit');
    for (let t = 0; t <= PUFF_MS; t += 50) brain = stepEnemy('puffer', brain, sense()).brain;
    expect(brain.phase).toBe('swim');
    expect(pufferHit(brain).phase).toBe('swim');
    for (let t = 0; t < 1100; t += 50) brain = stepEnemy('puffer', brain, sense()).brain;
    expect(pufferHit(brain).phase).toBe('puff');
  });
});

describe('失眠寄居蟹', () => {
  const s = (over: Partial<CrabSense> = {}): CrabSense => ({ x: 700, hpRatio: 1, targetX: 300, targetY: 440, mouthY: 450, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  function run(ms: number, over: Partial<CrabSense> = {}) {
    let brain = initialCrabBrain();
    const steps = [];
    for (let t = 0; t < ms; t += 50) {
      const st = stepCrab(brain, s(over));
      brain = st.brain;
      steps.push(st);
    }
    return steps;
  }

  test('走一走 → 縮殼滑過來(打不動)→ 休息 → 走 → 吐泡泡', () => {
    const steps = run(CRAB_WALK_MS * 2 + CRAB_SHELL_MS + 3000);
    const shell = steps.filter((x) => x.armored);
    expect(shell.length).toBeGreaterThanOrEqual(CRAB_SHELL_MS / 50 - 1);
    expect(shell[0].vx).toBeLessThan(0);
    const bubbles = steps.find((x) => x.bubbles.length > 0)!;
    expect(bubbles.bubbles).toHaveLength(3);
    expect(steps.indexOf(bubbles)).toBeGreaterThan(steps.indexOf(shell[0]));
  });

  test('血量一半以下泡泡五顆', () => {
    expect(run(9000, { hpRatio: 0.4 }).find((x) => x.bubbles.length > 0)!.bubbles).toHaveLength(5);
  });

  test('縮殼滑到畫面邊緣會反彈', () => {
    const brain = { ...initialCrabBrain(), mode: 'shell' as const, facing: -1 as const };
    expect(stepCrab(brain, s({ x: ENEMY_DEFS.hermitCrab.w / 2 })).vx).toBeGreaterThan(0);
  });
});

describe('熬夜電鰻', () => {
  const s = (over: Partial<EelSense> = {}): EelSense => ({ x: 600, y: 200, hpRatio: 1, targetY: 300, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  test('游 → 預告細線 → 沿著同一條線放電 → 換高度再游', () => {
    let brain = initialEelBrain();
    const steps = [];
    for (let t = 0; t < EEL_SWIM_MS + EEL_CHARGE_MS + EEL_ZAP_MS + 200; t += 50) {
      const st = stepEel(brain, s());
      brain = st.brain;
      steps.push(st);
    }
    const warn = steps.find((x) => x.warn.length > 0)!;
    const zap = steps.find((x) => x.zap.length > 0)!;
    expect(warn.warn).toEqual([300]);
    expect(zap.zap).toEqual([300]);
    expect(steps.indexOf(zap) - steps.indexOf(warn)).toBeGreaterThanOrEqual(EEL_CHARGE_MS / 50 - 1);
    expect(steps.filter((x) => x.zap.length > 0).length).toBeGreaterThanOrEqual(EEL_ZAP_MS / 50 - 1);
    expect(brain.laneY).not.toBe(initialEelBrain().laneY);
  });

  test('血量一半以下兩道電流,都在範圍內', () => {
    expect(eelBeams(300, 0.4)).toEqual([300, 160]);
    expect(eelBeams(120, 0.4)).toEqual([120, 260]);
    for (const y of [-50, 1000]) for (const b of eelBeams(y, 0.2)) expect(b >= BEAM_MIN_Y && b <= BEAM_MAX_Y).toBe(true);
  });

  test('游到邊緣轉身', () => {
    expect(stepEel(initialEelBrain(), s({ x: ENEMY_DEFS.eel.w / 2 })).vx).toBeGreaterThan(0);
  });
});

describe('尼斯湖水怪', () => {
  const s = (over: Partial<NessieSense> = {}): NessieSense => ({
    x: 850, y: 260, hpRatio: 1, targetX: 300, targetY: 300, homeX: 850, homeY: 260, leftX: 100, mouthX: 790, mouthY: 220, minionsAlive: 0, timeMs: 0, dtMs: 50, ...over,
  });

  test('先衝撞:預告後沿著玩家的高度往左衝,衝到底再游回來', () => {
    let brain: NessieBrain = initialNessieBrain();
    let x = 850;
    const modes = new Set<string>();
    for (let t = 0; t < 8000; t += 50) {
      const st = stepNessie(brain, s({ x }));
      brain = st.brain;
      x += (st.vx * 50) / 1000;
      modes.add(brain.mode);
      if (brain.mode === 'charge') expect(st.vx).toBeLessThan(-400);
    }
    expect([...modes]).toEqual(expect.arrayContaining(['windup', 'charge', 'return', 'idle']));
    expect(brain.laneY).toBe(300);
  });

  test('衝撞的高度夾在範圍內', () => {
    const brain = { ...initialNessieBrain(), timerMs: 5000 };
    expect(stepNessie(brain, s({ targetY: 30 })).brain.laneY).toBe(LANE_MIN_Y);
    expect(stepNessie(brain, s({ targetY: 600 })).brain.laneY).toBe(LANE_MAX_Y);
  });

  test('第二招泡泡扇朝玩家;第一階段第三招也是泡泡,第二階段起叫小丑魚', () => {
    const b1 = { ...initialNessieBrain(), attacks: 1, timerMs: 5000 };
    const st = stepNessie(b1, s());
    expect(st.bubbles).toHaveLength(5);
    expect(st.bubbles.every((b) => b.vx < 0)).toBe(true);
    expect(stepNessie({ ...b1, attacks: 2 }, s()).summon).toBe(false);
    const b2 = { ...initialNessieBrain(), phase: 2 as const, attacks: 2, timerMs: 5000 };
    expect(stepNessie(b2, s({ hpRatio: 0.5 })).summon).toBe(true);
    expect(stepNessie(b2, s({ hpRatio: 0.5, minionsAlive: 4 })).summon).toBe(false);
  });

  test('換階段只在待命時發生(不會衝到一半停下),發抖時打不動', () => {
    const charging = { ...initialNessieBrain(), mode: 'charge' as const };
    expect(stepNessie(charging, s({ hpRatio: 0.5, x: 500 })).enteredPhase).toBeNull();
    const st = stepNessie(initialNessieBrain(), s({ hpRatio: 0.5 }));
    expect(st.enteredPhase).toBe(2);
    expect(st.invulnerable).toBe(true);
  });

  test('第三階段衝兩次', () => {
    let brain: NessieBrain = { ...initialNessieBrain(), phase: 3 };
    let x = 850;
    let charges = 0;
    for (let t = 0; t < 9000 && brain.attacks < 2; t += 50) {
      const before = brain.mode;
      const st = stepNessie(brain, s({ x, hpRatio: 0.2 }));
      brain = st.brain;
      x += (st.vx * 50) / 1000;
      if (before !== 'charge' && brain.mode === 'charge') charges += 1;
    }
    expect(charges).toBe(2);
    expect(NESSIE_WINDUP_MS).toBeGreaterThan(500);
  });
});
