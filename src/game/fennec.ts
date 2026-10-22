import { MAX_DT_MS } from '../config/tuning';
import { ENEMY_DEFS } from './enemies';

export type FennecMode = 'run' | 'burrow' | 'under' | 'pop' | 'dazed';

export interface FennecBrain {
  mode: FennecMode;
  timerMs: number;
  /** 從沙裡冒出來的位置。 */
  moundX: number;
  facing: 1 | -1;
}

export interface FennecSense {
  x: number;
  grounded: boolean;
  hpRatio: number;
  targetX: number | null;
  arenaLeft: number;
  arenaRight: number;
  /** 身體寬度的一半(獨角鯨也用這套行為);沒有時用耳廓狐的。 */
  halfW?: number;
  /** 每次冒出來都往兩邊丟(巨鼴鼠用爪子挖出石塊);沒有時血量一半以下才丟。 */
  alwaysThrow?: boolean;
  dtMs: number;
}

export interface FennecStep {
  vx: number;
  /** null 表示交給重力。 */
  vy: number | null;
  brain: FennecBrain;
  /** 這一格要瞬間移到的 x(鑽到玩家腳下)。 */
  teleportX: number | null;
  /** 鑽在沙裡:看不見、打不到、碰不到。 */
  hidden: boolean;
  /** 跳出來時往兩邊丟的沙塊。 */
  clumps: { vx: number; vy: number }[];
}

export const FENNEC_RUN_MS = 1500;
export const FENNEC_BURROW_MS = 400;
/** 沙堆預告時間:玩家看到腳下冒沙要趕快走開。 */
export const FENNEC_WARN_MS = 700;
export const FENNEC_DAZED_MS = 1800;
const RUN_SPEED = 200;
const POP_VY = -620;
/** 跳起來後至少這麼久才算落地(避免第一格還貼著地面就判定落地)。 */
const POP_MIN_MS = 200;
const CLUMP = { vx: 220, vy: -420 };
const ANGRY_RATIO = 0.5;

export function initialFennecBrain(): FennecBrain {
  return { mode: 'run', timerMs: 0, moundX: 0, facing: -1 };
}

/**
 * 熬夜耳廓狐:跑 → 鑽進沙裡 → 玩家腳下冒沙堆 → 跳出來 → 頭暈露在外面(可以打)→ 再跑。
 * 熬夜獨角鯨用同一套:在冰上滑 → 潛到冰面下 → 玩家腳下出現冰裂痕 → 用角戳出來 → 暈一下。
 */
export function stepFennec(b: FennecBrain, s: FennecSense): FennecStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const none = { teleportX: null, hidden: false, clumps: [] };
  const facing: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;

  switch (b.mode) {
    case 'run': {
      if (timerMs >= FENNEC_RUN_MS && s.targetX !== null) {
        return { ...none, vx: 0, vy: null, hidden: true, brain: { ...b, mode: 'burrow', timerMs: 0, facing } };
      }
      const vx = s.targetX === null || Math.abs(s.targetX - s.x) < 20 ? 0 : facing * RUN_SPEED;
      return { ...none, vx, vy: null, brain: { ...b, timerMs, facing } };
    }
    case 'burrow': {
      if (timerMs < FENNEC_BURROW_MS) return { ...none, vx: 0, vy: null, hidden: true, brain: { ...b, timerMs } };
      const half = s.halfW ?? ENEMY_DEFS.fennec.w / 2;
      const moundX = Math.min(Math.max(s.targetX ?? s.x, s.arenaLeft + half), s.arenaRight - half);
      return { ...none, vx: 0, vy: null, hidden: true, teleportX: moundX, brain: { ...b, mode: 'under', timerMs: 0, moundX } };
    }
    case 'under': {
      if (timerMs < FENNEC_WARN_MS) return { ...none, vx: 0, vy: null, hidden: true, brain: { ...b, timerMs } };
      const clumps = s.hpRatio <= ANGRY_RATIO || s.alwaysThrow ? [{ vx: -CLUMP.vx, vy: CLUMP.vy }, { ...CLUMP }] : [];
      return { ...none, vx: 0, vy: POP_VY, clumps, brain: { ...b, mode: 'pop', timerMs: 0, facing } };
    }
    case 'pop': {
      if (timerMs >= POP_MIN_MS && s.grounded) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'dazed', timerMs: 0 } };
      return { ...none, vx: 0, vy: null, brain: { ...b, timerMs } };
    }
    case 'dazed': {
      if (timerMs >= FENNEC_DAZED_MS) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'run', timerMs: 0, facing } };
      return { ...none, vx: 0, vy: null, brain: { ...b, timerMs } };
    }
  }
}
