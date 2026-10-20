import { MAX_DT_MS } from '../config/tuning';
import type { Aim, Facing } from './playerMotor';

export interface FireState {
  cooldownMs: number;
}

export function initialFireState(): FireState {
  return { cooldownMs: 0 };
}

/** 點一下立刻發射;按住則每 intervalMs 一發。 */
export function stepFire(
  s: FireState,
  shootHeld: boolean,
  dtMs: number,
  intervalMs: number,
): { state: FireState; fired: boolean } {
  const cooldownMs = Math.max(0, s.cooldownMs - Math.min(dtMs, MAX_DT_MS));
  if (shootHeld && cooldownMs === 0) return { state: { cooldownMs: intervalMs }, fired: true };
  return { state: { cooldownMs }, fired: false };
}

export function bulletVelocity(aim: Aim, facing: Facing, speed: number): { vx: number; vy: number } {
  if (aim === 'up') return { vx: 0, vy: -speed };
  if (aim === 'down') return { vx: 0, vy: speed };
  return { vx: facing * speed, vy: 0 };
}

/** 相對於角色腳底中央的槍口位置。 */
export function muzzleOffset(aim: Aim, facing: Facing, crouching: boolean): { x: number; y: number } {
  if (aim === 'up') return { x: facing * 4, y: -50 };
  if (aim === 'down') return { x: 0, y: 2 };
  return crouching ? { x: facing * 16, y: -14 } : { x: facing * 16, y: -30 };
}
