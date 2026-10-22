import { describe, test, expect } from 'vitest';
import { BEAST_H, BEAST_W, HERD_EVERY_MS, HERD_FIRST_MS, HERD_OFFSETS, HERD_SPEED, HERD_WARN_MS, beastHits, freshStampede, stepStampede, type StampedeState } from '../src/game/stampede';
import { GIRAFFE_KICK_MS, GIRAFFE_WALK_MS, GIRAFFE_WINDUP_MS, KICK_RANGE, SWEEP_HIGH_Y, SWEEP_LOW_Y, initialGiraffeBrain, stepGiraffe, type GiraffeBrain, type GiraffeSense } from '../src/game/giraffe';
import { ELEPHANT_WINDUP_MS, JET_Y, initialElephantBrain, stepElephant, type ElephantBrain, type ElephantSense } from '../src/game/elephant';
import { LION_WINDUP_MS, ROAR_HIGH_Y, ROAR_LOW_Y, initialLionBrain, stepLion, type LionBrain, type LionSense } from '../src/game/lion';
import { ENEMY_DEFS, MEERKAT_BURROW_MS, MEERKAT_RUN_MS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { CROUCH_HITBOX, STAND_HITBOX } from '../src/game/playerMotor';
import { GROUND_Y } from '../src/levels/levelDef';

describe('獸群奔跑', () => {
  const zones = [{ x: 1000, w: 800 }];
  const run = (ms: number, xs: number[], st: StampedeState = freshStampede()) => {
    const warns: number[] = [];
    const releases: number[] = [];
    for (let t = 0; t < ms; t += 50) {
      const r = stepStampede(st, zones, xs, 50);
      st = r.state;
      if (r.warn !== null) warns.push(t);
      if (r.release !== null) releases.push(t);
    }
    return { st, warns, releases };
  };

  test('不在奔跑區裡不會有獸群', () => {
    expect(run(20000, [500]).warns).toHaveLength(0);
  });

  test('進區 1.5 秒後開始預告,預告 1.2 秒才衝過來;之後每 7 秒一群', () => {
    const r = run(HERD_FIRST_MS + HERD_WARN_MS + HERD_EVERY_MS + HERD_WARN_MS + 100, [1400]);
    expect(r.warns).toHaveLength(2);
    expect(r.releases).toHaveLength(2);
    expect(r.releases[0] - r.warns[0]).toBeGreaterThanOrEqual(HERD_WARN_MS - 50);
    expect(r.warns[0]).toBeGreaterThanOrEqual(HERD_FIRST_MS - 100);
  });

  test('預告中走出奔跑區,那一群照樣衝過來', () => {
    const r1 = run(HERD_FIRST_MS + 100, [1400]);
    expect(r1.warns).toHaveLength(1);
    const r2 = run(HERD_WARN_MS + 100, [500], r1.st);
    expect(r2.releases).toHaveLength(1);
  });

  test('角馬兩隻一組,一組一組跳得過:一組很快跑過去,組跟組之間的空檔比跳一次還久', () => {
    const t = DEFAULT_TUNING;
    const air = (2 * t.jumpVelocity) / t.gravity;
    // 跳起來腳高過角馬頭頂的時間。
    const h = BEAST_H + 4;
    const disc = t.jumpVelocity ** 2 - 2 * t.gravity * h;
    const above = (2 * Math.sqrt(disc)) / t.gravity;
    const groupPass = (HERD_OFFSETS[1] - HERD_OFFSETS[0] + BEAST_W + STAND_HITBOX.w) / HERD_SPEED;
    const gap = (HERD_OFFSETS[2] - HERD_OFFSETS[1] - BEAST_W - STAND_HITBOX.w) / HERD_SPEED;
    expect(groupPass).toBeLessThan(above);
    expect(gap).toBeGreaterThan(air);
  });

  test('撞到判定:站在地上被撞到,跳過頭頂或站在平台上不會', () => {
    expect(beastHits(500, GROUND_Y, 505, GROUND_Y - 48, GROUND_Y, 14)).toBe(true);
    expect(beastHits(500, GROUND_Y, 505, GROUND_Y - BEAST_H - 60, GROUND_Y - BEAST_H - 12, 14)).toBe(false);
    expect(beastHits(500, GROUND_Y, 600, GROUND_Y - 48, GROUND_Y, 14)).toBe(false);
  });
});

describe('世界 7 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 456, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('狐獴跑一段就躲進地洞,一陣子後冒出來', () => {
    let brain = initialBrain('meerkat');
    const phases: string[] = [];
    for (let t = 0; t < MEERKAT_RUN_MS + MEERKAT_BURROW_MS + 400; t += 50) {
      const m = stepEnemy('meerkat', brain, sense());
      brain = m.brain;
      phases.push(brain.phase);
      if (brain.phase === 'burrow') expect(m.vx).toBe(0);
    }
    expect(phases).toContain('burrow');
    expect(phases[phases.length - 1]).toBe('walk');
  });

  test('疣豬會衝;犀鳥俯衝最低點蹲下閃得過;犀牛正面有角擋子彈、會衝撞', () => {
    let w = initialBrain('warthog');
    const speeds: number[] = [];
    for (let t = 0; t < 3000; t += 50) {
      const m = stepEnemy('warthog', w, sense());
      w = m.brain;
      speeds.push(Math.abs(m.vx));
    }
    expect(Math.max(...speeds)).toBeGreaterThan(250);
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.hornbill.h / 2).toBeLessThanOrEqual(452 + 2);
    expect(ENEMY_DEFS.rhino.shield).toBe(true);
    let r = initialBrain('rhino');
    const phases = new Set<string>();
    for (let t = 0; t < 5000; t += 50) {
      r = stepEnemy('rhino', r, sense()).brain;
      phases.add(r.phase);
    }
    expect(phases.has('roll')).toBe(true);
  });
});

describe('失眠長頸鹿', () => {
  const sense = (over: Partial<GiraffeSense> = {}): GiraffeSense => ({ x: 800, hpRatio: 1, targetX: 300, dtMs: 50, ...over });

  test('脖子橫掃高低輪流:高的從站著的人頭上掃過去,低的要跳(蹲下也躲不過)', () => {
    const b: GiraffeBrain = { ...initialGiraffeBrain(), mode: 'windup', timerMs: GIRAFFE_WINDUP_MS };
    const first = stepGiraffe(b, sense());
    expect(first.sweeps).toHaveLength(1);
    expect(first.sweeps[0].y).toBe(SWEEP_HIGH_Y);
    expect(first.sweeps[0].dir).toBe(-1);
    const second = stepGiraffe({ ...first.brain, mode: 'windup', timerMs: GIRAFFE_WINDUP_MS }, sense());
    expect(second.sweeps[0].y).toBe(SWEEP_LOW_Y);
    const half = 8;
    expect(SWEEP_HIGH_Y + half).toBeLessThan(GROUND_Y - STAND_HITBOX.h);
    // 低的掃到蹲著的人(蹲下也躲不過)。
    expect(SWEEP_LOW_Y + half).toBeGreaterThan(GROUND_Y - CROUCH_HITBOX.h);
  });

  test('血量一半以下高低連掃兩下;走滿 1.8 秒才出招', () => {
    const b: GiraffeBrain = { ...initialGiraffeBrain(), mode: 'windup', timerMs: GIRAFFE_WINDUP_MS };
    expect(stepGiraffe(b, sense({ hpRatio: 0.4 })).sweeps.map((s) => s.y)).toEqual([SWEEP_HIGH_Y, SWEEP_LOW_Y]);
    expect(stepGiraffe({ ...initialGiraffeBrain(), timerMs: GIRAFFE_WALK_MS - 100 }, sense()).brain.mode).toBe('walk');
  });

  test('玩家靠太近就蹬一下,踢完下一招一定是橫掃(不會一直踢)', () => {
    let b = stepGiraffe(initialGiraffeBrain(), sense({ targetX: 800 - KICK_RANGE + 20 })).brain;
    expect(b.mode).toBe('windup');
    expect(b.sweep).toBe(false);
    const kick = stepGiraffe({ ...b, timerMs: GIRAFFE_WINDUP_MS }, sense({ targetX: 700 }));
    expect(kick.brain.mode).toBe('kick');
    b = stepGiraffe({ ...kick.brain, timerMs: GIRAFFE_KICK_MS }, sense({ targetX: 700 })).brain;
    expect(b.kicked).toBe(true);
    b = stepGiraffe({ ...b, mode: 'walk', timerMs: 0 }, sense({ targetX: 700 })).brain;
    expect(b.mode).toBe('walk');
  });
});

describe('熬夜大象', () => {
  const sense = (over: Partial<ElephantSense> = {}): ElephantSense => ({ x: 800, hpRatio: 1, targetX: 300, dtMs: 50, ...over });

  test('噴一串 6 發水柱(蹲下躲得過、站著會被打到);下一招跺腳往左右送出震波', () => {
    let b: ElephantBrain = { ...initialElephantBrain(), mode: 'windup', timerMs: ELEPHANT_WINDUP_MS };
    b = stepElephant(b, sense()).brain;
    expect(b.mode).toBe('spray');
    let jets = 0;
    for (let i = 0; i < 60 && b.mode === 'spray'; i++) {
      const r = stepElephant(b, sense());
      if (r.jet !== null) jets++;
      b = r.brain;
    }
    expect(jets).toBe(6);
    const half = 7;
    expect(JET_Y + half).toBeGreaterThan(GROUND_Y - STAND_HITBOX.h);
    expect(JET_Y + half).toBeLessThan(GROUND_Y - CROUCH_HITBOX.h);
    expect(b.sprayNext).toBe(false);
    const stomp = stepElephant({ ...b, mode: 'windup', timerMs: ELEPHANT_WINDUP_MS }, sense());
    expect(stomp.waves.map((w) => w.dir).sort()).toEqual([-1, 1]);
    expect(stepElephant({ ...b, mode: 'windup', timerMs: ELEPHANT_WINDUP_MS }, sense({ hpRatio: 0.4 })).waves).toHaveLength(4);
  });
});

describe('失眠獅子王', () => {
  const sense = (over: Partial<LionSense> = {}): LionSense => ({
    x: 10070,
    grounded: true,
    hpRatio: 1,
    targetX: 9500,
    homeX: 10070,
    halfW: 75,
    arenaLeft: 9240,
    arenaRight: 10200,
    minionsAlive: 0,
    dtMs: 50,
    ...over,
  });

  test('獅吼:音波有高有低(高的站著不動、低的跳過)', () => {
    const r = stepLion({ ...initialLionBrain(), mode: 'windup', timerMs: LION_WINDUP_MS, pending: 'roar' }, sense());
    expect(r.roars).toHaveLength(3);
    expect(r.roars.map((x) => x.y)).toEqual(expect.arrayContaining([ROAR_LOW_Y, ROAR_HIGH_Y]));
  });

  test('第一階段不叫獸群;第二階段起輪到時叫角馬群,每兩招叫一隻疣豬', () => {
    const p1: LionBrain = { ...initialLionBrain(), timerMs: 5000, attacks: 2 };
    expect(stepLion(p1, sense()).brain.pending).toBe('roar');
    const p2: LionBrain = { ...initialLionBrain(), timerMs: 5000, attacks: 2, phase: 2 };
    const pick = stepLion(p2, sense({ hpRatio: 0.5 }));
    expect(pick.brain.pending).toBe('stampede');
    const go = stepLion({ ...pick.brain, timerMs: LION_WINDUP_MS }, sense({ hpRatio: 0.5 }));
    expect(go.stampede).toBe(true);
    const odd: LionBrain = { ...initialLionBrain(), timerMs: 5000, attacks: 1, phase: 2 };
    expect(stepLion(odd, sense({ hpRatio: 0.5 })).summon).toBe(true);
  });

  test('撲過來:落點夾在畫面裡,落地往左右送出震波再走回去;換階段打不動', () => {
    const r = stepLion({ ...initialLionBrain(), mode: 'windup', timerMs: LION_WINDUP_MS, pending: 'pounce' }, sense({ targetX: 9000 }));
    expect(r.brain.mode).toBe('leap');
    expect(r.vx).toBeCloseTo((9240 + 75 - 10070) / 0.95);
    let b = r.brain;
    for (let i = 0; i < 6; i++) b = stepLion(b, sense({ grounded: false })).brain;
    const land = stepLion(b, sense({ grounded: true, x: 9400 }));
    expect(land.waves).toEqual([-1, 1]);
    expect(land.brain.mode).toBe('return');
    const angry = stepLion(initialLionBrain(), sense({ hpRatio: 0.6 }));
    expect(angry.invulnerable).toBe(true);
    expect(angry.enteredPhase).toBe(2);
  });
});
