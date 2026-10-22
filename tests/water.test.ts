import { test, expect } from 'vitest';
import { SHALLOW_SPEED, fellIntoRiver, groundSegments, gapAt, inShallow, respawnX } from '../src/game/water';

const gaps = [
  { x: 1200, w: 70 },
  { x: 3600, w: 240 },
];

test('淺水區裡走路變慢,外面不變', () => {
  const shallow = [{ x: 500, w: 400 }];
  expect(inShallow(600, shallow)).toBe(true);
  expect(inShallow(950, shallow)).toBe(false);
  expect(SHALLOW_SPEED).toBeLessThan(1);
});

test('地面依河溝切成好幾段', () => {
  expect(groundSegments(5000, gaps)).toEqual([
    { x: 0, w: 1200 },
    { x: 1270, w: 2330 },
    { x: 3840, w: 1160 },
  ]);
});

test('腳掉到地面以下 30 才算掉進河裡', () => {
  expect(fellIntoRiver(495)).toBe(false);
  expect(fellIntoRiver(520)).toBe(true);
});

test('從河溝左岸重新出來', () => {
  expect(gapAt(1230, gaps)).toEqual(gaps[0]);
  expect(gapAt(2000, gaps)).toBeNull();
  expect(respawnX(1230, gaps)).toBe(1160);
  expect(respawnX(3700, gaps)).toBe(3560);
});

test('不在河溝上方(例如被擠出畫面外)就留在原地附近', () => {
  expect(respawnX(2000, gaps)).toBe(2000);
});
