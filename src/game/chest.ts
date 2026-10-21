import { MAX_STARS, SPECIAL_WEAPONS, WEAPONS, type SpecialWeaponId } from './weapons';

/** 寶箱機率,開箱時在畫面上公開顯示。 */
export const CHEST_RATES: Readonly<Record<'R' | 'SR' | 'SSR', number>> = { R: 0.7, SR: 0.25, SSR: 0.05 };

export function rollRarity(r: number): 'R' | 'SR' | 'SSR' {
  if (r < CHEST_RATES.R) return 'R';
  if (r < CHEST_RATES.R + CHEST_RATES.SR) return 'SR';
  return 'SSR';
}

export type ChestResult =
  | { kind: 'new'; weapon: SpecialWeaponId; stars: 1 }
  | { kind: 'starUp'; weapon: SpecialWeaponId; stars: number }
  | { kind: 'maxed'; weapon: SpecialWeaponId };

/** 第一個亂數決定等級,第二個在該等級裡平均挑一把。亂數來源可替換,方便測試與日後交給伺服器。 */
export function openChest(rng: () => number, owned: Readonly<Partial<Record<SpecialWeaponId, number>>>): ChestResult {
  const rarity = rollRarity(rng());
  const pool = SPECIAL_WEAPONS.filter((id) => WEAPONS[id].rarity === rarity);
  const weapon = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return resultFor(weapon, owned);
}

/** 抽到某把武器時,依背包決定是新拿到、升星還是已滿三星。 */
export function resultFor(weapon: SpecialWeaponId, owned: Readonly<Partial<Record<SpecialWeaponId, number>>>): ChestResult {
  const stars = owned[weapon] ?? 0;
  if (stars === 0) return { kind: 'new', weapon, stars: 1 };
  if (stars >= MAX_STARS) return { kind: 'maxed', weapon };
  return { kind: 'starUp', weapon, stars: stars + 1 };
}
