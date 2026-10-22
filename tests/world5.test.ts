import { describe, test, expect } from 'vitest';
import { ERUPT_FIRST_MS, ERUPT_MS, ERUPT_SIDE, freshEruption, onLava, stepEruption, type EruptionState } from '../src/game/lava';
import { HIPPO_WINDUP_MS, STEAM_HIGH_Y, STEAM_LOW_Y, initialHippoBrain, stepHippo, type HippoBrain, type HippoSense } from '../src/game/hippo';
import { SNAIL_CRAWL_MS, SNAIL_SHELL_MS, SNAIL_WINDUP_MS, initialSnailBrain, snailTargets, stepSnail, type SnailBrain, type SnailSense } from '../src/game/snail';
import { DRAGON_WINDUP_MS, initialDragonBrain, stepDragon, type DragonBrain, type DragonSense } from '../src/game/dragon';
import { ENEMY_DEFS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';
import { GROUND_Y } from '../src/levels/levelDef';
import { STAND_HITBOX } from '../src/game/playerMotor';

describe('熔岩', () => {
  test('踩在熔岩中間才算,腳尖碰到邊緣不算', () => {
    expect(onLava(150, [{ x: 100, w: 100 }])).toBe(true);
    expect(onLava(103, [{ x: 100, w: 100 }])).toBe(false);
    expect(onLava(250, [{ x: 100, w: 100 }])).toBe(false);
  });
});

describe('火山噴發', () => {
  const zones = [{ x: 1000, w: 800 }];
  const run = (ms: number, xs: number[], st: EruptionState = freshEruption()): { st: EruptionState; rocks: number[][] } => {
    const rocks: number[][] = [];
    for (let t = 0; t < ms; t += 50) {
      const r = stepEruption(st, zones, xs, 50);
      st = r.state;
      if (r.rocks.length) rocks.push(r.rocks);
    }
    return { st, rocks };
  };

  test('不在噴發區裡不會噴發', () => {
    expect(run(10000, [500]).rocks).toHaveLength(0);
  });

  test('進到區裡 1 秒後第一次噴發,之後每 2.8 秒一次;一顆對準玩家、一顆在旁邊', () => {
    expect(run(ERUPT_FIRST_MS - 50, [1400]).rocks).toHaveLength(0);
    const { rocks } = run(ERUPT_FIRST_MS + ERUPT_MS, [1400]);
    expect(rocks).toHaveLength(2);
    expect(rocks[0]).toEqual([1400, 1400 + ERUPT_SIDE]);
    expect(rocks[1]).toEqual([1400, 1400 - ERUPT_SIDE]);
  });

  test('石頭夾在噴發區裡;玩家在邊上時旁邊那顆掉另一邊', () => {
    const { rocks } = run(ERUPT_FIRST_MS, [1790]);
    expect(rocks[0]).toEqual([1790, 1790 - ERUPT_SIDE]);
  });

  test('離開噴發區就重新計時', () => {
    const { st } = run(ERUPT_FIRST_MS - 100, [1400]);
    const out = stepEruption(st, zones, [500], 50).state;
    expect(out.timerMs).toBe(freshEruption().timerMs);
    // 噴發次數不會歸零。
    expect(stepEruption({ timerMs: 0, count: 3 }, zones, [500], 50).state.count).toBe(3);
  });
});

describe('世界 5 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 456, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('火蜥蜴爬過來,每隔一陣子快速竄一下', () => {
    let brain = initialBrain('salamander');
    const speeds: number[] = [];
    for (let t = 0; t < 4000; t += 50) {
      const m = stepEnemy('salamander', brain, sense());
      brain = m.brain;
      speeds.push(Math.abs(m.vx));
    }
    expect(Math.max(...speeds)).toBeGreaterThan(Math.min(...speeds.filter((v) => v > 0)) * 3);
  });

  test('熔岩團子一跳一跳,跳得比木乃伊貓高', () => {
    let brain = initialBrain('lavaBlob');
    const jumps: number[] = [];
    for (let t = 0; t < 2000; t += 50) {
      const m = stepEnemy('lavaBlob', brain, sense());
      brain = m.brain;
      if (m.vy !== null) jumps.push(m.vy);
    }
    expect(jumps.length).toBeGreaterThan(0);
    let cat = initialBrain('mummyCat');
    let catVy = 0;
    for (let t = 0; t < 2000 && catVy === 0; t += 50) {
      const m = stepEnemy('mummyCat', cat, sense());
      cat = m.brain;
      if (m.vy !== null) catVy = m.vy;
    }
    expect(Math.min(...jumps)).toBeLessThan(catVy);
  });

  test('火山鳥俯衝最低點蹲下閃得過;犰狳有岩石盾、會縮成球滾', () => {
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.volcanoBird.h / 2).toBeLessThanOrEqual(452 + 2);
    expect(ENEMY_DEFS.armadillo.shield).toBe(true);
    let brain = initialBrain('armadillo');
    const phases = new Set<string>();
    for (let t = 0; t < 5000; t += 50) {
      const m = stepEnemy('armadillo', brain, sense());
      brain = m.brain;
      phases.add(brain.phase);
    }
    expect(phases.has('roll')).toBe(true);
  });
});

describe('失眠溫泉河馬', () => {
  const sense = (over: Partial<HippoSense> = {}): HippoSense => ({ grounded: true, hpRatio: 1, targetX: 300, dtMs: 50, ...over });
  const until = (b: HippoBrain, s: HippoSense, mode: string): { brain: HippoBrain; steps: ReturnType<typeof stepHippo>[] } => {
    const steps = [];
    for (let i = 0; i < 400 && b.mode !== mode; i++) {
      const r = stepHippo(b, s);
      steps.push(r);
      b = r.brain;
    }
    return { brain: b, steps };
  };

  test('泡在溫泉裡等一下 → 預告 → 噴 3 團蒸氣,有低有高', () => {
    let b = initialHippoBrain();
    b = until(b, sense(), 'windup').brain;
    const { steps } = until(b, sense(), 'idle');
    const steam = steps.flatMap((r) => r.steam);
    expect(steam).toHaveLength(3);
    expect(steam.some((c) => c.y === STEAM_LOW_Y)).toBe(true);
    expect(steam.some((c) => c.y === STEAM_HIGH_Y)).toBe(true);
    // 高的蒸氣(圖 28 高)底部在站著的玩家頭上;低的蒸氣碰得到站著的玩家。
    expect(STEAM_HIGH_Y + 14).toBeLessThan(GROUND_Y - STAND_HITBOX.h);
    expect(STEAM_LOW_Y - 14).toBeGreaterThan(GROUND_Y - STAND_HITBOX.h);
  });

  test('下一招跳起來,落地往左右送出震波;血量一半以下蒸氣 5 團、震波兩道', () => {
    let b: HippoBrain = { mode: 'windup', timerMs: HIPPO_WINDUP_MS, steamNext: false };
    const r = stepHippo(b, sense());
    expect(r.vy).toBeLessThan(0);
    b = r.brain;
    expect(b.mode).toBe('hop');
    for (let i = 0; i < 6; i++) b = stepHippo(b, sense({ grounded: false })).brain;
    const land = stepHippo(b, sense({ grounded: true }));
    expect(land.waves.map((w) => w.dir).sort()).toEqual([-1, 1]);
    expect(land.brain.steamNext).toBe(true);

    const angryLand = stepHippo(b, sense({ grounded: true, hpRatio: 0.4 }));
    expect(angryLand.waves).toHaveLength(4);
    const angrySteam = stepHippo({ mode: 'windup', timerMs: HIPPO_WINDUP_MS, steamNext: true }, sense({ hpRatio: 0.4 }));
    expect(angrySteam.steam).toHaveLength(5);
  });
});

describe('熬夜火山蝸牛', () => {
  const sense = (over: Partial<SnailSense> = {}): SnailSense => ({
    x: 800,
    hpRatio: 1,
    targetX: 300,
    ventX: 810,
    ventY: 380,
    arenaLeft: 0,
    arenaRight: 960,
    dtMs: 50,
    ...over,
  });

  test('慢慢爬向玩家 → 預告 → 噴 3 顆熔岩球往上再落下,同時縮進殼裡(打不動)→ 再爬', () => {
    let b: SnailBrain = initialSnailBrain();
    const r0 = stepSnail(b, sense());
    expect(r0.vx).toBeLessThan(0);
    expect(r0.armored).toBe(false);
    b = stepSnail({ ...b, timerMs: SNAIL_CRAWL_MS }, sense()).brain;
    expect(b.mode).toBe('windup');
    const fire = stepSnail({ ...b, timerMs: SNAIL_WINDUP_MS }, sense());
    expect(fire.lavaBalls).toHaveLength(3);
    for (const ball of fire.lavaBalls) expect(ball.vy).toBeLessThan(0);
    expect(fire.armored).toBe(true);
    b = fire.brain;
    expect(stepSnail(b, sense()).armored).toBe(true);
    b = stepSnail({ ...b, timerMs: SNAIL_SHELL_MS }, sense()).brain;
    expect(b.mode).toBe('crawl');
  });

  test('熔岩球散在玩家周圍、不出畫面;血量一半以下 5 顆', () => {
    expect(snailTargets(3, 300, 20, 940)).toEqual([190, 300, 410]);
    expect(Math.min(...snailTargets(5, 30, 20, 940))).toBe(20);
    const fire = stepSnail({ mode: 'windup', timerMs: SNAIL_WINDUP_MS, facing: -1 }, sense({ hpRatio: 0.4 }));
    expect(fire.lavaBalls).toHaveLength(5);
  });
});

describe('熬夜火龍', () => {
  const sense = (over: Partial<DragonSense> = {}): DragonSense => ({
    x: 9900,
    hpRatio: 1,
    targetX: 9500,
    targetY: 440,
    mouthX: 9850,
    mouthY: 330,
    arenaLeft: 9240,
    arenaRight: 10200,
    minionsAlive: 0,
    dtMs: 50,
    ...over,
  });
  /** 跑到下一招放出來為止,回傳放出的東西。 */
  const nextAttack = (b: DragonBrain, s: DragonSense): { brain: DragonBrain; r: ReturnType<typeof stepDragon> } => {
    for (let i = 0; i < 400; i++) {
      const was = b.mode;
      const r = stepDragon(b, s);
      b = r.brain;
      if (was === 'windup' && b.mode === 'idle') return { brain: b, r };
    }
    throw new Error('沒有出招');
  };

  test('第一階段:吐 3 顆火球 → 火山噴發 3 顆落石(一顆對準玩家)→ 再吐火球(不噴火)', () => {
    let b = initialDragonBrain();
    let a = nextAttack(b, sense());
    expect(a.r.fireballs).toHaveLength(3);
    b = a.brain;
    a = nextAttack(b, sense());
    expect(a.r.rocks).toHaveLength(3);
    expect(a.r.rocks).toContain(9500);
    b = a.brain;
    a = nextAttack(b, sense());
    expect(a.r.fireballs).toHaveLength(3);
    expect(a.r.flames).toHaveLength(0);
  });

  test('換階段發抖打不動;第三階段噴火連續兩道往玩家那邊、每兩招叫火蜥蜴', () => {
    const angry = stepDragon(initialDragonBrain(), sense({ hpRatio: 0.3 }));
    expect(angry.invulnerable).toBe(true);
    expect(angry.enteredPhase).toBe(3);
    const b: DragonBrain = { mode: 'windup', timerMs: DRAGON_WINDUP_MS, phase: 3, attacks: 3, pending: 'breath' };
    const breath = stepDragon(b, sense({ hpRatio: 0.3 }));
    expect(breath.flames).toHaveLength(2);
    for (const f of breath.flames) expect(f.dir).toBe(-1);
    const idle: DragonBrain = { mode: 'idle', timerMs: 5000, phase: 2, attacks: 1, pending: 'fireballs' };
    expect(stepDragon(idle, sense({ hpRatio: 0.5 })).summon).toBe(true);
    expect(stepDragon(idle, sense({ hpRatio: 0.5, minionsAlive: 3 })).summon).toBe(false);
  });
});
