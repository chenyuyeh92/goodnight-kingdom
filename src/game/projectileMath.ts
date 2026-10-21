import { MAX_DT_MS } from '../config/tuning';
import { bulletVelocity } from './fire';
import type { Aim, Facing } from './playerMotor';

export const HOMING_TURN_DEG_PER_SEC = 360;
export const BOOMERANG_OUT_MS = 400;

const DEG = Math.PI / 180;

/** 以瞄準方向為中心,在 ±spreadDeg/2 之間平均分布 count 發。 */
export function pelletVelocities(aim: Aim, facing: Facing, speed: number, count: number, spreadDeg: number): { vx: number; vy: number }[] {
  const center = bulletVelocity(aim, facing, speed);
  const base = Math.atan2(center.vy, center.vx);
  return Array.from({ length: count }, (_, i) => {
    const offset = count === 1 ? 0 : (-spreadDeg / 2 + (spreadDeg * i) / (count - 1)) * DEG;
    return { vx: Math.cos(base + offset) * speed, vy: Math.sin(base + offset) * speed };
  });
}

/** 把速度方向往目標轉,每秒最多轉 maxTurnDegPerSec 度,速率不變。 */
export function steerToward(
  vx: number,
  vy: number,
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  maxTurnDegPerSec: number,
  dtMs: number,
): { vx: number; vy: number } {
  const speed = Math.hypot(vx, vy);
  const current = Math.atan2(vy, vx);
  const wanted = Math.atan2(targetY - fromY, targetX - fromX);
  let diff = wanted - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const maxTurn = maxTurnDegPerSec * DEG * (Math.min(dtMs, MAX_DT_MS) / 1000);
  const angle = current + Math.max(-maxTurn, Math.min(maxTurn, diff));
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

/** 飛出去 400ms 後以原速率飛回主人;主人不在時沿原方向飛走。 */
export function boomerangVelocity(
  ageMs: number,
  initial: { vx: number; vy: number },
  pos: { x: number; y: number },
  owner: { x: number; y: number } | null,
): { vx: number; vy: number } {
  if (ageMs < BOOMERANG_OUT_MS || owner === null) return initial;
  const speed = Math.hypot(initial.vx, initial.vy);
  const dx = owner.x - pos.x;
  const dy = owner.y - pos.y;
  const d = Math.hypot(dx, dy) || 1;
  return { vx: (dx / d) * speed, vy: (dy / d) * speed };
}
