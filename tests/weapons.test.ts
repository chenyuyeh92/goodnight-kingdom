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

test('十把特殊武器的等級分布:R 4、SR 4、SSR 2', () => {
  const count = (r: string) => SPECIAL_WEAPONS.filter((id) => WEAPONS[id].rarity === r).length;
  expect(SPECIAL_WEAPONS).toHaveLength(10);
  expect([count('R'), count('SR'), count('SSR')]).toEqual([4, 4, 2]);
});

test('四把新武器的數值(★1)', () => {
  expect(WEAPONS.yarnBall).toMatchObject({ rarity: 'R', kind: 'bounce', fireIntervalMs: 280, damage: 2, baseAmmo: 50, bounces: 3 });
  expect(WEAPONS.marshmallowBomb).toMatchObject({ rarity: 'SR', kind: 'lob', fireIntervalMs: 550, damage: 8, baseAmmo: 30, blastRadius: 80 });
  expect(WEAPONS.hypnoWatch).toMatchObject({ rarity: 'SR', kind: 'charge', damage: 3, baseAmmo: 25, charge: { maxDamage: 22, maxMs: 1200 } });
  expect(WEAPONS.wishingStar).toMatchObject({ rarity: 'SSR', kind: 'meteor', fireIntervalMs: 180, baseAmmo: 60, blastRadius: 60 });
});

test('強度排序:R 每秒傷害 < SR < SSR(對單一魔物)', () => {
  const dps = (id: keyof typeof WEAPONS): number => {
    const w = WEAPONS[id];
    // 懷錶:全集氣 1.2 秒 + 放開後的間隔。
    if (w.charge) return w.charge.maxDamage / ((w.charge.maxMs + (w.fireIntervalMs ?? 0)) / 1000);
    return (w.damage * (w.pellets ?? 1)) / ((w.fireIntervalMs ?? 150) / 1000);
  };
  const R = SPECIAL_WEAPONS.filter((id) => WEAPONS[id].rarity === 'R' && id !== 'milkSpray').map(dps);
  const SR = SPECIAL_WEAPONS.filter((id) => WEAPONS[id].rarity === 'SR').map(dps);
  expect(dps('yarnBall')).toBeLessThanOrEqual(Math.max(...R));
  expect(Math.min(...SR)).toBeGreaterThanOrEqual(Math.max(...R));
  expect(dps('wishingStar')).toBeGreaterThan(Math.max(...SR));
  expect(dps('wishingStar')).toBeLessThan(25);
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
