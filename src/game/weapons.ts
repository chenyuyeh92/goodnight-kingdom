import type { Text } from '../i18n/lang';
import { MAX_DT_MS } from '../config/tuning';

export type WeaponId =
  | 'yawnBubble'
  | 'sheepGun'
  | 'pillowCannon'
  | 'milkSpray'
  | 'lullabyHarp'
  | 'blanketBoomerang'
  | 'moonLamp'
  | 'yarnBall'
  | 'marshmallowBomb'
  | 'hypnoWatch'
  | 'wishingStar';
export type SpecialWeaponId = Exclude<WeaponId, 'yawnBubble'>;
export type Rarity = 'base' | 'R' | 'SR' | 'SSR';
/** bounce 會彈跳、lob 拋物線落地爆開、charge 按住集氣放開射出、meteor 從天上落到前方爆開。 */
export type ProjectileKind = 'straight' | 'pierce' | 'spread' | 'homing' | 'boomerang' | 'beam' | 'bounce' | 'lob' | 'charge' | 'meteor';

export interface OverheatDef {
  heatPerShot: number;
  maxHeat: number;
  coolPerSec: number;
  /** 過熱後要降到這個熱度以下才能再射。 */
  resumeAt: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: Text;
  rarity: Rarity;
  kind: ProjectileKind;
  /** null 表示用 tuning.fireIntervalMs。 */
  fireIntervalMs: number | null;
  damage: number;
  /** null 表示用 tuning.bulletSpeed。 */
  speed: number | null;
  size: number;
  color: number;
  lifeMs: number;
  /** ★1 的彈藥;null 表示無限。 */
  baseAmmo: number | null;
  pellets?: number;
  spreadDeg?: number;
  overheat?: OverheatDef;
  /** 受重力往下掉(px/s²):毛線球、棉花糖。 */
  gravity?: number;
  /** 最多彈幾次(毛線球)。 */
  bounces?: number;
  /** 爆開的半徑:範圍內的魔物全部受傷,刺盾擋不住。 */
  blastRadius?: number;
  /** 集氣:輕按是 damage,集滿 maxMs 是 maxDamage,中間線性。 */
  charge?: { maxDamage: number; maxMs: number };
}

/**
 * 強度階級(對單一魔物每秒傷害,稀有度越高越強):
 * 哈欠泡泡 6.7 < 枕頭砲 8.9(穿透)、牛奶噴霧近距離 13.3(射程約 290)、數羊機槍 14.3
 * < 搖籃曲豎琴 16.7(追蹤不會打歪)、棉被迴力鏢 15(穿透、穿牆)< 月亮催眠燈約 20(連射時 33,無限彈藥)。
 * 第二批:彈彈毛線球 7.1(彈跳多打幾下)< 棉花糖炸彈 14.5(範圍)、催眠懷錶全集氣約 14.7(穿透穿牆)< 許願流星杖 22(範圍)。
 */
export const WEAPONS: Readonly<Record<WeaponId, WeaponDef>> = {
  yawnBubble: { id: 'yawnBubble', name: { zh: '哈欠泡泡', en: 'Yawn Bubble' }, rarity: 'base', kind: 'straight', fireIntervalMs: null, damage: 1, speed: null, size: 14, color: 0xd6f0ff, lifeMs: 1000, baseAmmo: null },
  sheepGun: { id: 'sheepGun', name: { zh: '數羊機槍', en: 'Sheep-Counting Gun' }, rarity: 'R', kind: 'straight', fireIntervalMs: 70, damage: 1, speed: 700, size: 10, color: 0xffffff, lifeMs: 900, baseAmmo: 120 },
  pillowCannon: { id: 'pillowCannon', name: { zh: '枕頭砲', en: 'Pillow Cannon' }, rarity: 'R', kind: 'pierce', fireIntervalMs: 450, damage: 4, speed: 380, size: 22, color: 0xf6d6e8, lifeMs: 1600, baseAmmo: 30 },
  milkSpray: { id: 'milkSpray', name: { zh: '晚安牛奶噴霧', en: 'Goodnight Milk Spray' }, rarity: 'R', kind: 'spread', fireIntervalMs: 300, damage: 1, speed: 600, size: 10, color: 0xfffaf0, lifeMs: 480, baseAmmo: 60, pellets: 4, spreadDeg: 30 },
  lullabyHarp: { id: 'lullabyHarp', name: { zh: '搖籃曲豎琴', en: 'Lullaby Harp' }, rarity: 'SR', kind: 'homing', fireIntervalMs: 120, damage: 2, speed: 420, size: 10, color: 0xffe08a, lifeMs: 1600, baseAmmo: 80 },
  blanketBoomerang: { id: 'blanketBoomerang', name: { zh: '棉被迴力鏢', en: 'Blanket Boomerang' }, rarity: 'SR', kind: 'boomerang', fireIntervalMs: 400, damage: 6, speed: 520, size: 20, color: 0x9fc5ff, lifeMs: 2000, baseAmmo: 35 },
  moonLamp: {
    id: 'moonLamp', name: { zh: '月亮催眠燈', en: 'Moon Sleep Lamp' }, rarity: 'SSR', kind: 'beam', fireIntervalMs: 60, damage: 2, speed: 900, size: 12, color: 0xfff3a8, lifeMs: 300, baseAmmo: null,
    overheat: { heatPerShot: 5, maxHeat: 100, coolPerSec: 40, resumeAt: 30 },
  },
  yarnBall: { id: 'yarnBall', name: { zh: '彈彈毛線球', en: 'Bouncy Yarn Ball' }, rarity: 'R', kind: 'bounce', fireIntervalMs: 280, damage: 2, speed: 460, size: 14, color: 0xf6b8d0, lifeMs: 2400, baseAmmo: 50, gravity: 1100, bounces: 3 },
  marshmallowBomb: {
    id: 'marshmallowBomb', name: { zh: '晚安棉花糖炸彈', en: 'Goodnight Marshmallow Bomb' }, rarity: 'SR', kind: 'lob', fireIntervalMs: 550, damage: 8, speed: 480, size: 18, color: 0xfff4f8, lifeMs: 2400, baseAmmo: 30,
    gravity: 1100, blastRadius: 80,
  },
  hypnoWatch: {
    id: 'hypnoWatch', name: { zh: '催眠懷錶', en: 'Hypno Pocket Watch' }, rarity: 'SR', kind: 'charge', fireIntervalMs: 300, damage: 3, speed: 520, size: 24, color: 0xc8a8ff, lifeMs: 1400, baseAmmo: 25,
    charge: { maxDamage: 22, maxMs: 1200 },
  },
  wishingStar: { id: 'wishingStar', name: { zh: '許願流星杖', en: 'Wishing Star Wand' }, rarity: 'SSR', kind: 'meteor', fireIntervalMs: 180, damage: 4, speed: 900, size: 18, color: 0xffe070, lifeMs: 1200, baseAmmo: 60, blastRadius: 60 },
};

export const SPECIAL_WEAPONS: readonly SpecialWeaponId[] = [
  'sheepGun',
  'pillowCannon',
  'milkSpray',
  'yarnBall',
  'lullabyHarp',
  'blanketBoomerang',
  'marshmallowBomb',
  'hypnoWatch',
  'moonLamp',
  'wishingStar',
];

export const MAX_STARS = 3;
const AMMO_BONUS_PER_STAR = 0.25;

/** 每多一星彈藥上限 +25%。 */
export function ammoCapacity(id: WeaponId, stars: number): number | null {
  const base = WEAPONS[id].baseAmmo;
  if (base === null) return null;
  const s = Math.min(Math.max(stars, 1), MAX_STARS);
  return Math.round(base * (1 + AMMO_BONUS_PER_STAR * (s - 1)));
}

export interface Loadout {
  special: SpecialWeaponId | null;
  ammo: number | null;
  heat: number;
  overheated: boolean;
}

export const BASE_LOADOUT: Readonly<Loadout> = Object.freeze({ special: null, ammo: null, heat: 0, overheated: false });

export function equip(id: SpecialWeaponId, stars: number): Loadout {
  return { special: id, ammo: ammoCapacity(id, stars), heat: 0, overheated: false };
}

export function activeWeapon(l: Loadout): WeaponDef {
  return WEAPONS[l.special ?? 'yawnBubble'];
}

export function canFire(l: Loadout): boolean {
  return !l.overheated;
}

/** 射出一發:有彈藥的扣 1(流星期間不扣),過熱型加熱;彈藥用完換回哈欠泡泡。 */
export function fireWeapon(l: Loadout, infiniteAmmo: boolean): Loadout {
  const def = activeWeapon(l);
  if (def.overheat) {
    const heat = l.heat + def.overheat.heatPerShot;
    return { ...l, heat, overheated: l.overheated || heat >= def.overheat.maxHeat };
  }
  if (l.ammo === null || infiniteAmmo) return l;
  const ammo = l.ammo - 1;
  return ammo <= 0 ? { ...BASE_LOADOUT } : { ...l, ammo };
}

export function coolWeapon(l: Loadout, dtMs: number): Loadout {
  const oh = activeWeapon(l).overheat;
  if (!oh || l.heat === 0) return l;
  const heat = Math.max(0, l.heat - (oh.coolPerSec * Math.min(dtMs, MAX_DT_MS)) / 1000);
  return { ...l, heat, overheated: l.overheated && heat >= oh.resumeAt };
}

export function refillAmmo(l: Loadout, stars: number): Loadout {
  if (l.special === null) return l;
  return { ...l, ammo: ammoCapacity(l.special, stars) };
}
