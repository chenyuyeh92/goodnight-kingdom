import { MAX_STARS, SPECIAL_WEAPONS, WEAPONS, type SpecialWeaponId } from './weapons';
import { tr } from '../i18n/lang';

/** 寶箱機率 R:SR:SSR = 60:40:20(換算成 50% / 33% / 17%),開箱時在畫面上公開顯示。 */
const CHEST_WEIGHTS = { R: 60, SR: 40, SSR: 20 } as const;
const WEIGHT_SUM = CHEST_WEIGHTS.R + CHEST_WEIGHTS.SR + CHEST_WEIGHTS.SSR;
export const CHEST_RATES: Readonly<Record<'R' | 'SR' | 'SSR', number>> = {
  R: CHEST_WEIGHTS.R / WEIGHT_SUM,
  SR: CHEST_WEIGHTS.SR / WEIGHT_SUM,
  SSR: CHEST_WEIGHTS.SSR / WEIGHT_SUM,
};

export function chestRatesText(): string {
  const pct = (r: number): number => Math.round(r * 100);
  const rates = `R ${pct(CHEST_RATES.R)}% / SR ${pct(CHEST_RATES.SR)}% / SSR ${pct(CHEST_RATES.SSR)}%`;
  return tr(`機率 ${rates}`, `Odds ${rates}`);
}

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
