import { MAX_DT_MS } from '../config/tuning';

export const MAX_HEARTS = 3;
export const HIT_INVULN_MS = 1000;
export const REVIVE_DELAY_MS = 3000;
export const REVIVE_INVULN_MS = 1500;
export const RESTART_DELAY_MS = 800;

export interface Health {
  hearts: number;
  invulnMs: number;
  /** 愛心用完就「睡著」。 */
  down: boolean;
  downMs: number;
}

export function freshHealth(invulnMs = 0): Health {
  return { hearts: MAX_HEARTS, invulnMs, down: false, downMs: 0 };
}

/** 無敵或睡著時不扣愛心。 */
export function applyHit(h: Health): { health: Health; hit: boolean; wentDown: boolean } {
  if (h.down || h.invulnMs > 0) return { health: h, hit: false, wentDown: false };
  const hearts = h.hearts - 1;
  if (hearts <= 0) {
    return { health: { hearts: 0, invulnMs: HIT_INVULN_MS, down: true, downMs: 0 }, hit: true, wentDown: true };
  }
  return { health: { ...h, hearts, invulnMs: HIT_INVULN_MS }, hit: true, wentDown: false };
}

export function tickHealth(h: Health, dtMs: number): Health {
  const dt = Math.min(dtMs, MAX_DT_MS);
  return {
    ...h,
    invulnMs: Math.max(0, h.invulnMs - dt),
    downMs: h.down ? h.downMs + dt : h.downMs,
  };
}
