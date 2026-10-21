import { test, expect } from 'vitest';
import { parseLevelId } from '../src/levels/levelDef';
import { LEVELS } from '../src/levels';

test('parseLevelId', () => {
  expect(parseLevelId('range')).toBe('range');
  expect(parseLevelId(null)).toBe('forest');
  expect(parseLevelId('x')).toBe('forest');
});

test('靶場資料與搬移前一致', () => {
  const r = LEVELS.range;
  expect(r.checkpoints).toEqual([150, 1200, 2000]);
  expect(r.chests).toHaveLength(3);
  expect(r.chests[0].x).toBe(960);
  expect(r.arenas).toHaveLength(2);
  expect(r.worldW).toBe(3200);
  expect(r.targets).toHaveLength(6);
  expect(r.boss).toBeNull();
});

const F = LEVELS.forest;
const VIEW_W = 960;

test('森林:三段加關主,每段開頭有檢查點', () => {
  expect(F.worldW).toBe(5600);
  expect(F.checkpoints).toEqual([150, 1700, 3050, 4500]);
  expect(F.targets).toHaveLength(0);
});

test('森林:三個寶箱,第二個在高處', () => {
  expect(F.chests).toHaveLength(3);
  expect(F.chests[1].bottom).toBeLessThan(300);
});

test('森林:隱藏寶箱跳得上去(每級高度差 ≤ 140)', () => {
  const steps = F.terrain.filter((r) => r.x >= 2450 && r.x <= 2900 && r.h <= 20).sort((a, b) => b.y - a.y);
  let prev = 480;
  for (const s of steps) {
    expect(prev - s.y).toBeLessThanOrEqual(140);
    prev = s.y;
  }
  expect(prev).toBe(F.chests[1].bottom);
});

test('森林:低矮通道蹲得過、站不過', () => {
  const ceilings = F.terrain.filter((r) => r.h > 20);
  expect(ceilings.length).toBeGreaterThan(0);
  for (const c of ceilings) {
    const gap = 480 - (c.y + c.h);
    expect(gap).toBeGreaterThan(28);
    expect(gap).toBeLessThan(48);
    // 跳躍高度約 145,通道頂端要高到跳不上去,只能蹲著過。
    expect(480 - c.y).toBeGreaterThanOrEqual(170);
  }
});

test('森林:戰鬥區鎖住時走不到下一個檢查點', () => {
  for (const a of F.arenas) {
    const reachable = a.lockScrollX + VIEW_W;
    for (const cp of F.checkpoints) expect(cp <= a.lockScrollX || cp > reachable).toBe(true);
  }
});

test('森林:戰鬥區與關主鎖定點都在世界內,右側生成不會超出世界', () => {
  for (const a of F.arenas) {
    expect(a.lockScrollX + VIEW_W).toBeLessThanOrEqual(F.worldW);
    const usesRight = a.waves.some((w) => w.some((s) => s.from === 'right'));
    if (usesRight) expect(a.lockScrollX + VIEW_W + 20).toBeLessThanOrEqual(F.worldW);
  }
  expect(F.boss!.lockScrollX + VIEW_W).toBe(F.worldW);
});

test('森林:戰鬥區鎖定範圍互不重疊,關主在最後', () => {
  const locks = F.arenas.map((a) => a.lockScrollX).sort((x, y) => x - y);
  for (let i = 1; i < locks.length; i++) expect(locks[i] - locks[i - 1]).toBeGreaterThanOrEqual(VIEW_W);
  expect(F.boss!.lockScrollX).toBeGreaterThan(locks[locks.length - 1]);
});
