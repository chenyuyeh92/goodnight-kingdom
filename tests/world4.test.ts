import { describe, test, expect } from 'vitest';
import { ICE_ACCEL, ICE_FRICTION, iceVx, onIce } from '../src/game/ice';
import { BEAR_SLIDE_MS, BEAR_WALK_MS, initialBearBrain, stepBear, type BearSense } from '../src/game/polarBear';
import { YETI_WINDUP_MS, initialYetiBrain, stepYeti, yetiIcicles, type YetiBrain, type YetiSense } from '../src/game/yeti';
import { ENEMY_DEFS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';

describe('冰面', () => {
  test('範圍判定', () => {
    expect(onIce(150, [{ x: 100, w: 100 }])).toBe(true);
    expect(onIce(250, [{ x: 100, w: 100 }])).toBe(false);
  });

  test('起步慢慢加速,不會一下子到全速', () => {
    expect(iceVx(0, 230, 50)).toBeCloseTo((ICE_ACCEL * 50) / 1000);
    let v = 0;
    for (let i = 0; i < 20; i++) v = iceVx(v, 230, 50);
    expect(v).toBe(230);
  });

  test('放開會滑一段才停,轉向也要先減速', () => {
    expect(iceVx(230, 0, 50)).toBeCloseTo(230 - (ICE_FRICTION * 50) / 1000);
    expect(iceVx(230, -230, 50)).toBeCloseTo(230 - (ICE_FRICTION * 50) / 1000);
    let v = 230;
    let n = 0;
    while (v !== 0 && n < 100) {
      v = iceVx(v, 0, 50);
      n++;
    }
    expect(n * 50).toBeGreaterThan(500);
  });
});

describe('世界 4 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 456, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('企鵝走一走,肚子貼地滑一段', () => {
    let brain = initialBrain('penguin');
    const speeds: number[] = [];
    for (let t = 0; t < 4000; t += 50) {
      const m = stepEnemy('penguin', brain, sense());
      brain = m.brain;
      speeds.push(Math.abs(m.vx));
    }
    expect(Math.max(...speeds)).toBeGreaterThan(Math.min(...speeds) * 4);
  });

  test('雪人每 2.6 秒丟雪球(拋物線),太遠不丟、停在一段距離外', () => {
    let brain = initialBrain('snowman');
    const spits = [];
    for (let t = 0; t < 5300; t += 50) {
      const m = stepEnemy('snowman', brain, sense());
      brain = m.brain;
      if (m.spit) spits.push(m.spit);
    }
    expect(spits).toHaveLength(2);
    expect(spits[0].gravity).toBeGreaterThan(0);
    expect(stepEnemy('snowman', initialBrain('snowman'), sense({ targetX: 400 })).vx).toBe(0);
  });

  test('海鸚俯衝最低點蹲下閃得過;海象有冰盾', () => {
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.puffin.h / 2).toBeLessThan(452);
    expect(ENEMY_DEFS.walrus.shield).toBe(true);
  });
});

describe('失眠北極熊', () => {
  const s = (over: Partial<BearSense> = {}): BearSense => ({ x: 800, hpRatio: 1, targetX: 300, arenaLeft: 0, arenaRight: 960, dtMs: 50, ...over });

  test('走一走 → 肚子滑過來 → 休息 → 走 → 拍地掉 3 根冰柱(一根對準玩家)', () => {
    let brain = initialBearBrain();
    const steps = [];
    for (let t = 0; t < BEAR_WALK_MS * 2 + BEAR_SLIDE_MS + 2000; t += 50) {
      const st = stepBear(brain, s());
      brain = st.brain;
      steps.push(st);
    }
    expect(steps.some((x) => x.brain.mode === 'slide' && Math.abs(x.vx) >= 300)).toBe(true);
    const drop = steps.find((x) => x.icicles.length > 0)!;
    expect(drop.icicles).toHaveLength(3);
    expect(drop.icicles).toContain(300);
  });

  test('血量一半以下 4 根;滑到邊緣會反彈', () => {
    const brain = { ...initialBearBrain(), mode: 'windup' as const, timerMs: 500, slideNext: false };
    expect(stepBear(brain, s({ hpRatio: 0.4 })).icicles).toHaveLength(4);
    const slide = { ...initialBearBrain(), mode: 'slide' as const, facing: -1 as const };
    expect(stepBear(slide, s({ x: 50 })).vx).toBeGreaterThan(0);
  });
});

describe('失眠雪怪', () => {
  const s = (over: Partial<YetiSense> = {}): YetiSense => ({
    x: 840, grounded: true, hpRatio: 1, targetX: 300, targetY: 456, homeX: 840, handX: 780, handY: 400, arenaLeft: 0, arenaRight: 960, minionsAlive: 0, dtMs: 50, ...over,
  });

  function attacksIn(ms: number, over: Partial<YetiSense> = {}, brain: YetiBrain = initialYetiBrain()) {
    const out = [];
    for (let t = 0; t < ms; t += 50) {
      const st = stepYeti(brain, s(over));
      brain = st.brain;
      if (st.snowballs.length + st.icicles.length + st.waves.length > 0 || st.brain.mode === 'leap') out.push(st);
    }
    return out;
  }

  test('第一階段:丟 3 顆雪球 → 跺腳掉 3 根冰柱 → 再丟雪球(還不會跳)', () => {
    const a = attacksIn(3 * (2000 + YETI_WINDUP_MS) + 200);
    expect(a[0].snowballs).toHaveLength(3);
    expect(a[1].icicles).toHaveLength(3);
    expect(a[2].snowballs).toHaveLength(3);
    expect(a.some((x) => x.brain.mode === 'leap')).toBe(false);
  });

  test('第二階段起會跳到玩家那邊,落地往左右送出雪浪,再走回原位', () => {
    let brain: YetiBrain = { ...initialYetiBrain(), phase: 2, attacks: 2, timerMs: 5000 };
    let st = stepYeti(brain, s({ hpRatio: 0.5 }));
    brain = st.brain;
    expect(brain.mode).toBe('windup');
    let n = 0;
    while (brain.mode === 'windup' && n++ < 100) {
      st = stepYeti(brain, s({ hpRatio: 0.5 }));
      brain = st.brain;
    }
    expect(n * 50).toBeGreaterThanOrEqual(YETI_WINDUP_MS);
    expect(st.brain.mode).toBe('leap');
    expect(st.vy).toBeLessThan(0);
    expect(st.vx).toBeLessThan(0);
    brain = st.brain;
    brain = stepYeti(brain, s({ hpRatio: 0.5, grounded: false })).brain;
    for (let t = 0; t < 300; t += 50) {
      st = stepYeti(brain, s({ hpRatio: 0.5, x: 300, grounded: t > 200 }));
      brain = st.brain;
      if (st.waves.length) break;
    }
    expect(st.waves).toEqual([-1, 1]);
    expect(stepYeti(brain, s({ hpRatio: 0.5, x: 300 })).vx).toBeGreaterThan(0);
  });

  test('冰柱一根對準玩家、其他往兩邊排開,都在範圍內', () => {
    expect(yetiIcicles(3, 400, 30, 930)).toEqual([400, 250, 550]);
    for (const x of yetiIcicles(5, 40, 30, 930)) expect(x >= 30 && x <= 930).toBe(true);
  });

  test('換階段發抖打不動;第二階段起叫企鵝', () => {
    const st = stepYeti(initialYetiBrain(), s({ hpRatio: 0.6 }));
    expect(st.enteredPhase).toBe(2);
    expect(st.invulnerable).toBe(true);
    const b2: YetiBrain = { ...initialYetiBrain(), phase: 2, attacks: 1, timerMs: 5000 };
    expect(stepYeti(b2, s({ hpRatio: 0.5 })).summon).toBe(true);
    expect(stepYeti(b2, s({ hpRatio: 0.5, minionsAlive: 3 })).summon).toBe(false);
  });
});
