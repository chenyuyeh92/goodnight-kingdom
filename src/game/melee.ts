import { MAX_DT_MS } from '../config/tuning';
import { initialFireState, stepFire, type FireState } from './fire';
import type { Aim, Facing } from './playerMotor';

/** 枕頭揮擊:傷害是泡泡的 5 倍。 */
export const MELEE_DAMAGE = 5;
export const MELEE_REACH = 36;
export const MELEE_COOLDOWN_MS = 300;
const PLAYER_HALF_W = 14;

export interface MeleeReach {
  x: number;
  feetY: number;
  h: number;
  facing: Facing;
  aim: Aim;
}

export interface MeleeCandidate {
  x: number;
  w: number;
  top: number;
  bottom: number;
}

/** 回傳面前近身範圍內最近的目標索引;只有往前攻擊時才會揮擊。 */
export function meleeTarget(p: MeleeReach, candidates: readonly MeleeCandidate[]): number | null {
  if (p.aim !== 'forward') return null;
  let best: number | null = null;
  let bestDx = Infinity;
  candidates.forEach((c, i) => {
    const dx = (c.x - p.x) * p.facing;
    if (dx <= 0) return;
    if (dx - c.w / 2 - PLAYER_HALF_W > MELEE_REACH) return;
    if (c.top >= p.feetY || c.bottom <= p.feetY - p.h) return;
    if (dx < bestDx) {
      bestDx = dx;
      best = i;
    }
  });
  return best;
}

export interface AttackState {
  fire: FireState;
  meleeCooldownMs: number;
}

export function initialAttackState(): AttackState {
  return { fire: initialFireState(), meleeCooldownMs: 0 };
}

/** 按射擊時:有近身目標就揮擊(有自己的冷卻),否則照常射泡泡。 */
export function stepAttack(
  s: AttackState,
  shootHeld: boolean,
  hasMeleeTarget: boolean,
  dtMs: number,
  fireIntervalMs: number,
): { state: AttackState; action: 'none' | 'bullet' | 'melee' } {
  const meleeCooldownMs = Math.max(0, s.meleeCooldownMs - Math.min(dtMs, MAX_DT_MS));
  if (shootHeld && hasMeleeTarget) {
    const fire = stepFire(s.fire, false, dtMs, fireIntervalMs).state;
    if (meleeCooldownMs === 0) {
      // 揮擊後收招,這段時間內也不會射泡泡。
      const recovered = { cooldownMs: Math.max(fire.cooldownMs, MELEE_COOLDOWN_MS) };
      return { state: { fire: recovered, meleeCooldownMs: MELEE_COOLDOWN_MS }, action: 'melee' };
    }
    return { state: { fire, meleeCooldownMs }, action: 'none' };
  }
  const shot = stepFire(s.fire, shootHeld, dtMs, fireIntervalMs);
  return { state: { fire: shot.state, meleeCooldownMs }, action: shot.fired ? 'bullet' : 'none' };
}
