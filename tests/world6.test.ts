import { describe, test, expect } from 'vitest';
import { GRAB_OMEGA, HAND_R, MAX_ANGLE, RELEASE_MIN_VX, canGrab, grabOmega, releaseVelocity, restingVine, stepVine, vineHand, type Vine, type VineState } from '../src/game/vine';
import { LUNGE_RANGE, SLOTH_WALK_MS, SLOTH_WINDUP_MS, initialSlothBrain, stepSloth, type SlothBrain, type SlothSense } from '../src/game/sloth';
import { JAGUAR_PROWL_MS, JAGUAR_WINDUP_MS, MARK_MS, TREE_Y, initialJaguarBrain, stepJaguar, type JaguarBrain, type JaguarSense } from '../src/game/jaguar';
import { initialYetiBrain, stepYeti, type YetiBrain } from '../src/game/yeti';
import { CHAMELEON_HIDE_MS, CHAMELEON_WALK_MS, ENEMY_DEFS, VULTURE_SWOOP_Y, initialBrain, stepEnemy, type EnemySense } from '../src/game/enemies';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { STAND_HITBOX } from '../src/game/playerMotor';
import { GROUND_Y } from '../src/levels/levelDef';

describe('藤蔓', () => {
  const vine: Vine = { x: 1070, top: 150 };

  test('只有碰到藤蔓下段才抓得住', () => {
    const st = restingVine();
    expect(canGrab(vine, st, 1075, 260, 308)).toBe(true);
    expect(canGrab(vine, st, 1120, 260, 308)).toBe(false);
    // 藤蔓上半段(頂端附近)抓不到。
    expect(canGrab(vine, st, 1070, 100, 148)).toBe(false);
    // 站在地上跳不到的高度以下也抓不到(藤蔓只到 310)。
    expect(canGrab(vine, st, 1070, 432, 480)).toBe(false);
  });

  test('抓住時至少盪得起來,順著飛過來的方向', () => {
    expect(grabOmega(200, 1)).toBe(GRAB_OMEGA);
    expect(grabOmega(-500, 1)).toBeCloseTo(-500 / HAND_R);
    expect(grabOmega(0, -1)).toBe(-GRAB_OMEGA);
  });

  test('單擺:盪過去會盪回來,不會超過 70 度;沒人抓會停回垂直', () => {
    let st: VineState = { angle: 0, omega: GRAB_OMEGA };
    let maxA = 0;
    let minA = 0;
    for (let i = 0; i < 120; i++) {
      st = stepVine(st, true, 0, 1000 / 60);
      maxA = Math.max(maxA, st.angle);
      minA = Math.min(minA, st.angle);
    }
    expect(maxA).toBeGreaterThan(0.6);
    expect(maxA).toBeLessThanOrEqual(MAX_ANGLE);
    expect(minA).toBeLessThan(-0.4);
    for (let i = 0; i < 400; i++) st = stepVine(st, false, 0, 1000 / 60);
    expect(Math.abs(st.angle)).toBeLessThan(0.02);
  });

  test('按住左右越盪越高', () => {
    const run = (push: -1 | 0 | 1): number => {
      let st: VineState = { angle: 0, omega: 1 };
      let maxA = 0;
      for (let i = 0; i < 300; i++) {
        st = stepVine(st, true, st.omega > 0 ? push : 0, 1000 / 60);
        maxA = Math.max(maxA, st.angle);
      }
      return maxA;
    };
    expect(run(1)).toBeGreaterThan(run(0) + 0.1);
  });

  test('放手往盪的方向飛,水平夠快、往上跳', () => {
    const v = releaseVelocity({ angle: 0.2, omega: 0.1 }, 1);
    expect(v.vx).toBe(RELEASE_MIN_VX);
    expect(v.vy).toBeLessThan(0);
    expect(releaseVelocity({ angle: 0, omega: -3 }, 1).vx).toBeLessThan(0);
  });

  /** 從岸邊跑起跳 → 抓藤蔓 → 往右盪的時候放手 → 落地的 x。 */
  function crossFrom(gapX: number, v: Vine, releaseAt: number): number | null {
    const t = DEFAULT_TUNING;
    const dt = 1 / 60;
    let x = gapX;
    let feet = GROUND_Y;
    let vy = -t.jumpVelocity;
    for (let i = 0; ; i++) {
      vy += t.gravity * dt;
      feet += vy * dt;
      x += t.airSpeed * dt;
      if (canGrab(v, restingVine(), x, feet - STAND_HITBOX.h, feet)) break;
      if (feet >= GROUND_Y || i > 200) return null;
    }
    let st: VineState = { angle: 0, omega: grabOmega(t.airSpeed, 1) };
    for (let i = 0; i < 400 && !(st.omega > 0 && st.angle >= releaseAt); i++) st = stepVine(st, true, 0, dt * 1000);
    const r = releaseVelocity(st, 1);
    const hand = vineHand(v, st);
    let px = hand.x;
    feet = hand.y + 20 + STAND_HITBOX.h / 2;
    vy = r.vy;
    for (let ms = 0; feet < GROUND_Y; ms += dt * 1000) {
      vy += t.gravity * dt;
      feet += vy * dt;
      px += (ms < 900 ? r.vx : t.airSpeed) * dt;
    }
    return px;
  }

  test('寬 300 的河溝:從岸邊起跳抓得到離岸 70 的藤蔓,往右盪時什麼時候放手都過得去', () => {
    const gapX = 1000;
    const v: Vine = { x: gapX + 70, top: 150 };
    for (const releaseAt of [-0.2, 0, 0.2, 0.4, 0.6, 0.8]) {
      const land = crossFrom(gapX, v, releaseAt);
      expect(land, `放手角度 ${releaseAt}`).not.toBeNull();
      expect(land!, `放手角度 ${releaseAt}`).toBeGreaterThan(gapX + 300 + 20);
    }
  });
});

describe('世界 6 的魔物', () => {
  const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 456, grounded: true, targetX: 200, targetY: 456, dtMs: 50, ...over });

  test('變色龍走一走就停下來躲起來,一陣子後再出來', () => {
    let brain = initialBrain('chameleon');
    const phases: string[] = [];
    for (let t = 0; t < CHAMELEON_WALK_MS + CHAMELEON_HIDE_MS + 500; t += 50) {
      const m = stepEnemy('chameleon', brain, sense());
      brain = m.brain;
      phases.push(brain.phase);
      if (brain.phase === 'hide') expect(m.vx).toBe(0);
    }
    expect(phases).toContain('hide');
    expect(phases[phases.length - 1]).toBe('walk');
  });

  test('樹蛙一跳一跳;鸚鵡俯衝最低點蹲下閃得過;穿山甲有鱗片盾、會滾', () => {
    let frog = initialBrain('treeFrog');
    let jumped = false;
    for (let t = 0; t < 1500; t += 50) {
      const m = stepEnemy('treeFrog', frog, sense());
      frog = m.brain;
      if (m.vy !== null && m.vy < 0) jumped = true;
    }
    expect(jumped).toBe(true);
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.parrot.h / 2).toBeLessThanOrEqual(452 + 2);
    expect(ENEMY_DEFS.pangolin.shield).toBe(true);
    let p = initialBrain('pangolin');
    const phases = new Set<string>();
    for (let t = 0; t < 5000; t += 50) {
      p = stepEnemy('pangolin', p, sense()).brain;
      phases.add(p.phase);
    }
    expect(phases.has('roll')).toBe(true);
  });
});

describe('失眠樹懶', () => {
  const sense = (over: Partial<SlothSense> = {}): SlothSense => ({
    x: 800,
    hpRatio: 1,
    targetX: 300,
    targetY: 440,
    handX: 760,
    handY: 420,
    arenaLeft: 0,
    arenaRight: 960,
    dtMs: 50,
    ...over,
  });

  test('慢慢爬過來 → 搖樹掉 3 顆芒果(一顆對準玩家)→ 下一招丟 3 顆芒果', () => {
    let b: SlothBrain = { ...initialSlothBrain(), timerMs: SLOTH_WALK_MS };
    b = stepSloth(b, sense()).brain;
    expect(b.mode).toBe('windup');
    const shake = stepSloth({ ...b, timerMs: SLOTH_WINDUP_MS }, sense());
    expect(shake.drops).toHaveLength(3);
    expect(shake.drops).toContain(300);
    b = shake.brain;
    expect(b.shakeNext).toBe(false);
    const throwB: SlothBrain = { ...b, mode: 'windup', timerMs: SLOTH_WINDUP_MS, pending: 'throw' };
    expect(stepSloth(throwB, sense()).throws).toHaveLength(3);
    expect(stepSloth(throwB, sense({ hpRatio: 0.4 })).throws).toHaveLength(5);
  });

  test('玩家靠太近就用爪子往前掃', () => {
    const b = stepSloth(initialSlothBrain(), sense({ targetX: 800 - LUNGE_RANGE + 20 })).brain;
    expect(b.pending).toBe('lunge');
    const lunge = stepSloth({ ...b, timerMs: SLOTH_WINDUP_MS }, sense({ targetX: 700 }));
    expect(lunge.brain.mode).toBe('lunge');
    expect(lunge.vx).toBeLessThan(0);
  });
});

describe('熬夜美洲豹', () => {
  const sense = (over: Partial<JaguarSense> = {}): JaguarSense => ({
    x: 800,
    y: 420,
    grounded: true,
    hpRatio: 1,
    targetX: 300,
    arenaLeft: 0,
    arenaRight: 960,
    halfW: 55,
    dtMs: 50,
    ...over,
  });

  test('先衝過來,下一招跳上樹 → 影子出現在玩家腳下 → 撲下來 → 落地頭暈', () => {
    let b: JaguarBrain = { ...initialJaguarBrain(), timerMs: JAGUAR_PROWL_MS };
    b = stepJaguar(b, sense()).brain;
    expect(b.mode).toBe('windup');
    const dash = stepJaguar({ ...b, timerMs: JAGUAR_WINDUP_MS }, sense());
    expect(dash.brain.mode).toBe('dash');
    expect(dash.vx).toBeLessThan(0);

    b = { ...initialJaguarBrain(), mode: 'windup', timerMs: JAGUAR_WINDUP_MS, dashNext: false };
    const leap = stepJaguar(b, sense());
    expect(leap.vy).toBeLessThan(0);
    b = leap.brain;
    const steps = [];
    for (let i = 0; i < 80 && b.mode !== 'drop'; i++) {
      const r = stepJaguar(b, sense({ y: TREE_Y, grounded: false }));
      steps.push(r);
      b = r.brain;
    }
    const hidden = steps.filter((r) => r.hidden);
    expect(hidden.length).toBeGreaterThan(0);
    expect(steps.some((r) => r.shadowX === 300)).toBe(true);
    // 影子至少出現 MARK_MS 才撲下來。
    expect(steps.filter((r) => r.shadowX !== null && r.hidden).length * 50).toBeGreaterThanOrEqual(MARK_MS);
    expect(b.mode).toBe('drop');
    b = stepJaguar(b, sense({ grounded: false })).brain;
    b = stepJaguar(b, sense({ grounded: false })).brain;
    b = stepJaguar(b, sense({ grounded: true })).brain;
    expect(b.mode).toBe('dizzy');
  });

  test('影子夾在畫面裡;血量一半以下連撲兩次', () => {
    const tree: JaguarBrain = { ...initialJaguarBrain(), mode: 'tree', timerMs: 1000 };
    expect(stepJaguar(tree, sense({ targetX: 10 })).shadowX).toBe(55);
    const leap = stepJaguar({ ...initialJaguarBrain(), mode: 'windup', timerMs: JAGUAR_WINDUP_MS, dashNext: false }, sense({ hpRatio: 0.4 }));
    expect(leap.brain.poundsLeft).toBe(2);
    const dizzy: JaguarBrain = { ...leap.brain, mode: 'dizzy', timerMs: 5000, poundsLeft: 1 };
    expect(stepJaguar(dizzy, sense()).brain.mode).toBe('leap');
  });
});

test('吵鬧大猩猩用雪怪的招式,跳過來的落點照大猩猩的身體寬度夾在畫面裡', () => {
  const b: YetiBrain = { ...initialYetiBrain(), mode: 'windup', timerMs: 600, phase: 2, pending: 'leap' };
  const r = stepYeti(b, {
    x: 9900,
    grounded: true,
    hpRatio: 0.5,
    targetX: 9240,
    targetY: 440,
    homeX: 10080,
    handX: 9850,
    handY: 400,
    arenaLeft: 9240,
    arenaRight: 10200,
    minionsAlive: 0,
    halfW: ENEMY_DEFS.gorilla.w / 2,
    dtMs: 50,
  });
  expect(r.brain.mode).toBe('leap');
  // 落點 = 9240 + 65,水平速度 = (落點 - 9900) / 0.95。
  expect(r.vx).toBeCloseTo((9240 + ENEMY_DEFS.gorilla.w / 2 - 9900) / 0.95);
});
