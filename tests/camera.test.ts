import { describe, test, expect } from 'vitest';
import { advanceCamera, advanceTeamCamera, minPlayerX } from '../src/game/camera';

test('角色往前,鏡頭跟上', () => {
  expect(advanceCamera(0, 1000, 960, 3200, 0.4)).toBe(616);
});

test('角色往回,鏡頭不退', () => {
  expect(advanceCamera(616, 500, 960, 3200, 0.4)).toBe(616);
});

test('不超過世界右邊界', () => {
  expect(advanceCamera(0, 5000, 960, 3200, 0.4)).toBe(2240);
});

test('不小於 0', () => {
  expect(advanceCamera(0, 100, 960, 3200, 0.4)).toBe(0);
});

test('minPlayerX', () => {
  expect(minPlayerX(616, 16)).toBe(632);
});

describe('advanceTeamCamera', () => {
  test('單人時與 advanceCamera 相同', () => {
    expect(advanceTeamCamera(0, [1000], 960, 3200, 0.4, 16)).toBe(616);
  });

  test('落後者限制鏡頭', () => {
    expect(advanceTeamCamera(0, [150, 1100], 960, 3200, 0.4, 16)).toBe(134);
  });

  test('沒有醒著的角色時鏡頭不動', () => {
    expect(advanceTeamCamera(300, [], 960, 3200, 0.4, 16)).toBe(300);
  });

  test('不會往回', () => {
    expect(advanceTeamCamera(500, [200, 300], 960, 3200, 0.4, 16)).toBe(500);
  });
});
