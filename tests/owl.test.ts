import { test, expect } from 'vitest';
import { OWL_HOVER_Y, OWL_SWOOP_Y, initialOwlBrain, owlPhase, stepOwl, type OwlBrain, type OwlSense } from '../src/game/owl';
import { ENEMY_DEFS } from '../src/game/enemies';

function sense(p: Partial<OwlSense> = {}): OwlSense {
  return { x: 5100, y: 150, hpRatio: 1, targetX: 4900, arenaLeft: 4720, arenaRight: 5520, timeMs: 0, dtMs: 50, minionsAlive: 0, ...p };
}

function runUntil(brain: OwlBrain, p: Partial<OwlSense>, done: (b: OwlBrain) => boolean, maxSteps = 200) {
  let b = brain;
  let steps = 0;
  while (!done(b) && steps < maxSteps) {
    b = stepOwl(b, sense(p)).brain;
    steps++;
  }
  return { brain: b, ms: steps * (p.dtMs ?? 50) };
}

test('貓頭鷹資料:關主、180 血(原本 60 的三倍)、會飛', () => {
  expect(ENEMY_DEFS.nightOwl).toMatchObject({ tier: 'boss', hp: 180, flying: true, name: '熬夜貓頭鷹' });
});

test('owlPhase 邊界', () => {
  expect([1, 0.67, 0.66, 0.34, 0.33, 0].map(owlPhase)).toEqual([1, 1, 2, 2, 3, 3]);
});

test('進入 hover 第一格放 3 根羽毛,以正下方為中心', () => {
  const r = stepOwl(initialOwlBrain(), sense());
  expect(r.feathers).toHaveLength(3);
  expect(r.feathers[1].vx).toBeCloseTo(0);
  expect(r.feathers[1].vy).toBeCloseTo(260);
  expect(stepOwl(r.brain, sense()).feathers).toHaveLength(0);
});

test('階段 3 放 7 根', () => {
  const b: OwlBrain = { ...initialOwlBrain(), phase: 3 };
  expect(stepOwl(b, sense({ hpRatio: 0.2 })).feathers).toHaveLength(7);
});

test('hover 2600ms 後俯衝向玩家位置', () => {
  const r = runUntil(initialOwlBrain(), {}, (b) => b.mode === 'swoop');
  expect(r.ms).toBe(2600);
  expect(r.brain.swoopTargetX).toBe(4900);
});

test('俯衝往目標飛;到達或 900ms 後轉 recover,700ms 後回 hover', () => {
  const swoop: OwlBrain = { mode: 'swoop', timerMs: 0, phase: 1, hovers: 1, swoopTargetX: 4900 };
  const v = stepOwl(swoop, sense({ x: 5100, y: 150 }));
  expect(Math.hypot(v.vx, v.vy)).toBeCloseTo(420);
  expect(v.vx).toBeLessThan(0);
  expect(v.vy).toBeGreaterThan(0);
  const arrived = stepOwl(swoop, sense({ x: 4905, y: OWL_SWOOP_Y }));
  expect(arrived.brain.mode).toBe('recover');
  const timedOut = runUntil(swoop, { x: 5100, y: 150 }, (b) => b.mode !== 'swoop');
  expect(timedOut.ms).toBe(900);
  const back = runUntil({ ...swoop, mode: 'recover' }, {}, (b) => b.mode === 'hover');
  expect(back.ms).toBe(700);
});

test('血量降到 66% 以下進入 angry 1 秒、無敵、回報 enteredPhase 2', () => {
  const r = stepOwl(initialOwlBrain(), sense({ hpRatio: 0.6 }));
  expect(r.brain.mode).toBe('angry');
  expect(r.brain.phase).toBe(2);
  expect(r.enteredPhase).toBe(2);
  expect(r.invulnerable).toBe(true);
  expect(r.feathers).toHaveLength(0);
  const later = runUntil(r.brain, { hpRatio: 0.6 }, (b) => b.mode !== 'angry');
  expect(later.ms).toBe(1000);
});

test('angry 期間不放羽毛、維持無敵', () => {
  const angry: OwlBrain = { mode: 'angry', timerMs: 200, phase: 2, hovers: 0, swoopTargetX: 0 };
  const r = stepOwl(angry, sense({ hpRatio: 0.6 }));
  expect(r.feathers).toHaveLength(0);
  expect(r.invulnerable).toBe(true);
  expect(r.enteredPhase).toBeNull();
});

test('階段 2 每第二次 hover 召喚兩隻小怪;小怪已有 4 隻時不召喚', () => {
  const b: OwlBrain = { mode: 'hover', timerMs: 0, phase: 2, hovers: 1, swoopTargetX: 0 };
  expect(stepOwl(b, sense({ hpRatio: 0.5 })).summon).toEqual(['left', 'right']);
  expect(stepOwl(b, sense({ hpRatio: 0.5, minionsAlive: 4 })).summon).toEqual([]);
  expect(stepOwl({ ...b, hovers: 0 }, sense({ hpRatio: 0.5 })).summon).toEqual([]);
  expect(stepOwl({ ...b, phase: 1, hovers: 1 }, sense({ hpRatio: 0.9 })).summon).toEqual([]);
});

test('0 血時不進 angry', () => {
  const r = stepOwl(initialOwlBrain(), sense({ hpRatio: 0 }));
  expect(r.invulnerable).toBe(false);
  expect(r.enteredPhase).toBeNull();
});

test('沒有目標時不俯衝', () => {
  const r = runUntil(initialOwlBrain(), { targetX: null }, (b) => b.mode === 'swoop', 120);
  expect(r.brain.mode).toBe('hover');
});

test('dt 夾 50', () => {
  const r = stepOwl(initialOwlBrain(), sense({ dtMs: 5000 }));
  expect(r.brain.timerMs).toBe(50);
});

test('貓頭鷹俯衝最低點不鑽進地面', () => {
  expect(OWL_SWOOP_Y + ENEMY_DEFS.nightOwl.h / 2).toBeLessThanOrEqual(470);
});

test('貓頭鷹盤旋時判定頂端在畫面內', () => {
  expect(OWL_HOVER_Y - ENEMY_DEFS.nightOwl.h / 2).toBeGreaterThanOrEqual(60);
});

test('貓頭鷹俯衝最低時,站在關主區踏板(y 360)上躲得過', () => {
  expect(OWL_SWOOP_Y - ENEMY_DEFS.nightOwl.h / 2).toBeGreaterThan(360);
});
