import type { Span } from './water';

/** 強風一陣:先慢慢變強 0.4 秒,吹 2 秒,停 1.6 秒(停的時候趕快往前走)。 */
export const WIND_RAMP_MS = 400;
export const WIND_ON_MS = 2400;
export const WIND_CYCLE_MS = 4000;
/** 風區的風把人往左推的速度(走路 230,逆風還走得動)。 */
export const WIND_PUSH = 130;
/** 雷鳥拍翅膀颳的強風比較強。 */
export const BOSS_GUST_PUSH = 190;

/** 這個時間點風有多強(0–1)。 */
export function windStrength(tMs: number): number {
  const t = ((tMs % WIND_CYCLE_MS) + WIND_CYCLE_MS) % WIND_CYCLE_MS;
  if (t < WIND_RAMP_MS) return t / WIND_RAMP_MS;
  if (t < WIND_ON_MS) return 1;
  return 0;
}

export function inWind(x: number, zones: readonly Span[]): boolean {
  return zones.some((z) => x >= z.x && x <= z.x + z.w);
}

/** 被風推之後的水平速度:往左推 push × 強度(在地上、在空中都一樣)。 */
export function windVx(vx: number, push: number, strength: number): number {
  return vx - push * strength;
}
