import { MAX_DT_MS } from '../config/tuning';
import type { Span } from './water';

/** 冰上加速(px/s²):起步慢慢滑起來。 */
export const ICE_ACCEL = 700;
/** 冰上放開或轉向時的減速(px/s²):會滑一段才停。 */
export const ICE_FRICTION = 380;

export function onIce(x: number, ice: readonly Span[]): boolean {
  return ice.some((s) => x >= s.x && x <= s.x + s.w);
}

/**
 * 冰上的水平速度:從上一格的速度慢慢追上想要的速度(加速比減速快一點,放開會滑一段)。
 * 想要的速度是 0 或反方向時用減速度。
 */
export function iceVx(prevVx: number, wantVx: number, dtMs: number): number {
  const dt = Math.min(dtMs, MAX_DT_MS) / 1000;
  const speedingUp = wantVx !== 0 && Math.sign(wantVx) === Math.sign(prevVx || wantVx) && Math.abs(wantVx) > Math.abs(prevVx);
  const rate = (speedingUp ? ICE_ACCEL : ICE_FRICTION) * dt;
  if (Math.abs(wantVx - prevVx) <= rate) return wantVx;
  return prevVx + Math.sign(wantVx - prevVx) * rate;
}
