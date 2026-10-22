import { MAX_DT_MS } from '../config/tuning';
import { arcShot } from './enemies';
import { yetiIcicles } from './yeti';

export type SlothMode = 'walk' | 'windup' | 'lunge' | 'rest';
export type SlothAttack = 'shake' | 'throw' | 'lunge';

export interface SlothBrain {
  mode: SlothMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是搖樹掉芒果(true)還是丟芒果(false)。 */
  shakeNext: boolean;
  pending: SlothAttack;
}

export interface SlothSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  handX: number;
  handY: number;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface SlothStep {
  vx: number;
  brain: SlothBrain;
  /** 從樹上掉下來的芒果(x 位置,先有影子)。 */
  drops: number[];
  /** 丟出去的芒果(拋物線)。 */
  throws: { vx: number; vy: number }[];
}

export const SLOTH_WALK_MS = 2000;
export const SLOTH_WINDUP_MS = 500;
export const SLOTH_LUNGE_MS = 450;
const REST_MS = 600;
/** 樹懶走得超慢。 */
const WALK_SPEED = 25;
/** 玩家靠這麼近就用爪子掃(往前撲一小段)。 */
export const LUNGE_RANGE = 150;
const LUNGE_SPEED = 300;
const ANGRY_RATIO = 0.5;
/** 芒果的重力。 */
export const MANGO_GRAVITY = 800;
const THROW_SPREAD = 100;

export function initialSlothBrain(): SlothBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, shakeNext: true, pending: 'shake' };
}

/**
 * 失眠樹懶(本來最愛睡,現在睡不著):慢慢爬過來,輪流「搖樹讓芒果從上面掉下來(先有影子)」與「丟芒果(拋物線)」;
 * 玩家靠太近就用爪子往前掃一下。血量一半以下芒果 5 顆。
 */
export function stepSloth(b: SlothBrain, s: SlothSense): SlothStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const n = s.hpRatio <= ANGRY_RATIO ? 5 : 3;
  const none = { drops: [], throws: [] };

  switch (b.mode) {
    case 'walk': {
      // 剛掃過就不再連續掃(會輪到搖樹或丟芒果)。
      const near = s.targetX !== null && Math.abs(s.targetX - s.x) < LUNGE_RANGE && b.pending !== 'lunge';
      if (s.targetX !== null && (near || timerMs >= SLOTH_WALK_MS)) {
        const pending: SlothAttack = near ? 'lunge' : b.shakeNext ? 'shake' : 'throw';
        return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward, pending } };
      }
      return { ...none, vx: s.targetX === null ? 0 : toward * WALK_SPEED, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < SLOTH_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      const tx = s.targetX ?? s.x + b.facing * 300;
      if (b.pending === 'lunge') return { ...none, vx: b.facing * LUNGE_SPEED, brain: { ...b, mode: 'lunge', timerMs: 0 } };
      if (b.pending === 'shake') {
        const drops = yetiIcicles(n, tx, s.arenaLeft + 30, s.arenaRight - 30);
        return { ...none, vx: 0, drops, brain: { ...b, mode: 'rest', timerMs: 0, shakeNext: false } };
      }
      const throws = Array.from({ length: n }, (_, i) =>
        arcShot(s.handX, s.handY, tx + (i - (n - 1) / 2) * THROW_SPREAD, s.targetY ?? s.handY + 100, MANGO_GRAVITY),
      );
      return { ...none, vx: 0, throws, brain: { ...b, mode: 'rest', timerMs: 0, shakeNext: true } };
    }
    case 'lunge': {
      if (timerMs >= SLOTH_LUNGE_MS) return { ...none, vx: 0, brain: { ...b, mode: 'rest', timerMs: 0 } };
      return { ...none, vx: b.facing * LUNGE_SPEED, brain: { ...b, timerMs } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
