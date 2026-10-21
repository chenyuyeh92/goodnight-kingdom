import { MAX_DT_MS } from '../config/tuning';

export type WeaponId =
  | 'yawnBubble'
  | 'sheepGun'
  | 'pillowCannon'
  | 'milkSpray'
  | 'lullabyHarp'
  | 'blanketBoomerang'
  | 'moonLamp';
export type SpecialWeaponId = Exclude<WeaponId, 'yawnBubble'>;
export type Rarity = 'base' | 'R' | 'SR' | 'SSR';
export type ProjectileKind = 'straight' | 'pierce' | 'spread' | 'homing' | 'boomerang' | 'beam';

export interface OverheatDef {
  heatPerShot: number;
  maxHeat: number;
  coolPerSec: number;
  /** 過熱後要降到這個熱度以下才能再射。 */
  resumeAt: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
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
}

export const WEAPONS: Readonly<Record<WeaponId, WeaponDef>> = {
  yawnBubble: { id: 'yawnBubble', name: '哈欠泡泡', rarity: 'base', kind: 'straight', fireIntervalMs: null, damage: 1, speed: null, size: 10, color: 0xbfe6ff, lifeMs: 1000, baseAmmo: null },
  sheepGun: { id: 'sheepGun', name: '數羊機槍', rarity: 'R', kind: 'straight', fireIntervalMs: 70, damage: 1, speed: 700, size: 8, color: 0xffffff, lifeMs: 900, baseAmmo: 120 },
  pillowCannon: { id: 'pillowCannon', name: '枕頭砲', rarity: 'R', kind: 'pierce', fireIntervalMs: 450, damage: 3, speed: 380, size: 22, color: 0xf6d6e8, lifeMs: 1600, baseAmmo: 30 },
  milkSpray: { id: 'milkSpray', name: '晚安牛奶噴霧', rarity: 'R', kind: 'spread', fireIntervalMs: 220, damage: 1, speed: 520, size: 8, color: 0xfffaf0, lifeMs: 260, baseAmmo: 60, pellets: 5, spreadDeg: 50 },
  lullabyHarp: { id: 'lullabyHarp', name: '搖籃曲豎琴', rarity: 'SR', kind: 'homing', fireIntervalMs: 200, damage: 1, speed: 420, size: 10, color: 0xffe08a, lifeMs: 1600, baseAmmo: 50 },
  blanketBoomerang: { id: 'blanketBoomerang', name: '棉被迴力鏢', rarity: 'SR', kind: 'boomerang', fireIntervalMs: 600, damage: 2, speed: 520, size: 20, color: 0x9fc5ff, lifeMs: 2000, baseAmmo: 25 },
  moonLamp: {
    id: 'moonLamp', name: '月亮催眠燈', rarity: 'SSR', kind: 'beam', fireIntervalMs: 60, damage: 1, speed: 900, size: 12, color: 0xfff3a8, lifeMs: 300, baseAmmo: null,
    overheat: { heatPerShot: 8, maxHeat: 100, coolPerSec: 40, resumeAt: 30 },
  },
};

export const SPECIAL_WEAPONS: readonly SpecialWeaponId[] = [
  'sheepGun',
  'pillowCannon',
  'milkSpray',
  'lullabyHarp',
  'blanketBoomerang',
  'moonLamp',
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
