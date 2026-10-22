import { MAX_DT_MS } from '../config/tuning';
import type { Span } from './water';

/** 黑暗有多黑(0 是全亮、1 是全黑);火螢女王閃光後更黑一下。 */
export const DARK_ALPHA = 0.9;
export const BLACKOUT_ALPHA = 0.97;
/** 走進、走出黑暗區時慢慢變暗、變亮(每秒變化多少)。 */
const FADE_PER_S = 1.5;
/** 各種光的半徑:玩家身邊、發光水晶、會發光的魔物、巨鼴鼠的頭燈。 */
export const LIGHT_RADIUS = { player: 170, crystal: 115, queen: 130, firefly: 95, moth: 70, headlamp: 150 } as const;
/** 火螢女王閃光後一陣子,玩家身邊只剩這麼大。 */
export const BLACKOUT_PLAYER_RADIUS = 95;

export function inDark(x: number, zones: readonly Span[]): boolean {
  return zones.some((z) => x >= z.x && x <= z.x + z.w);
}

/** 黑暗的濃度慢慢追上目標(走進黑暗區變暗、走出去變亮)。 */
export function fadeDark(prev: number, target: number, dtMs: number): number {
  const step = (FADE_PER_S * Math.min(dtMs, MAX_DT_MS)) / 1000;
  if (Math.abs(target - prev) <= step) return target;
  return prev + Math.sign(target - prev) * step;
}
