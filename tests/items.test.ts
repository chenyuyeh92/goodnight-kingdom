import { test, expect } from 'vitest';
import { BUFF_MS, NO_BUFFS, applyItem, fireIntervalWithBuffs, rollDrop, tickBuffs } from '../src/game/items';
import { freshHealth } from '../src/game/health';
import { BASE_LOADOUT, equip } from '../src/game/weapons';

function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++];
}

const base = { health: freshHealth(), loadout: { ...BASE_LOADOUT }, buffs: { ...NO_BUFFS }, stars: 1 };

test('掉落機率 15%', () => {
  expect(rollDrop(seq(0.149, 0))).not.toBeNull();
  expect(rollDrop(seq(0.15, 0))).toBeNull();
});

test('四種道具平均', () => {
  expect(rollDrop(seq(0, 0))).toBe('hotCocoa');
  expect(rollDrop(seq(0, 0.25))).toBe('shootingStar');
  expect(rollDrop(seq(0, 0.5))).toBe('smallPillow');
  expect(rollDrop(seq(0, 0.99))).toBe('milkBottle');
});

test('熱可可 10 秒內射速減半,過期恢復', () => {
  const r = applyItem('hotCocoa', base);
  expect(r.buffs.cocoaMs).toBe(BUFF_MS);
  expect(fireIntervalWithBuffs(150, r.buffs)).toBe(75);
  let b = r.buffs;
  for (let t = 0; t < BUFF_MS; t += 50) b = tickBuffs(b, 50);
  expect(fireIntervalWithBuffs(150, b)).toBe(150);
});

test('流星設定 10 秒', () => {
  expect(applyItem('shootingStar', base).buffs.starMs).toBe(BUFF_MS);
});

test('小枕頭補一顆,滿血不超過 3', () => {
  expect(applyItem('smallPillow', { ...base, health: { ...freshHealth(), hearts: 1 } }).health.hearts).toBe(2);
  expect(applyItem('smallPillow', base).health.hearts).toBe(3);
});

test('牛奶瓶補滿特殊武器彈藥', () => {
  const r = applyItem('milkBottle', { ...base, loadout: { ...equip('sheepGun', 2), ammo: 4 }, stars: 2 });
  expect(r.loadout.ammo).toBe(150);
});

test('tickBuffs dt 夾 50', () => {
  expect(tickBuffs({ cocoaMs: 1000, starMs: 0 }, 5000).cocoaMs).toBe(950);
});
