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
  const remaining = s.cooldownMs - Math.min(dtMs, MAX_DT_MS);
  if (shootHeld && remaining <= 0) {
    // 連射中把不到一格的剩餘時間帶到下一發,射速才不會隨畫面更新率改變;剛按下時從頭算。
    const carry = s.cooldownMs > 0 ? remaining : 0;
    return { state: { cooldownMs: Math.max(0, carry + intervalMs) }, fired: true };
  }
  return { state: { cooldownMs: Math.max(0, remaining) }, fired: false };
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

/** 懷錶:按住集氣、放開射出;射完要等 intervalMs 才能再開始集氣。 */
export interface ChargeState {
  charging: boolean;
  chargeMs: number;
  cooldownMs: number;
}

export function initialChargeState(): ChargeState {
  return { charging: false, chargeMs: 0, cooldownMs: 0 };
}

export function stepCharge(
  s: ChargeState,
  i: { held: boolean; canFire: boolean; dtMs: number; intervalMs: number },
): { state: ChargeState; releaseMs: number | null } {
  const dt = Math.min(i.dtMs, MAX_DT_MS);
  const cooldownMs = Math.max(0, s.cooldownMs - dt);
  if (i.held && i.canFire && (s.charging || cooldownMs === 0)) {
    return { state: { charging: true, chargeMs: s.charging ? s.chargeMs + dt : 0, cooldownMs }, releaseMs: null };
  }
  if (!s.charging) return { state: { ...s, cooldownMs }, releaseMs: null };
  return { state: { charging: false, chargeMs: 0, cooldownMs: i.intervalMs }, releaseMs: s.chargeMs };
}
