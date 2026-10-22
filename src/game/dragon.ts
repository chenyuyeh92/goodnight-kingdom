import { MAX_DT_MS } from '../config/tuning';
import { arcShot } from './enemies';
import { owlPhase } from './owl';
import { yetiIcicles } from './yeti';

export type DragonMode = 'idle' | 'windup' | 'angry';
export type DragonAttack = 'fireballs' | 'eruption' | 'breath';

/** 招式輪流:吐火球 → 火山噴發 → 噴火(第一階段改成再吐一次火球)。 */
export const DRAGON_ATTACKS: readonly DragonAttack[] = ['fireballs', 'eruption', 'breath'];

export interface DragonBrain {
  mode: DragonMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  /** 預備中的是哪一招。 */
  pending: DragonAttack;
}

export interface DragonSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  mouthX: number;
  mouthY: number;
  arenaLeft: number;
  arenaRight: number;
  minionsAlive: number;
  dtMs: number;
}

export interface DragonStep {
  vx: number;
  brain: DragonBrain;
  fireballs: { vx: number; vy: number }[];
  rocks: number[];
  /** 沿著地面燒過去的火焰(往玩家那邊)。 */
  flames: { dir: 1 | -1; delayMs: number }[];
  summon: boolean;
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

/** 火球的重力。 */
export const FIREBALL_GRAVITY = 800;
const IDLE_MS = { 1: 2000, 2: 1600, 3: 1200 } as const;
export const DRAGON_WINDUP_MS = 600;
const FIREBALLS = { 1: 3, 2: 4, 3: 5 } as const;
const FIREBALL_SPREAD = 90;
const ROCKS = { 1: 3, 2: 4, 3: 5 } as const;
const FLAMES = { 1: 1, 2: 1, 3: 2 } as const;
const FLAME_GAP_MS = 550;
const ANGRY_MS = 1000;
const SHAKE = 40;
const MAX_MINIONS = 3;

export function initialDragonBrain(): DragonBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0, pending: 'fireballs' };
}

/** 熬夜火龍:站在火山口右邊,輪流吐火球、火山噴發掉落石、噴火沿地面燒過來;血量越少越暴躁。 */
export function stepDragon(b: DragonBrain, s: DragonSense): DragonStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { fireballs: [], rocks: [], flames: [], summon: false, enteredPhase: null, invulnerable: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase && (b.mode === 'idle' || b.mode === 'angry')) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: SHAKE, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  switch (b.mode) {
    case 'angry': {
      if (timerMs >= ANGRY_MS) return { ...none, vx: 0, brain: { ...b, mode: 'idle', timerMs: 0 } };
      const vx = Math.floor(timerMs / 100) % 2 === 0 ? SHAKE : -SHAKE;
      return { ...none, vx, invulnerable: true, brain: { ...b, timerMs } };
    }
    case 'idle': {
      if (timerMs < IDLE_MS[b.phase] || s.targetX === null) return { ...none, vx: 0, brain: { ...b, timerMs: Math.min(timerMs, IDLE_MS[b.phase]) } };
      let pending = DRAGON_ATTACKS[b.attacks % DRAGON_ATTACKS.length];
      if (pending === 'breath' && b.phase === 1) pending = 'fireballs';
      const attacks = b.attacks + 1;
      const summon = b.phase >= 2 && attacks % 2 === 0 && s.minionsAlive < MAX_MINIONS;
      return { ...none, vx: 0, summon, brain: { ...b, mode: 'windup', timerMs: 0, attacks, pending } };
    }
    case 'windup': {
      if (timerMs < DRAGON_WINDUP_MS) {
        const vx = Math.floor(timerMs / 80) % 2 === 0 ? SHAKE : -SHAKE;
        return { ...none, vx, brain: { ...b, timerMs } };
      }
      const tx = s.targetX ?? s.x - 300;
      const done = { ...b, mode: 'idle' as const, timerMs: 0 };
      if (b.pending === 'fireballs') {
        const n = FIREBALLS[b.phase];
        const fireballs = Array.from({ length: n }, (_, i) =>
          arcShot(s.mouthX, s.mouthY, tx + (i - (n - 1) / 2) * FIREBALL_SPREAD, s.targetY ?? s.mouthY + 100, FIREBALL_GRAVITY),
        );
        return { ...none, vx: 0, fireballs, brain: done };
      }
      if (b.pending === 'eruption') return { ...none, vx: 0, rocks: yetiIcicles(ROCKS[b.phase], tx, s.arenaLeft + 30, s.arenaRight - 30), brain: done };
      const dir: 1 | -1 = tx < s.x ? -1 : 1;
      const flames = Array.from({ length: FLAMES[b.phase] }, (_, i) => ({ dir, delayMs: i * FLAME_GAP_MS }));
      return { ...none, vx: 0, flames, brain: done };
    }
  }
}
