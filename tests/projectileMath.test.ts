import { test, expect } from 'vitest';
import { boomerangVelocity, pelletVelocities, steerToward, bounceOff, chargeDamage, chargeScale, inBlast, meteorTargetX } from '../src/game/projectileMath';

const speed = (v: { vx: number; vy: number }) => Math.hypot(v.vx, v.vy);

test('5 發扇形對稱,中間一發與原方向相同', () => {
  const p = pelletVelocities('forward', 1, 520, 5, 50);
  expect(p).toHaveLength(5);
  expect(p[2].vx).toBeCloseTo(520);
  expect(p[2].vy).toBeCloseTo(0);
  expect(p[0].vy).toBeCloseTo(-p[4].vy);
  for (const v of p) expect(speed(v)).toBeCloseTo(520, 6);
});

test('往上射時扇形以正上方為中心', () => {
  const p = pelletVelocities('up', 1, 520, 5, 50);
  expect(p[2].vx).toBeCloseTo(0);
  expect(p[2].vy).toBeCloseTo(-520);
});

test('追蹤每秒最多轉 360 度', () => {
  const v = steerToward(420, 0, 0, 0, 0, -100, 360, 50);
  const deg = (Math.atan2(v.vy, v.vx) * 180) / Math.PI;
  expect(deg).toBeCloseTo(-18, 2);
  expect(speed(v)).toBeCloseTo(420, 6);
});

test('目標在正前方不轉向', () => {
  const v = steerToward(420, 0, 0, 0, 300, 0, 360, 50);
  expect(v.vx).toBeCloseTo(420);
  expect(v.vy).toBeCloseTo(0);
});

test('迴力鏢 400ms 內照原速度,之後飛回主人', () => {
  const initial = { vx: 520, vy: 0 };
  expect(boomerangVelocity(399, initial, { x: 500, y: 450 }, { x: 300, y: 450 })).toEqual(initial);
  const back = boomerangVelocity(401, initial, { x: 500, y: 450 }, { x: 300, y: 450 });
  expect(back.vx).toBeCloseTo(-520);
  expect(back.vy).toBeCloseTo(0);
});

test('主人不在時沿原方向飛走', () => {
  const initial = { vx: 520, vy: 0 };
  expect(boomerangVelocity(900, initial, { x: 500, y: 450 }, null)).toEqual(initial);
});

test('懷錶集氣:輕按 3 點,線性加到 1.2 秒 22 點,再久也是 22', () => {
  expect(chargeDamage(0)).toBe(3);
  expect(chargeDamage(600)).toBeCloseTo(12.5);
  expect(chargeDamage(1200)).toBe(22);
  expect(chargeDamage(5000)).toBe(22);
  expect(chargeScale(0)).toBe(1);
  expect(chargeScale(1200)).toBeCloseTo(2.5);
});

test('流星落在前方 160–360 之間', () => {
  expect(meteorTargetX(1000, 1, () => 0)).toBe(1160);
  expect(meteorTargetX(1000, 1, () => 0.999)).toBeCloseTo(1360, 0);
  expect(meteorTargetX(1000, -1, () => 0)).toBe(840);
});

test('爆炸範圍:圓碰到魔物的方框就算(離中心 r 以內)', () => {
  const box = { x: 100, y: 100, w: 40, h: 40 };
  expect(inBlast(50, 120, 60, box)).toBe(true);
  expect(inBlast(30, 120, 60, box)).toBe(false);
  expect(inBlast(120, 120, 10, box)).toBe(true);
  // 角落:距離 (√(30²+30²) ≈ 42)
  expect(inBlast(70, 70, 40, box)).toBe(false);
  expect(inBlast(70, 70, 45, box)).toBe(true);
});

test('毛線球碰地反彈:往下的速度反過來、變小一點;水平不變', () => {
  expect(bounceOff({ vx: 300, vy: 400 }, 'floor')).toEqual({ vx: 300, vy: -300 });
  expect(bounceOff({ vx: 300, vy: -100 }, 'wall')).toEqual({ vx: -300, vy: -100 });
});
