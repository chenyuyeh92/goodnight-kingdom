import { test, expect } from 'vitest';
import { CHEST_RATES, openChest, resultFor, rollRarity } from '../src/game/chest';
import { SPECIAL_WEAPONS, WEAPONS } from '../src/game/weapons';

function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++];
}

const firstR = SPECIAL_WEAPONS.find((id) => WEAPONS[id].rarity === 'R')!;

test('rollRarity 邊界', () => {
  expect(rollRarity(0)).toBe('R');
  expect(rollRarity(0.6999)).toBe('R');
  expect(rollRarity(0.7)).toBe('SR');
  expect(rollRarity(0.9499)).toBe('SR');
  expect(rollRarity(0.95)).toBe('SSR');
  expect(rollRarity(0.9999)).toBe('SSR');
});

test('第一次抽到 → new ★1', () => {
  expect(openChest(seq(0.1, 0), {})).toEqual({ kind: 'new', weapon: firstR, stars: 1 });
});

test('重複 → 升一星', () => {
  expect(openChest(seq(0.1, 0), { [firstR]: 1 })).toEqual({ kind: 'starUp', weapon: firstR, stars: 2 });
});

test('三星再抽到 → maxed', () => {
  expect(openChest(seq(0.1, 0), { [firstR]: 3 })).toEqual({ kind: 'maxed', weapon: firstR });
});

test('SSR 只會是月亮燈', () => {
  expect(openChest(seq(0.99, 0.5), {})).toMatchObject({ weapon: 'moonLamp' });
});

test('等級內平均挑選', () => {
  const rs = SPECIAL_WEAPONS.filter((id) => WEAPONS[id].rarity === 'R');
  expect(openChest(seq(0.1, 0.999), {})).toMatchObject({ weapon: rs[rs.length - 1] });
});

test('機率總和為 1', () => {
  expect(CHEST_RATES.R + CHEST_RATES.SR + CHEST_RATES.SSR).toBeCloseTo(1);
});

test('resultFor:依背包決定新拿到、升星或已滿', () => {
  expect(resultFor('moonLamp', {})).toEqual({ kind: 'new', weapon: 'moonLamp', stars: 1 });
  expect(resultFor('moonLamp', { moonLamp: 2 })).toEqual({ kind: 'starUp', weapon: 'moonLamp', stars: 3 });
  expect(resultFor('moonLamp', { moonLamp: 3 })).toEqual({ kind: 'maxed', weapon: 'moonLamp' });
});
