import { GROUND_Y } from '../levels/levelDef';

/** 一段水平範圍:x 起點與寬度。 */
export interface Span {
  x: number;
  w: number;
}

/** 淺水區走路速度的倍數。 */
export const SHALLOW_SPEED = 0.6;
/** 腳掉到地面以下這麼深就算掉進河裡。 */
const FALL_DEPTH = 30;
/** 從河溝左岸往左這麼遠的地方重新出來。 */
const BANK_MARGIN = 40;

const inside = (x: number, s: Span): boolean => x >= s.x && x <= s.x + s.w;

export function inShallow(x: number, shallow: readonly Span[]): boolean {
  return shallow.some((s) => inside(x, s));
}

/** 地面扣掉河溝後剩下的幾段。 */
export function groundSegments(worldW: number, gaps: readonly Span[]): Span[] {
  const out: Span[] = [];
  let x = 0;
  for (const g of [...gaps].sort((a, b) => a.x - b.x)) {
    if (g.x > x) out.push({ x, w: g.x - x });
    x = g.x + g.w;
  }
  if (x < worldW) out.push({ x, w: worldW - x });
  return out;
}

export function fellIntoRiver(feetY: number): boolean {
  return feetY > GROUND_Y + FALL_DEPTH;
}

export function gapAt(x: number, gaps: readonly Span[]): Span | null {
  return gaps.find((g) => inside(x, g)) ?? null;
}

/** 掉進河溝後從左岸重新出來(大家都是往右走,左岸是剛走過的安全地面)。 */
export function respawnX(x: number, gaps: readonly Span[]): number {
  const g = gapAt(x, gaps);
  return g ? g.x - BANK_MARGIN : x;
}
