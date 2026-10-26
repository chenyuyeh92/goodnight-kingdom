import { describe, test, expect } from 'vitest';
import { BLACKOUT_ALPHA, DARK_ALPHA, LIGHT_RADIUS, darkTarget, fadeDark, inDark } from '../src/game/darkness';
import { MAX_FIREFLIES, QUEEN_BOB, QUEEN_HOVER_Y, QUEEN_WINDUP_MS, initialQueenBrain, stepQueen, type QueenBrain, type QueenSense } from '../src/game/queen';
import { HEAL_AFTER_MS, HEAL_EVERY_MS, AXOLOTL_WINDUP_MS, initialAxolotlBrain, stepAxolotl, type AxolotlBrain, type AxolotlSense } from '../src/game/axolotl';
import { FENNEC_WARN_MS, initialFennecBrain, stepFennec } from '../src/game/fennec';
import { ENEMY_DEFS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';
import { STAND_HITBOX } from '../src/game/playerMotor';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { GROUND_Y } from '../src/levels/levelDef';

describe('黑暗', () => {
  test('暗度:黑暗區裡很暗;女王的燈泡一閃後馬上更黑(白天的 9-1 沒有黑暗區也會暫時變黑);其他時候全亮', () => {
    expect(darkTarget(false, false)).toEqual({ alpha: 0, snap: false });
    expect(darkTarget(true, false)).toEqual({ alpha: DARK_ALPHA, snap: false });
    expect(darkTarget(true, true)).toEqual({ alpha: BLACKOUT_ALPHA, snap: true });
    expect(darkTarget(false, true)).toEqual({ alpha: BLACKOUT_ALPHA, snap: true });
  });

  test('在黑暗區裡;走進去慢慢變暗、走出來慢慢變亮', () => {
    expect(inDark(150, [{ x: 100, w: 100 }])).toBe(true);
    expect(inDark(250, [{ x: 100, w: 100 }])).toBe(false);
    let a = 0;
    a = fadeDark(a, DARK_ALPHA, 50);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(DARK_ALPHA);
    for (let i = 0; i < 40; i++) a = fadeDark(a, DARK_ALPHA, 50);
    expect(a).toBe(DARK_ALPHA);
    for (let i = 0; i < 40; i++) a = fadeDark(a, 0, 50);
    expect(a).toBe(0);
  });

  test('玩家身邊的光比水晶大;會發光的魔物也有光', () => {
    expect(LIGHT_RADIUS.player).toBeGreaterThan(LIGHT_RADIUS.crystal);
    expect(LIGHT_RADIUS.moth).toBeGreaterThan(0);
    expect(LIGHT_RADIUS.headlamp).toBeGreaterThan(LIGHT_RADIUS.crystal);
  });
});

describe('世界 9 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 456, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('咖啡蚯蚓會鑽進土裡;蘑菇精靈一跳一跳;發光蛾俯衝最低點蹲下閃得過', () => {
    let w = initialBrain('coffeeWorm');
    const phases = new Set<string>();
    for (let t = 0; t < 3500; t += 50) {
      w = stepEnemy('coffeeWorm', w, sense()).brain;
      phases.add(w.phase);
    }
    expect(phases.has('burrow')).toBe(true);
    let m = initialBrain('mushroom');
    let hopped = false;
    for (let t = 0; t < 1500; t += 50) {
      const r = stepEnemy('mushroom', m, sense());
      m = r.brain;
      if (r.vy !== null && r.vy < 0) hopped = true;
    }
    expect(hopped).toBe(true);
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.moth.h / 2).toBeLessThanOrEqual(452 + 2);
  });

  test('獨角仙角當盾、會衝撞;小螢火蟲會飄到玩家頭上', () => {
    expect(ENEMY_DEFS.beetle.shield).toBe(true);
    let b = initialBrain('beetle');
    const phases = new Set<string>();
    for (let t = 0; t < 5000; t += 50) {
      b = stepEnemy('beetle', b, sense()).brain;
      phases.add(b.phase);
    }
    expect(phases.has('roll')).toBe(true);
    expect(stepEnemy('firefly', initialBrain('firefly'), sense({ y: 200, targetY: 450 })).vy!).toBeGreaterThan(0);
  });
});

describe('熬夜螢火蟲女王', () => {
  const sense = (over: Partial<QueenSense> = {}): QueenSense => ({
    x: 9900,
    y: QUEEN_HOVER_Y,
    hpRatio: 1,
    targetX: 9500,
    targetY: 440,
    halfW: 40,
    arenaLeft: 9240,
    arenaRight: 10200,
    firefliesAlive: 0,
    dtMs: 50,
    ...over,
  });
  const attack = (pending: QueenBrain['pending'], over: Partial<QueenSense> = {}) =>
    stepQueen({ ...initialQueenBrain(), mode: 'windup', timerMs: QUEEN_WINDUP_MS, pending }, sense(over));

  test('飄的高度:站著往前射打不到,從地上跳起來射打得到', () => {
    const t = DEFAULT_TUNING;
    const muzzleY = GROUND_Y - t.jumpVelocity ** 2 / (2 * t.gravity) - 24;
    // 飄到最高時身體底部也低於跳起來的子彈。
    expect(QUEEN_HOVER_Y - QUEEN_BOB + ENEMY_DEFS.queen.h / 2).toBeGreaterThan(muzzleY);
    expect(QUEEN_HOVER_Y + QUEEN_BOB + ENEMY_DEFS.queen.h / 2).toBeLessThan(GROUND_Y - STAND_HITBOX.h);
  });

  test('叫小螢火蟲(場上最多 4 隻)、射 3 個光點(朝玩家)、燈泡一閃', () => {
    expect(attack('summon').summon).toBe(2);
    expect(attack('summon', { firefliesAlive: MAX_FIREFLIES - 1 }).summon).toBe(1);
    expect(attack('summon', { firefliesAlive: MAX_FIREFLIES }).summon).toBe(0);
    const sparks = attack('sparks').sparks;
    expect(sparks).toHaveLength(3);
    for (const s of sparks) expect(s.vx).toBeLessThan(0);
    expect(attack('sparks', { hpRatio: 0.4 }).sparks).toHaveLength(5);
    expect(attack('flash').flash).toBe(true);
  });

  test('招式輪流:叫螢火蟲 → 射光點 → 閃光', () => {
    let b: QueenBrain = { ...initialQueenBrain(), timerMs: 5000 };
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      b = stepQueen(b, sense()).brain;
      seen.push(b.pending);
      b = { ...b, mode: 'drift', timerMs: 5000 };
    }
    expect(seen).toEqual(['summon', 'sparks', 'flash']);
  });
});

describe('失眠六角恐龍', () => {
  const sense = (over: Partial<AxolotlSense> = {}): AxolotlSense => ({
    x: 800,
    hpRatio: 0.5,
    targetX: 300,
    targetY: 440,
    mouthX: 740,
    mouthY: 420,
    hurt: false,
    dtMs: 50,
    ...over,
  });

  test('3 秒沒被打就開始回血,每 0.6 秒 1 點;被打到就重新計時;滿血不回', () => {
    let b: AxolotlBrain = initialAxolotlBrain();
    let healed = 0;
    for (let t = 0; t < HEAL_AFTER_MS + HEAL_EVERY_MS * 3 + 50; t += 50) {
      const r = stepAxolotl(b, sense());
      b = r.brain;
      healed += r.heal;
    }
    expect(healed).toBe(3);
    b = stepAxolotl(b, sense({ hurt: true })).brain;
    expect(b.calmMs).toBe(0);
    expect(stepAxolotl({ ...b, calmMs: 9999, healMs: 9999 }, sense({ hpRatio: 1 })).heal).toBe(0);
  });

  test('吐 3 顆水泡(朝玩家),血量一半以下 5 顆', () => {
    const w: AxolotlBrain = { ...initialAxolotlBrain(), mode: 'windup', timerMs: AXOLOTL_WINDUP_MS };
    const r = stepAxolotl(w, sense({ hpRatio: 0.8 }));
    expect(r.bubbles).toHaveLength(3);
    for (const bb of r.bubbles) expect(bb.vx).toBeLessThan(0);
    expect(stepAxolotl(w, sense({ hpRatio: 0.4 })).bubbles).toHaveLength(5);
  });
});

test('巨鼴鼠用耳廓狐的行為,每次冒出來都丟石塊', () => {
  const b = { ...initialFennecBrain(), mode: 'under' as const, timerMs: FENNEC_WARN_MS, moundX: 9500 };
  const base = { x: 9500, grounded: true, hpRatio: 1, targetX: 9500, arenaLeft: 9264, arenaRight: 10176, halfW: 75, dtMs: 50 };
  expect(stepFennec(b, base).clumps).toHaveLength(0);
  expect(stepFennec(b, { ...base, alwaysThrow: true }).clumps).toHaveLength(2);
});
