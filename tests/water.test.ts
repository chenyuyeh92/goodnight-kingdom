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

test('左岸已經在畫面外(往回走掉下去)就從右岸出來,不會卡在一直掉的循環', () => {
  // 鏡頭在 1300,畫面左邊界 1316:左岸 1160 看不到。
  expect(respawnX(1230, gaps, 1316, 2240)).toBe(1316);
  expect(respawnX(1230, gaps, 1316, 2240)).toBeGreaterThan(1270);
  // 左岸看得到時照舊從左岸。
  expect(respawnX(1230, gaps, 900, 1800)).toBe(1160);
  // 右岸超出畫面右邊時夾在畫面內。
  expect(respawnX(3700, gaps, 3600, 3860)).toBe(3860);
});

test('不在河溝上方(例如被擠出畫面外)就留在原地附近', () => {
  expect(respawnX(2000, gaps)).toBe(2000);
});
