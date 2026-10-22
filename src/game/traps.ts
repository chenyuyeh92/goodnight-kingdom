import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y, type Rect } from '../levels/levelDef';

/** 壓力板:踩到後 drops 這些位置會掉沙磚。 */
export interface PlateDef {
  x: number;
  /** 沙磚掉落的中心 x。 */
  drops: readonly number[];
}

export const PLATE_W = 40;
/** 壓力板觸發後要等這麼久才能再觸發。 */
export const PLATE_COOLDOWN_MS = 3000;
/** 沙磚掉下來前,地上的影子與搖晃預告時間。 */
export const BLOCK_WARN_MS = 700;
export const BLOCK_FALL_VY = 650;
/** 落地後當平台多久才碎掉。 */
export const BLOCK_LIFE_MS = 4000;

export interface PlateState {
  cooldownMs: number;
}

/** 有醒著的玩家站在壓力板上、而且冷卻結束就觸發。 */
export function stepPlate(s: PlateState, pressed: boolean, dtMs: number): { state: PlateState; fire: boolean } {
  const cooldownMs = Math.max(0, s.cooldownMs - Math.min(dtMs, MAX_DT_MS));
  if (pressed && cooldownMs === 0) return { state: { cooldownMs: PLATE_COOLDOWN_MS }, fire: true };
  return { state: { cooldownMs }, fire: false };
}

export function onPlate(x: number, feetY: number, grounded: boolean, plate: PlateDef): boolean {
  return grounded && feetY >= GROUND_Y - 2 && Math.abs(x - plate.x) <= PLATE_W / 2;
}

/**
 * 沙磚(寬 w、中心 x)從 fromY(底部)往下掉,會停在哪一個表面的頂端:
 * 平台、已經落地的沙磚或地面,取底部以下最高的那一個。
 */
export function landingTop(x: number, w: number, fromY: number, surfaces: readonly Rect[]): number {
  let top = GROUND_Y;
  for (const r of surfaces) {
    const overlaps = x + w / 2 > r.x && x - w / 2 < r.x + r.w;
    if (overlaps && r.y >= fromY && r.y < top) top = r.y;
  }
  return top;
}
