import { describe, test, expect } from 'vitest';
import { MOCHI_GRAVITY, RABBIT_WALK_MS, RABBIT_WINDUP_MS, initialRabbitBrain, stepRabbit, type RabbitBrain, type RabbitSense } from '../src/game/rabbit';
import { DART_GAP_MS, DART_HIGH_Y, DART_LOW_Y, DART_SPEED, PEACOCK_WALK_MS, PEACOCK_WINDUP_MS, REVERSE_MS, initialPeacockBrain, reverseIntent, stepPeacock, type PeacockBrain, type PeacockSense } from '../src/game/peacock';
import { INHALE_MS, INHALE_PULL, MIST_GAP_MS, NIGHTMARE_CHARGE_MS, NIGHTMARE_HEARTS, NIGHTMARE_SAFE_HALF_W, MIST_HIGH_Y, MIST_LOW_Y, MIST_SPEED, TAPIR_SCALE, TAPIR_WINDUP_MS, initialTapirBrain, stepTapir, type TapirBrain, type TapirSense } from '../src/game/tapir';
import { ENEMY_DEFS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';
import { CROUCH_HITBOX, STAND_HITBOX } from '../src/game/playerMotor';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { GROUND_Y } from '../src/levels/levelDef';
import { summaryLines, newRunStats } from '../src/game/runStats';

/** 子彈圖的高度(羽毛飛鏢 14、惡夢雲 28)。 */
const DART_H = 14;
const MIST_H = 28;
/** 跳一次在空中多久(秒)。 */
const AIR_S = (2 * DEFAULT_TUNING.jumpVelocity) / DEFAULT_TUNING.gravity;

/**
 * 只會站著或原地跳的玩家,離出手的地方 d 時,一排子彈(同樣速度、依序出手)躲不躲得掉:
 * 每支低的都要跳,而且低的到的時候不能還在空中掉不下來接著碰到高的——相鄰兩支到達的時間差要比在空中的時間長。
 */
function volleyDodgeable(shots: readonly { delayMs: number }[], speed: number): boolean {
  const arrive = shots.map((x) => x.delayMs / 1000).sort((a, b) => a - b);
  return arrive.every((t, i) => i === 0 || t - arrive[i - 1] > AIR_S + 0.05) && speed > 0;
}

describe('世界 10 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 456, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('枕頭兵走一走會衝一下;吵鬧小星星俯衝最低點蹲下閃得過', () => {
    let b = initialBrain('pillowSoldier');
    const phases = new Set<string>();
    for (let t = 0; t < 4000; t += 50) {
      b = stepEnemy('pillowSoldier', b, sense()).brain;
      phases.add(b.phase);
    }
    expect(phases.has('dash')).toBe(true);
    expect(ENEMY_DEFS.noisyStar.flying).toBe(true);
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.noisyStar.h / 2).toBeLessThanOrEqual(GROUND_Y - CROUCH_HITBOX.h);
  });

  test('茶壺精靈停在一段距離外,倒出拋物線的咖啡', () => {
    let b = initialBrain('teapot');
    let poured = false;
    for (let t = 0; t < 4000; t += 50) {
      const r = stepEnemy('teapot', b, sense({ targetX: 300 }));
      b = r.brain;
      expect(r.vx).toBe(0);
      if (r.spit) poured = true;
    }
    expect(poured).toBe(true);
  });

  test('大鐘守衛有盾、慢慢走、不衝,轉身很慢', () => {
    expect(ENEMY_DEFS.clockGuard.shield).toBe(true);
    expect(ENEMY_DEFS.clockGuard.tier).toBe('mid');
    let b = initialBrain('clockGuard');
    for (let t = 0; t < 6000; t += 50) {
      b = stepEnemy('clockGuard', b, sense()).brain;
      expect(b.phase).toBe('walk');
    }
    // 玩家跑到背後:1 秒後還沒轉過來。
    b = { ...b, facing: -1, turnMs: 0 };
    for (let t = 0; t < 1000; t += 50) b = stepEnemy('clockGuard', b, sense({ targetX: 800 })).brain;
    expect(b.facing).toBe(-1);
  });
});

describe('失眠月兔', () => {
  const sense = (over: Partial<RabbitSense> = {}): RabbitSense => ({ x: 700, hpRatio: 1, targetX: 300, targetY: 456, handX: 650, handY: 430, dtMs: 50, ...over });
  const run = (b: RabbitBrain, ms: number, over: Partial<RabbitSense> = {}) => {
    const waves: unknown[] = [];
    const mochi: { vx: number; vy: number }[] = [];
    for (let t = 0; t < ms; t += 50) {
      const r = stepRabbit(b, sense(over));
      b = r.brain;
      waves.push(...r.waves);
      mochi.push(...r.mochi);
    }
    return { b, waves, mochi };
  };

  test('輪流:先木槌敲地(左右兩道震波),再丟麻糬(2 顆,往玩家拋過去)', () => {
    const first = run(initialRabbitBrain(), RABBIT_WALK_MS + RABBIT_WINDUP_MS + 100);
    expect(first.waves).toHaveLength(2);
    expect(first.mochi).toHaveLength(0);
    const second = run(first.b, 700 + RABBIT_WALK_MS + RABBIT_WINDUP_MS + 100);
    expect(second.mochi).toHaveLength(2);
    for (const m of second.mochi) {
      expect(m.vx).toBeLessThan(0);
      expect(m.vy).toBeLessThan(0);
    }
    // 第一顆直直丟向玩家:飛到玩家的 x 時剛好在玩家的高度。
    const m = second.mochi[0];
    const t = (300 - 650) / m.vx;
    expect(430 + m.vy * t + 0.5 * MOCHI_GRAVITY * t * t).toBeCloseTo(456, 0);
    expect(MOCHI_GRAVITY).toBeGreaterThan(0);
  });

  test('血量一半以下:震波兩道(延後第二波)、麻糬 3 顆', () => {
    const slam = run(initialRabbitBrain(), RABBIT_WALK_MS + RABBIT_WINDUP_MS + 100, { hpRatio: 0.4 });
    expect(slam.waves).toHaveLength(4);
    const toss = run(slam.b, 700 + RABBIT_WALK_MS + RABBIT_WINDUP_MS + 100, { hpRatio: 0.4 });
    expect(toss.mochi).toHaveLength(3);
  });
});

describe('熬夜孔雀', () => {
  const sense = (over: Partial<PeacockSense> = {}): PeacockSense => ({ x: 700, hpRatio: 1, targetX: 300, dtMs: 50, ...over });
  const run = (b: PeacockBrain, ms: number, over: Partial<PeacockSense> = {}) => {
    let fans = 0;
    const darts: { y: number; dir: number; delayMs: number }[] = [];
    for (let t = 0; t < ms; t += 50) {
      const r = stepPeacock(b, sense(over));
      b = r.brain;
      if (r.fan) fans += 1;
      darts.push(...r.darts);
    }
    return { b, fans, darts };
  };

  test('先開屏(左右顛倒),再射 3 支有高有低的羽毛飛鏢;一半血以下 5 支', () => {
    const first = run(initialPeacockBrain(), PEACOCK_WALK_MS + PEACOCK_WINDUP_MS + 100);
    expect(first.fans).toBe(1);
    const second = run(first.b, 700 + PEACOCK_WALK_MS + PEACOCK_WINDUP_MS + 100);
    expect(second.darts).toHaveLength(3);
    expect(second.darts.every((d) => d.dir === -1)).toBe(true);
    expect(new Set(second.darts.map((d) => d.y)).size).toBe(2);
    const angry = run(run(initialPeacockBrain(), PEACOCK_WALK_MS + PEACOCK_WINDUP_MS + 100).b, 700 + PEACOCK_WALK_MS + PEACOCK_WINDUP_MS + 100, { hpRatio: 0.4 });
    expect(angry.darts).toHaveLength(5);
    expect(REVERSE_MS).toBe(2500);
    // 一支一支來,跳一次的時間內不會連來兩支(站著或原地跳就躲得掉)。
    expect(volleyDodgeable(angry.darts, DART_SPEED)).toBe(true);
    expect(DART_GAP_MS / 1000).toBeGreaterThan(AIR_S);
  });

  test('高的飛鏢站著從頭上過去;低的蹲下也躲不掉(要跳)', () => {
    expect(DART_HIGH_Y + DART_H / 2).toBeLessThan(GROUND_Y - STAND_HITBOX.h);
    expect(DART_LOW_Y + DART_H / 2).toBeGreaterThan(GROUND_Y - CROUCH_HITBOX.h);
  });

  test('左右顛倒:按左往右、按右往左,其他照常', () => {
    const i = { left: true, right: false, up: true, down: false, jump: true, shoot: false };
    expect(reverseIntent(i)).toEqual({ left: false, right: true, up: true, down: false, jump: true, shoot: false });
  });
});

describe('偷走睡意的夢貘', () => {
  const sense = (over: Partial<TapirSense> = {}): TapirSense => ({ hpRatio: 1, targetX: 9500, minionsAlive: 0, dtMs: 50, ...over });
  const run = (b: TapirBrain, ms: number, over: Partial<TapirSense> = {}) => {
    const mist: { y: number; delayMs: number }[] = [];
    let inhaleMs = 0;
    const summon: string[] = [];
    const starts: { halfW: number; chargeMs: number }[] = [];
    let blasts = 0;
    for (let t = 0; t < ms; t += 50) {
      const r = stepTapir(b, sense(over));
      b = r.brain;
      mist.push(...r.mist);
      if (r.inhaling) inhaleMs += 50;
      summon.push(...r.summon);
      if (r.nightmareStart) starts.push(r.nightmareStart);
      if (r.nightmareBlast) blasts += 1;
    }
    return { b, mist, inhaleMs, summon, starts, blasts };
  };

  test('第一階段:吐 3 團有高有低的惡夢雲、吸 2 秒,第三招改成再吐雲(不叫手下)', () => {
    const r = run(initialTapirBrain(), 3 * (2000 + TAPIR_WINDUP_MS) + INHALE_MS + 2 * 2 * MIST_GAP_MS + 300);
    expect(r.mist.length).toBe(6);
    expect(volleyDodgeable(r.mist.slice(0, 3), MIST_SPEED)).toBe(true);
    expect(new Set(r.mist.map((m) => m.y))).toEqual(new Set([MIST_LOW_Y, MIST_HIGH_Y]));
    expect(r.inhaleMs).toBeGreaterThanOrEqual(INHALE_MS - 100);
    expect(r.summon).toHaveLength(0);
  });

  test('換階段發抖打不動,第二階段起叫枕頭兵與吵鬧小星星(最多 3 隻)', () => {
    let b = initialTapirBrain();
    const r = stepTapir(b, sense({ hpRatio: 0.6 }));
    expect(r.enteredPhase).toBe(2);
    expect(r.invulnerable).toBe(true);
    b = { ...r.brain, mode: 'idle', timerMs: 0, attacks: 2 };
    const s = run(b, 1700 + TAPIR_WINDUP_MS + 100, { hpRatio: 0.6 });
    expect(s.summon).toEqual(['pillowSoldier', 'noisyStar']);
    const full = run({ ...b }, 1700 + TAPIR_WINDUP_MS + 100, { hpRatio: 0.6, minionsAlive: 3 });
    expect(full.summon).toHaveLength(0);
  });

  test('大惡夢:每次換階段放一次(整場兩次),集氣時不吐雲也不吸,第三階段月光更窄、集氣更短', () => {
    const p2 = run(initialTapirBrain(), 12000, { hpRatio: 0.6 });
    expect(p2.starts).toEqual([{ halfW: NIGHTMARE_SAFE_HALF_W[2], chargeMs: NIGHTMARE_CHARGE_MS[2] }]);
    expect(p2.blasts).toBe(1);
    // 發抖 1 秒 + 集氣,這段時間沒有別的招。
    const early = run(initialTapirBrain(), 1000 + NIGHTMARE_CHARGE_MS[2] + 50, { hpRatio: 0.6 });
    expect(early.blasts).toBe(1);
    expect(early.mist).toHaveLength(0);
    expect(early.inhaleMs).toBe(0);
    const p3 = run(p2.b, 12000, { hpRatio: 0.3 });
    expect(p3.starts).toEqual([{ halfW: NIGHTMARE_SAFE_HALF_W[3], chargeMs: NIGHTMARE_CHARGE_MS[3] }]);
    expect(p3.blasts).toBe(1);
    // 同一階段不會再放。
    expect(run(p3.b, 30000, { hpRatio: 0.3 }).blasts).toBe(0);
    expect(run(initialTapirBrain(), 30000).blasts).toBe(0);
    expect(NIGHTMARE_HEARTS).toBe(3);
    expect(NIGHTMARE_SAFE_HALF_W[3]).toBeLessThan(NIGHTMARE_SAFE_HALF_W[2]);
    expect(NIGHTMARE_CHARGE_MS[3]).toBeLessThan(NIGHTMARE_CHARGE_MS[2]);
    // 集氣的時間走得到王座裡最遠的月光(關主區 960 寬,月光最遠離玩家約 460)。
    expect((NIGHTMARE_CHARGE_MS[3] / 1000) * DEFAULT_TUNING.walkSpeed).toBeGreaterThan(460 + 60);
  });

  test('惡夢雲:高的站著過、低的要跳;吸的力量比走路小(往反方向跑得掉);越來越大', () => {
    expect(MIST_HIGH_Y + MIST_H / 2).toBeLessThan(GROUND_Y - STAND_HITBOX.h);
    // 高的雲比關主區平台底部(360)低,不會擦到平台(沒有圖時的程式畫的雲 30 高也一樣)。
    expect(MIST_HIGH_Y - 30 / 2).toBeGreaterThan(360);
    expect(MIST_LOW_Y + MIST_H / 2).toBeGreaterThan(GROUND_Y - CROUCH_HITBOX.h);
    expect(INHALE_PULL).toBeLessThan(DEFAULT_TUNING.walkSpeed * 0.75);
    expect(TAPIR_SCALE[3]).toBeGreaterThan(TAPIR_SCALE[2]);
    expect(TAPIR_SCALE[2]).toBeGreaterThan(TAPIR_SCALE[1]);
    expect(ENEMY_DEFS.tapir.hp).toBe(150);
  });
});

test('結算:有星星的關多一行「收集星星」', () => {
  const s = { ...newRunStats(0, 3), starsFound: 4, starsTotal: 10 };
  expect(summaryLines(s, 60_000)).toContain('收集星星 4 / 10');
  expect(summaryLines(newRunStats(0, 3), 60_000).some((l) => l.includes('星星'))).toBe(false);
});
