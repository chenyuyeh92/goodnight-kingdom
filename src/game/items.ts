import { MAX_DT_MS } from '../config/tuning';
import { MAX_HEARTS, type Health } from './health';
import { refillAmmo, type Loadout } from './weapons';
import type { Text } from '../i18n/lang';

export type ItemId = 'hotCocoa' | 'shootingStar' | 'smallPillow' | 'milkBottle';

export const ITEM_IDS: readonly ItemId[] = ['hotCocoa', 'shootingStar', 'smallPillow', 'milkBottle'];

export const ITEM_NAMES: Readonly<Record<ItemId, Text>> = {
  hotCocoa: { zh: '熱可可', en: 'Hot Cocoa' },
  shootingStar: { zh: '流星', en: 'Shooting Star' },
  smallPillow: { zh: '小枕頭', en: 'Little Pillow' },
  milkBottle: { zh: '牛奶瓶', en: 'Milk Bottle' },
};

export const ITEM_DROP_CHANCE = 0.15;
export const BUFF_MS = 10000;

export interface Buffs {
  /** 熱可可:射速加倍。 */
  cocoaMs: number;
  /** 流星:無限彈藥。 */
  starMs: number;
}

export const NO_BUFFS: Readonly<Buffs> = Object.freeze({ cocoaMs: 0, starMs: 0 });

/** 第一個亂數決定會不會掉,第二個平均挑一種。 */
export function rollDrop(rng: () => number): ItemId | null {
  if (rng() >= ITEM_DROP_CHANCE) return null;
  return ITEM_IDS[Math.min(ITEM_IDS.length - 1, Math.floor(rng() * ITEM_IDS.length))];
}

export function tickBuffs(b: Buffs, dtMs: number): Buffs {
  const dt = Math.min(dtMs, MAX_DT_MS);
  return { cocoaMs: Math.max(0, b.cocoaMs - dt), starMs: Math.max(0, b.starMs - dt) };
}

export function fireIntervalWithBuffs(baseMs: number, b: Buffs): number {
  return b.cocoaMs > 0 ? baseMs / 2 : baseMs;
}

export function applyItem(
  item: ItemId,
  s: { health: Health; loadout: Loadout; buffs: Buffs; stars: number },
): { health: Health; loadout: Loadout; buffs: Buffs } {
  switch (item) {
    case 'hotCocoa':
      return { ...s, buffs: { ...s.buffs, cocoaMs: BUFF_MS } };
    case 'shootingStar':
      return { ...s, buffs: { ...s.buffs, starMs: BUFF_MS } };
    case 'smallPillow':
      if (s.health.down) return s;
      return { ...s, health: { ...s.health, hearts: Math.min(MAX_HEARTS, s.health.hearts + 1) } };
    case 'milkBottle':
      return { ...s, loadout: refillAmmo(s.loadout, s.stars) };
  }
}
