import { test, expect } from 'vitest';
import { MELEE_COOLDOWN_MS, MELEE_DAMAGE, initialAttackState, meleeTarget, stepAttack, type MeleeCandidate, type MeleeReach } from '../src/game/melee';

// 站立角色:腳底 480、高 48、面向右、往前瞄準。
const P: MeleeReach = { x: 150, feetY: 480, h: 48, facing: 1, aim: 'forward' };

function enemy(x: number, w = 32, top = 448, bottom = 480): MeleeCandidate {
  return { x, w, top, bottom };
}

test('傷害是泡泡的 5 倍', () => {
  expect(MELEE_DAMAGE).toBe(5);
});

test('前方 36px 內的敵人算近身', () => {
  // 角色前緣 164;敵人左緣 = x - 16。左緣 200 → 距離 36。
  expect(meleeTarget(P, [enemy(216)])).toBe(0);
  expect(meleeTarget(P, [enemy(217)])).toBeNull();
});

test('貼在身上(重疊)也算近身', () => {
  expect(meleeTarget(P, [enemy(160)])).toBe(0);
});

test('背後的敵人不算', () => {
  expect(meleeTarget(P, [enemy(120)])).toBeNull();
  expect(meleeTarget({ ...P, facing: -1 }, [enemy(120)])).toBe(0);
});

test('高度不重疊不算(頭上的蝙蝠)', () => {
  expect(meleeTarget(P, [enemy(180, 32, 300, 320)])).toBeNull();
});

test('往上或往下瞄準時不揮擊', () => {
  expect(meleeTarget({ ...P, aim: 'up' }, [enemy(180)])).toBeNull();
  expect(meleeTarget({ ...P, aim: 'down' }, [enemy(180)])).toBeNull();
});

test('多隻時挑最近的', () => {
  expect(meleeTarget(P, [enemy(200), enemy(175)])).toBe(1);
});

test('有近身目標時按射擊 → 揮擊,冷卻 300ms', () => {
  const r = stepAttack(initialAttackState(), true, true, 16, 150);
  expect(r.action).toBe('melee');
  expect(r.state.meleeCooldownMs).toBe(MELEE_COOLDOWN_MS);
});

test('揮擊冷卻中不會改射泡泡', () => {
  const first = stepAttack(initialAttackState(), true, true, 16, 150);
  const second = stepAttack(first.state, true, true, 16, 150);
  expect(second.action).toBe('none');
});

test('按住時每 300ms 揮一次', () => {
  let s = initialAttackState();
  const swings: number[] = [];
  for (let i = 1; i <= 40; i++) {
    const r = stepAttack(s, true, true, 16, 150);
    s = r.state;
    if (r.action === 'melee') swings.push(i);
  }
  expect(swings).toEqual([1, 20, 39]);
});

test('沒有近身目標時照常射泡泡', () => {
  expect(stepAttack(initialAttackState(), true, false, 16, 150).action).toBe('bullet');
});

test('沒按射擊什麼都不做', () => {
  expect(stepAttack(initialAttackState(), false, true, 16, 150).action).toBe('none');
});

test('揮擊後 300ms 內不會馬上改射泡泡(收招)', () => {
  let r = stepAttack(initialAttackState(), true, true, 16, 150);
  for (let i = 0; i < 18; i++) {
    r = stepAttack(r.state, true, false, 16, 150);
    expect(r.action).toBe('none');
  }
  r = stepAttack(r.state, true, false, 16, 150);
  expect(r.action).toBe('bullet');
});
