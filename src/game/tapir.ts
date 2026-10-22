import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';
import { owlPhase } from './owl';

export type TapirMode = 'idle' | 'windup' | 'inhale' | 'angry';
export type TapirAttack = 'mist' | 'inhale' | 'summon';

/** 招式輪流:吐惡夢雲 → 吸睡意 → 叫手下(第一階段改成再吐一次惡夢雲)。 */
export const TAPIR_ATTACKS: readonly TapirAttack[] = ['mist', 'inhale', 'summon'];

export interface TapirBrain {
  mode: TapirMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  pending: TapirAttack;
}

export interface TapirSense {
  hpRatio: number;
  targetX: number | null;
  minionsAlive: number;
  dtMs: number;
}

export interface TapirStep {
  vx: number;
  brain: TapirBrain;
  /** 惡夢雲:高度(中心 y)與速度,往玩家那邊慢慢飄。 */
  mist: { y: number; speed: number }[];
  /** 正在用鼻子吸(把玩家往夢貘這邊拉)。 */
  inhaling: boolean;
  /** 叫出來的手下。 */
  summon: ('pillowSoldier' | 'noisyStar')[];
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
}

const IDLE_MS = { 1: 2000, 2: 1700, 3: 1400 } as const;
export const TAPIR_WINDUP_MS = 600;
export const INHALE_MS = 2000;
/** 吸的力量:把玩家往夢貘這邊拉(走路 230,往反方向跑還跑得掉)。 */
export const INHALE_PULL = 140;
/** 三個階段越來越大(圖放大)。 */
export const TAPIR_SCALE = { 1: 1, 2: 1.12, 3: 1.25 } as const;
export const MIST_LOW_Y = GROUND_Y - 22;
export const MIST_HIGH_Y = GROUND_Y - 105;
const MIST = [
  { y: MIST_LOW_Y, speed: 170 },
  { y: MIST_HIGH_Y, speed: 135 },
  { y: MIST_LOW_Y, speed: 110 },
  { y: MIST_HIGH_Y, speed: 155 },
  { y: MIST_LOW_Y, speed: 90 },
] as const;
const MIST_COUNT = { 1: 3, 2: 4, 3: 5 } as const;
const ANGRY_MS = 1000;
const SHAKE = 40;
const MAX_MINIONS = 3;

export function initialTapirBrain(): TapirBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0, pending: 'mist' };
}

/**
 * 偷走睡意的夢貘(最終魔王):站在月光王座右邊,輪流吐惡夢雲(有高有低)、用鼻子把玩家吸過來 2 秒、
 * 叫手下(第二階段起);三個階段越來越大,換階段發抖打不動。
 */
export function stepTapir(b: TapirBrain, s: TapirSense): TapirStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { mist: [], inhaling: false, summon: [], enteredPhase: null, invulnerable: false };

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
      let pending = TAPIR_ATTACKS[b.attacks % TAPIR_ATTACKS.length];
      if (pending === 'summon' && b.phase === 1) pending = 'mist';
      return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, attacks: b.attacks + 1, pending } };
    }
    case 'windup': {
      if (timerMs < TAPIR_WINDUP_MS) {
        const vx = Math.floor(timerMs / 80) % 2 === 0 ? SHAKE : -SHAKE;
        return { ...none, vx, brain: { ...b, timerMs } };
      }
      const done = { ...b, mode: 'idle' as const, timerMs: 0 };
      if (b.pending === 'mist') return { ...none, vx: 0, mist: MIST.slice(0, MIST_COUNT[b.phase]).map((m) => ({ ...m })), brain: done };
      if (b.pending === 'inhale') return { ...none, vx: 0, inhaling: true, brain: { ...b, mode: 'inhale', timerMs: 0 } };
      const room = Math.max(0, MAX_MINIONS - s.minionsAlive);
      const summon = (['pillowSoldier', 'noisyStar'] as const).slice(0, Math.min(2, room));
      return { ...none, vx: 0, summon: [...summon], brain: done };
    }
    case 'inhale': {
      if (timerMs >= INHALE_MS) return { ...none, vx: 0, brain: { ...b, mode: 'idle', timerMs: 0 } };
      return { ...none, vx: 0, inhaling: true, brain: { ...b, timerMs } };
    }
  }
}
