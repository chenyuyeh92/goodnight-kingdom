import type { Rect } from '../levels/levelDef';

/** 水流(左右推)或氣泡柱(往上送):一塊範圍與推的速度。 */
export interface Current extends Rect {
  vx: number;
  vy: number;
}

const inside = (x: number, y: number, r: Rect): boolean => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** (x, y) 這一點受到的水流,範圍重疊時相加。 */
export function currentAt(x: number, y: number, currents: readonly Current[]): { vx: number; vy: number } {
  let vx = 0;
  let vy = 0;
  for (const c of currents) {
    if (!inside(x, y, c)) continue;
    vx += c.vx;
    vy += c.vy;
  }
  return { vx, vy };
}

/**
 * 套上水流後的速度:左右直接加上去(走路速度每格重算);
 * 氣泡柱往上時,上升速度至少是氣泡柱的速度(不會越疊越快)。
 */
export function pushed(vx: number, vy: number, c: { vx: number; vy: number }): { vx: number; vy: number } {
  return { vx: vx + c.vx, vy: c.vy < 0 ? Math.min(vy, c.vy) : vy + c.vy };
}
