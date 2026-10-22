import { describe, test, expect } from 'vitest';
import { WIND_CYCLE_MS, WIND_ON_MS, WIND_PUSH, WIND_RAMP_MS, inWind, windStrength, windVx } from '../src/game/wind';
import { CHARGE_SPEED, GOAT_DIZZY_MS, GOAT_WINDUP_MS, initialGoatBrain, stepGoat, type GoatBrain, type GoatSense } from '../src/game/goat';
import { BAMBOO_AX, BAMBOO_VX, BAMBOO_Y, PANDA_ROLL_MS, PANDA_WINDUP_MS, initialPandaBrain, stepPanda, type PandaBrain, type PandaSense } from '../src/game/panda';
import { THUNDER_GUST_MS, THUNDER_HOVER_Y, THUNDER_WINDUP_MS, initialThunderBrain, stepThunder, type ThunderBrain, type ThunderSense } from '../src/game/thunderbird';
import { ENEMY_DEFS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { CROUCH_HITBOX, STAND_HITBOX } from '../src/game/playerMotor';
import { GROUND_Y } from '../src/levels/levelDef';

describe('強風', () => {
  test('一陣一陣:先慢慢變強,吹 2 秒,停 1.6 秒', () => {
    expect(windStrength(0)).toBe(0);
    expect(windStrength(WIND_RAMP_MS / 2)).toBeCloseTo(0.5);
    expect(windStrength(WIND_RAMP_MS + 100)).toBe(1);
    expect(windStrength(WIND_ON_MS + 100)).toBe(0);
    expect(windStrength(WIND_CYCLE_MS + WIND_RAMP_MS + 100)).toBe(1);
  });

  test('逆風還走得動,順風(往左)走得更快;只在風區裡吹', () => {
    expect(windVx(DEFAULT_TUNING.walkSpeed, WIND_PUSH, 1)).toBeGreaterThan(50);
    expect(windVx(-DEFAULT_TUNING.walkSpeed, WIND_PUSH, 1)).toBeLessThan(-DEFAULT_TUNING.walkSpeed);
    expect(inWind(150, [{ x: 100, w: 100 }])).toBe(true);
    expect(inWind(250, [{ x: 100, w: 100 }])).toBe(false);
  });
});

describe('世界 8 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 300, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('鼠兔跑得比鬧鐘蟲快;咖啡雲精靈在空中上下飄;老鷹俯衝最低點蹲下閃得過', () => {
    const pika = stepEnemy('pika', initialBrain('pika'), sense()).vx;
    const bug = stepEnemy('alarmBug', initialBrain('alarmBug'), sense()).vx;
    expect(Math.abs(pika)).toBeGreaterThan(Math.abs(bug));
    expect(ENEMY_DEFS.coffeeCloud.flying).toBe(true);
    let c = initialBrain('coffeeCloud');
    const vys: number[] = [];
    for (let t = 0; t < 2400; t += 50) {
      const m = stepEnemy('coffeeCloud', c, sense());
      c = m.brain;
      vys.push(m.vy ?? 0);
    }
    expect(Math.max(...vys)).toBeGreaterThan(0);
    expect(Math.min(...vys)).toBeLessThan(0);
    // 從畫面上面掉進來的會往下飄到固定高度。
    expect(stepEnemy('coffeeCloud', initialBrain('coffeeCloud'), sense({ y: -30 })).vy!).toBeGreaterThan(300);
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.eagle.h / 2).toBeLessThanOrEqual(452 + 2);
  });

  test('犛牛有角當盾(會破)、會衝撞', () => {
    expect(ENEMY_DEFS.yak.shield).toBe(true);
    let y = initialBrain('yak');
    const phases = new Set<string>();
    for (let t = 0; t < 5000; t += 50) {
      y = stepEnemy('yak', y, sense({ y: 456 })).brain;
      phases.add(y.phase);
    }
    expect(phases.has('roll')).toBe(true);
  });
});

describe('熬夜山羊', () => {
  const sense = (over: Partial<GoatSense> = {}): GoatSense => ({
    x: 800,
    hpRatio: 1,
    targetX: 300,
    targetY: 440,
    footX: 750,
    footY: 460,
    halfW: 50,
    arenaLeft: 0,
    arenaRight: 960,
    dtMs: 50,
    ...over,
  });

  test('低頭往玩家那邊一路衝到山壁,撞到後頭暈、山上滾下石頭(一顆對準玩家)', () => {
    let b: GoatBrain = { ...initialGoatBrain(), mode: 'windup', timerMs: GOAT_WINDUP_MS };
    const go = stepGoat(b, sense());
    expect(go.brain.mode).toBe('charge');
    expect(go.vx).toBe(-CHARGE_SPEED);
    b = go.brain;
    // 還沒撞到:繼續衝。
    expect(stepGoat(b, sense({ x: 400 })).vx).toBe(-CHARGE_SPEED);
    const bonk = stepGoat(b, sense({ x: 52 }));
    expect(bonk.brain.mode).toBe('dizzy');
    expect(bonk.rocks).toHaveLength(3);
    expect(bonk.rocks).toContain(300);
    expect(bonk.brain.chargeNext).toBe(false);
    expect(stepGoat({ ...bonk.brain, timerMs: GOAT_DIZZY_MS - 100 }, sense()).vx).toBe(0);
  });

  test('下一招踢石頭過來;血量一半以下 5 顆', () => {
    const b: GoatBrain = { ...initialGoatBrain(), mode: 'windup', timerMs: GOAT_WINDUP_MS, chargeNext: false };
    expect(stepGoat(b, sense()).kicks).toHaveLength(3);
    expect(stepGoat(b, sense({ hpRatio: 0.4 })).kicks).toHaveLength(5);
  });
});

describe('失眠熊貓', () => {
  const sense = (over: Partial<PandaSense> = {}): PandaSense => ({ x: 800, hpRatio: 1, targetX: 300, halfW: 42, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  test('縮成一團滾過來,撞到畫面邊彈回去,滾一趟後休息', () => {
    let b: PandaBrain = { ...initialPandaBrain(), mode: 'windup', timerMs: PANDA_WINDUP_MS };
    b = stepPanda(b, sense()).brain;
    expect(b.mode).toBe('roll');
    expect(stepPanda(b, sense({ x: 43 })).vx).toBeGreaterThan(0);
    b = stepPanda({ ...b, timerMs: PANDA_ROLL_MS }, sense()).brain;
    expect(b.mode).toBe('rest');
    expect(b.rollNext).toBe(false);
  });

  test('竹子迴旋:飛出去再飛回來,蹲下躲得過、站著會被打到;血量一半以下兩根', () => {
    const b: PandaBrain = { ...initialPandaBrain(), mode: 'windup', timerMs: PANDA_WINDUP_MS, rollNext: false };
    expect(stepPanda(b, sense()).bamboos).toHaveLength(1);
    expect(stepPanda(b, sense({ hpRatio: 0.4 })).bamboos).toHaveLength(2);
    // 往左丟:x(t) = -600t + 300t²,1 秒後掉頭,2 秒後回到原處。
    const turnS = BAMBOO_VX / BAMBOO_AX;
    expect(turnS).toBeGreaterThan(0.8);
    expect(BAMBOO_VX * turnS - 0.5 * BAMBOO_AX * turnS ** 2).toBeGreaterThan(250);
    const half = 6;
    expect(BAMBOO_Y + half).toBeGreaterThan(GROUND_Y - STAND_HITBOX.h);
    expect(BAMBOO_Y + half).toBeLessThan(GROUND_Y - CROUCH_HITBOX.h);
  });
});

describe('熬夜雷鳥', () => {
  const sense = (over: Partial<ThunderSense> = {}): ThunderSense => ({
    x: 9900,
    y: THUNDER_HOVER_Y,
    hpRatio: 1,
    targetX: 9500,
    targetY: 440,
    halfW: 65,
    arenaLeft: 9240,
    arenaRight: 10200,
    minionsAlive: 0,
    dtMs: 50,
    ...over,
  });

  test('飛在上面:站著往前射打不到,從地上跳起來射打得到', () => {
    expect(stepThunder(initialThunderBrain(), sense({ y: 320 })).vy).toBeLessThan(0);
    const bottom = THUNDER_HOVER_Y + ENEMY_DEFS.thunderbird.h / 2;
    expect(bottom).toBeLessThan(GROUND_Y - STAND_HITBOX.h);
    // 跳到最高時腳離地面 v²/2g,子彈從身體中間(腳上 24)射出,泡泡半徑 7。
    const t = DEFAULT_TUNING;
    const muzzleY = GROUND_Y - t.jumpVelocity ** 2 / (2 * t.gravity) - 24;
    expect(muzzleY - 7).toBeLessThan(bottom);
  });

  test('落雷 3 道(一道對準玩家);颳強風 2 秒;第一階段不射羽毛', () => {
    const bolt = stepThunder({ ...initialThunderBrain(), mode: 'windup', timerMs: THUNDER_WINDUP_MS, pending: 'lightning' }, sense());
    expect(bolt.bolts).toHaveLength(3);
    expect(bolt.bolts).toContain(9500);
    let g = stepThunder({ ...initialThunderBrain(), mode: 'windup', timerMs: THUNDER_WINDUP_MS, pending: 'gust' }, sense());
    expect(g.gusting).toBe(true);
    expect(g.brain.mode).toBe('gust');
    g = stepThunder({ ...g.brain, timerMs: THUNDER_GUST_MS }, sense());
    expect(g.gusting).toBe(false);
    const p1: ThunderBrain = { ...initialThunderBrain(), timerMs: 5000, attacks: 2 };
    expect(stepThunder(p1, sense()).brain.pending).toBe('lightning');
  });

  test('第二階段起射羽毛(朝玩家),每兩招叫老鷹;換階段打不動', () => {
    const f = stepThunder({ ...initialThunderBrain(), phase: 2, mode: 'windup', timerMs: THUNDER_WINDUP_MS, pending: 'feathers' }, sense({ hpRatio: 0.5 }));
    expect(f.feathers).toHaveLength(3);
    for (const v of f.feathers) expect(v.vx).toBeLessThan(0);
    const odd: ThunderBrain = { ...initialThunderBrain(), phase: 2, timerMs: 5000, attacks: 1 };
    expect(stepThunder(odd, sense({ hpRatio: 0.5 })).summon).toBe(true);
    const angry = stepThunder(initialThunderBrain(), sense({ hpRatio: 0.6 }));
    expect(angry.invulnerable).toBe(true);
  });
});
