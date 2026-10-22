import { test, expect } from 'vitest';
import { weaponHud } from '../src/game/hud';
import { BASE_LOADOUT, equip } from '../src/game/weapons';
import { NO_BUFFS } from '../src/game/items';

test('哈欠泡泡顯示無限', () => {
  expect(weaponHud(BASE_LOADOUT, NO_BUFFS)).toBe('哈欠泡泡 ∞');
});

test('特殊武器顯示剩餘彈藥', () => {
  expect(weaponHud({ ...equip('sheepGun', 1), ammo: 87 }, NO_BUFFS)).toBe('數羊機槍 87');
});

test('月亮燈顯示 10 格熱度條,過熱時加註', () => {
  expect(weaponHud({ special: 'moonLamp', ammo: null, heat: 34, overheated: false }, NO_BUFFS)).toBe('月亮催眠燈 ▮▮▮▯▯▯▯▯▯▯');
  expect(weaponHud({ special: 'moonLamp', ammo: null, heat: 100, overheated: true }, NO_BUFFS)).toBe('月亮催眠燈 ▮▮▮▮▮▮▮▮▮▮ 過熱!');
});

test('熱可可與流星期間顯示圖示', () => {
  expect(weaponHud(BASE_LOADOUT, { cocoaMs: 100, starMs: 100 })).toBe('哈欠泡泡 ∞ 可可★');
});
