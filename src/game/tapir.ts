import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';
import { owlPhase } from './owl';

export type TapirMode = 'idle' | 'windup' | 'inhale' | 'angry' | 'nightmare';
export type TapirAttack = 'mist' | 'inhale' | 'summon';

/** 招式輪流:吐惡夢雲 → 吸睡意 → 叫手下(第一階段改成再吐一次惡夢雲)。 */
export const TAPIR_ATTACKS: readonly TapirAttack[] = ['mist', 'inhale', 'summon'];

export interface TapirBrain {
  mode: TapirMode;
  timerMs: number;
  phase: 1 | 2 | 3;
  attacks: number;
  pending: TapirAttack;
  /** 剛換階段:發抖完要放一次「大惡夢」。 */
  nightmareNext: boolean;
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
  /** 惡夢雲:高度(中心 y)與隔多久才吐(一團一團來,跳一次的時間內不會連來兩團),往玩家那邊慢慢飄。 */
  mist: { y: number; delayMs: number }[];
  /** 正在用鼻子吸(把玩家往夢貘這邊拉)。 */
  inhaling: boolean;
  /** 叫出來的手下。 */
  summon: ('pillowSoldier' | 'noisyStar')[];
  enteredPhase: 2 | 3 | null;
  invulnerable: boolean;
  /** 開始集氣放大惡夢(這一格才有):月光安全區多寬、集氣多久。 */
  nightmareStart: { halfW: number; chargeMs: number } | null;
  /** 大惡夢炸開(這一格才有):沒躲進月光的扣 NIGHTMARE_HEARTS 顆愛心。 */
  nightmareBlast: boolean;
}

const IDLE_MS = { 1: 2000, 2: 1700, 3: 1400 } as const;
export const TAPIR_WINDUP_MS = 600;
export const INHALE_MS = 2000;
/** 吸的力量:把玩家往夢貘這邊拉(走路 230,往反方向跑還跑得掉)。 */
export const INHALE_PULL = 140;
/** 三個階段越來越大(圖放大)。 */
export const TAPIR_SCALE = { 1: 1, 2: 1.12, 3: 1.25 } as const;
export const MIST_LOW_Y = GROUND_Y - 22;
/** 高的惡夢雲比關主區的平台底部(360)低一點,不會擦到平台。 */
export const MIST_HIGH_Y = GROUND_Y - 98;
const MIST_HEIGHTS = [MIST_LOW_Y, MIST_HIGH_Y, MIST_LOW_Y, MIST_HIGH_Y, MIST_LOW_Y] as const;
/** 每團一樣快,一團隔 1 秒(比跳一次在空中的時間長)。 */
export const MIST_SPEED = 130;
export const MIST_GAP_MS = 1000;
const MIST_COUNT = { 1: 3, 2: 4, 3: 5 } as const;
const ANGRY_MS = 1000;
const SHAKE = 40;
const MAX_MINIONS = 3;
/** 大惡夢:每次換階段放一次(整場兩次),越後面月光越窄、集氣越短。 */
export const NIGHTMARE_CHARGE_MS = { 2: 3000, 3: 2400 } as const;
export const NIGHTMARE_SAFE_HALF_W = { 2: 80, 3: 60 } as const;
export const NIGHTMARE_HEARTS = 3;

export function initialTapirBrain(): TapirBrain {
  return { mode: 'idle', timerMs: 0, phase: 1, attacks: 0, pending: 'mist', nightmareNext: false };
}

/**
 * 偷走睡意的夢貘(最終魔王):站在月光王座右邊,輪流吐惡夢雲(有高有低)、用鼻子把玩家吸過來 2 秒、
 * 叫手下(第二階段起);三個階段越來越大,換階段發抖打不動。
 * 每次換階段發抖完放一次「大惡夢」:集氣幾秒,整個王座只剩一道月光是安全的,沒躲進去扣 3 顆愛心。
 */
export function stepTapir(b: TapirBrain, s: TapirSense): TapirStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const none = { mist: [], inhaling: false, summon: [], enteredPhase: null, invulnerable: false, nightmareStart: null, nightmareBlast: false };

  const wanted = owlPhase(s.hpRatio);
  if (s.hpRatio > 0 && wanted > b.phase && (b.mode === 'idle' || b.mode === 'angry')) {
    const phase = wanted as 2 | 3;
    return { ...none, vx: SHAKE, brain: { ...b, mode: 'angry', timerMs: 0, phase, nightmareNext: true }, enteredPhase: phase, invulnerable: true };
  }

  const timerMs = b.timerMs + dt;
  switch (b.mode) {
    case 'angry': {
      if (timerMs >= ANGRY_MS) {
        if (b.nightmareNext && b.phase !== 1) {
          const phase = b.phase;
          const nightmareStart = { halfW: NIGHTMARE_SAFE_HALF_W[phase], chargeMs: NIGHTMARE_CHARGE_MS[phase] };
          return { ...none, vx: 0, nightmareStart, brain: { ...b, mode: 'nightmare', timerMs: 0, nightmareNext: false } };
        }
        return { ...none, vx: 0, brain: { ...b, mode: 'idle', timerMs: 0 } };
      }
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
      if (b.pending === 'mist') {
        const n = MIST_COUNT[b.phase];
        // 等雲都吐完才開始算下一招。
        const mist = MIST_HEIGHTS.slice(0, n).map((y, i) => ({ y, delayMs: i * MIST_GAP_MS }));
        return { ...none, vx: 0, mist, brain: { ...done, timerMs: -(n - 1) * MIST_GAP_MS } };
      }
      if (b.pending === 'inhale') return { ...none, vx: 0, inhaling: true, brain: { ...b, mode: 'inhale', timerMs: 0 } };
      const room = Math.max(0, MAX_MINIONS - s.minionsAlive);
      const summon = (['pillowSoldier', 'noisyStar'] as const).slice(0, Math.min(2, room));
      return { ...none, vx: 0, summon: [...summon], brain: done };
    }
    case 'nightmare': {
      const phase = b.phase === 1 ? 2 : b.phase;
      if (timerMs >= NIGHTMARE_CHARGE_MS[phase]) return { ...none, vx: 0, nightmareBlast: true, brain: { ...b, mode: 'idle', timerMs: 0 } };
      // 集氣:慢慢地抖。
      const vx = Math.floor(timerMs / 200) % 2 === 0 ? SHAKE / 2 : -SHAKE / 2;
      return { ...none, vx, brain: { ...b, timerMs } };
    }
    case 'inhale': {
      if (timerMs >= INHALE_MS) return { ...none, vx: 0, brain: { ...b, mode: 'idle', timerMs: 0 } };
      return { ...none, vx: 0, inhaling: true, brain: { ...b, timerMs } };
    }
  }
}
