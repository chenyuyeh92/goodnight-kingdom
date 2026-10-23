import { test, expect } from 'vitest';
import {
  BASE_LOADOUT,
  SPECIAL_WEAPONS,
  WEAPONS,
  activeWeapon,
  ammoCapacity,
  canFire,
  coolWeapon,
  equip,
  fireWeapon,
  refillAmmo,
  type Loadout,
} from '../src/game/weapons';

test('六把特殊武器的等級分布:R 3、SR 2、SSR 1', () => {
  const count = (r: string) => SPECIAL_WEAPONS.filter((id) => WEAPONS[id].rarity === r).length;
  expect(SPECIAL_WEAPONS).toHaveLength(6);
  expect([count('R'), count('SR'), count('SSR')]).toEqual([3, 2, 1]);
});

test('ammoCapacity 依星等增加,最多三星', () => {
  expect(ammoCapacity('sheepGun', 1)).toBe(120);
  expect(ammoCapacity('sheepGun', 2)).toBe(150);
  expect(ammoCapacity('sheepGun', 3)).toBe(180);
  expect(ammoCapacity('sheepGun', 5)).toBe(180);
});

test('月亮燈無限彈藥', () => {
  expect(ammoCapacity('moonLamp', 1)).toBeNull();
});

test('equip 補滿彈藥', () => {
  expect(equip('pillowCannon', 2)).toEqual({ special: 'pillowCannon', ammo: 38, heat: 0, overheated: false });
});

test('fireWeapon 扣彈藥', () => {
  expect(fireWeapon(equip('sheepGun', 1), false).ammo).toBe(119);
});

test('最後一發射完換回哈欠泡泡', () => {
  const last: Loadout = { special: 'pillowCannon', ammo: 1, heat: 0, overheated: false };
  const after = fireWeapon(last, false);
  expect(after).toEqual(BASE_LOADOUT);
  expect(activeWeapon(after).id).toBe('yawnBubble');
});

test('流星期間不扣彈藥', () => {
  expect(fireWeapon(equip('sheepGun', 1), true).ammo).toBe(120);
});

test('月亮燈連射 20 發過熱', () => {
  let l = equip('moonLamp', 1);
  for (let i = 0; i < 19; i++) l = fireWeapon(l, false);
  expect(l.overheated).toBe(false);
  l = fireWeapon(l, false);
  expect(l.heat).toBe(100);
  expect(l.overheated).toBe(true);
  expect(canFire(l)).toBe(false);
});

test('過熱後冷卻到 30 以下才能再射', () => {
  let l: Loadout = { special: 'moonLamp', ammo: null, heat: 104, overheated: true };
  for (let t = 0; t < 1800; t += 50) l = coolWeapon(l, 50);
  expect(l.heat).toBeCloseTo(32);
  expect(l.overheated).toBe(true);
  l = coolWeapon(coolWeapon(l, 50), 50);
  expect(l.overheated).toBe(false);
  expect(canFire(l)).toBe(true);
});

test('refillAmmo 補到星等上限;哈欠泡泡無效果', () => {
  const used: Loadout = { special: 'sheepGun', ammo: 3, heat: 0, overheated: false };
  expect(refillAmmo(used, 2).ammo).toBe(150);
  expect(refillAmmo(BASE_LOADOUT, 1)).toEqual(BASE_LOADOUT);
});
