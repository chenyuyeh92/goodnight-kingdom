import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';
import { owlPhase } from './owl';

export type LionMode = 'idle' | 'windup' | 'leap' | 'return' | 'angry';
export type LionAttack = 'roar' | 'pounce' | 'stampede';

/** 招式輪流:獅吼 → 撲過來 → 叫獸群衝過來(第一階段改成再吼一次)。 */
export const LION_ATTACKS: readonly LionAttack[] = ['roar', 'pounce', 'stampede'];

export interface LionBrain {
  mode: LionMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  pending: LionAttack;
}

export interface LionSense {
  x: number;
  grounded: boolean;
  hpRatio: number;
  targetX: number | null;
  homeX: number;
  halfW: number;
  arenaLeft: number;
  arenaRight: number;
  minionsAlive: number;
  dtMs: number;
}

export interface LionStep {
  vx: number | null;
  vy: number | null;
  brain: LionBrain;
  /** 獅吼的音波:高度(中心 y)與速度,往玩家那邊飛。 */
  roars: { y: number; speed: number }[];
  /** 落地時往左右送出的震波。 */
  waves: (1 | -1)[];
  /** 叫一群角馬從左邊(玩家背後)衝過來。 */
  stampede: boolean;
  summon: boolean;
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

const IDLE_MS = { 1: 2000, 2: 1600, 3: 1300 } as const;
export const LION_WINDUP_MS = 600;
/** 低的音波要跳過,高的站著就從頭上飛過去(飛在榮耀岩的岩石上面,不會撞到岩石就不見)。 */
export const ROAR_LOW_Y = GROUND_Y - 22;
export const ROAR_HIGH_Y = GROUND_Y - 120;
const ROARS = [
  { y: ROAR_LOW_Y, speed: 260 },
  { y: ROAR_HIGH_Y, speed: 220 },
  { y: ROAR_LOW_Y, speed: 180 },
  { y: ROAR_HIGH_Y, speed: 240 },
  { y: ROAR_LOW_Y, speed: 150 },
] as const;
const ROAR_COUNT = { 1: 3, 2: 4, 3: 5 } as const;
const LEAP_VY = -720;
const LEAP_S = 0.95;
const LEAP_MIN_MS = 250;
const RETURN_SPEED = 160;
const ANGRY_MS = 1000;
const SHAKE = 40;
const MAX_MINIONS = 3;

export function initialLionBrain(): LionBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0, pending: 'roar' };
}

/** 失眠獅子王:站在榮耀岩右邊,輪流獅吼(音波有高有低)、撲到玩家那邊落地震出震波、叫獸群從背後衝過來。 */
export function stepLion(b: LionBrain, s: LionSense): LionStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { roars: [], waves: [], stampede: false, summon: false, enteredPhase: null, invulnerable: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase && (b.mode === 'idle' || b.mode === 'angry')) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: SHAKE, vy: null, brain: { ...b, mode: 'angry', timerMs: 0, phase }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  switch (b.mode) {
    case 'angry': {
      if (timerMs >= ANGRY_MS) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'idle', timerMs: 0 } };
      const vx = Math.floor(timerMs / 100) % 2 === 0 ? SHAKE : -SHAKE;
      return { ...none, vx, vy: null, invulnerable: true, brain: { ...b, timerMs } };
    }
    case 'idle': {
      if (timerMs < IDLE_MS[b.phase] || s.targetX === null) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs: Math.min(timerMs, IDLE_MS[b.phase]) } };
      let pending = LION_ATTACKS[b.attacks % LION_ATTACKS.length];
      if (pending === 'stampede' && b.phase === 1) pending = 'roar';
      const attacks = b.attacks + 1;
      const summon = b.phase >= 2 && attacks % 2 === 0 && s.minionsAlive < MAX_MINIONS;
      return { ...none, vx: 0, vy: null, summon, brain: { ...b, mode: 'windup', timerMs: 0, attacks, pending } };
    }
    case 'windup': {
      if (timerMs < LION_WINDUP_MS) {
        const vx = Math.floor(timerMs / 80) % 2 === 0 ? SHAKE : -SHAKE;
        return { ...none, vx, vy: null, brain: { ...b, timerMs } };
      }
      const done = { ...b, mode: 'idle' as const, timerMs: 0 };
      if (b.pending === 'roar') return { ...none, vx: 0, vy: null, roars: ROARS.slice(0, ROAR_COUNT[b.phase]).map((r) => ({ ...r })), brain: done };
      if (b.pending === 'stampede') return { ...none, vx: 0, vy: null, stampede: true, brain: done };
      const tx = s.targetX ?? s.x - 300;
      const land = Math.min(Math.max(tx, s.arenaLeft + s.halfW), s.arenaRight - s.halfW);
      return { ...none, vx: (land - s.x) / LEAP_S, vy: LEAP_VY, brain: { ...b, mode: 'leap', timerMs: 0 } };
    }
    case 'leap': {
      if (timerMs >= LEAP_MIN_MS && s.grounded) return { ...none, vx: 0, vy: null, waves: [-1, 1], brain: { ...b, mode: 'return', timerMs: 0 } };
      return { ...none, vx: null, vy: null, brain: { ...b, timerMs } };
    }
    case 'return': {
      if (Math.abs(s.homeX - s.x) <= 10) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'idle', timerMs: 0 } };
      return { ...none, vx: Math.sign(s.homeX - s.x) * RETURN_SPEED, vy: null, brain: { ...b, timerMs } };
    }
  }
}
