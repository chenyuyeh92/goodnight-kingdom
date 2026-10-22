import { MAX_DT_MS } from '../config/tuning';
import { arcShot } from './enemies';
import { yetiIcicles } from './yeti';

export type GoatMode = 'walk' | 'windup' | 'charge' | 'dizzy' | 'rest';

export interface GoatBrain {
  mode: GoatMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是低頭衝撞(true)還是踢石頭(false)。 */
  chargeNext: boolean;
}

export interface GoatSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  footX: number;
  footY: number;
  halfW: number;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface GoatStep {
  vx: number;
  brain: GoatBrain;
  /** 撞到山壁後從上面滾下來的石頭(先有影子)。 */
  rocks: number[];
  /** 踢過來的石頭(拋物線)。 */
  kicks: { vx: number; vy: number }[];
}

export const GOAT_WALK_MS = 1600;
export const GOAT_WINDUP_MS = 500;
/** 撞到山壁後頭暈,這時可以盡量打。 */
export const GOAT_DIZZY_MS = 1200;
const REST_MS = 600;
const WALK_SPEED = 55;
const KEEP = 300;
export const CHARGE_SPEED = 380;
/** 衝太久還沒撞到(不該發生)就停下來。 */
const CHARGE_MAX_MS = 3000;
const ANGRY_RATIO = 0.5;
export const ROCK_GRAVITY = 800;
const KICK_SPREAD = 100;

export function initialGoatBrain(): GoatBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, chargeNext: true };
}

/**
 * 熬夜山羊:走一走 → 輪流「低頭往玩家那邊衝,一路撞到山壁(頭暈 1.2 秒可以打),山上滾下石頭」
 * 與「踢石頭過來(拋物線)」。躲衝撞:站到雲朵平台上,或跳過去。血量一半以下石頭 5 顆。
 */
export function stepGoat(b: GoatBrain, s: GoatSense): GoatStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const n = s.hpRatio <= ANGRY_RATIO ? 5 : 3;
  const none = { rocks: [], kicks: [] };

  switch (b.mode) {
    case 'walk': {
      if (timerMs >= GOAT_WALK_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > KEEP;
      return { ...none, vx: far ? toward * WALK_SPEED : 0, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < GOAT_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      if (b.chargeNext) return { ...none, vx: b.facing * CHARGE_SPEED, brain: { ...b, mode: 'charge', timerMs: 0 } };
      const tx = s.targetX ?? s.x + b.facing * 300;
      const kicks = Array.from({ length: n }, (_, i) =>
        arcShot(s.footX, s.footY, tx + (i - (n - 1) / 2) * KICK_SPREAD, s.targetY ?? s.footY, ROCK_GRAVITY),
      );
      return { ...none, vx: 0, kicks, brain: { ...b, mode: 'rest', timerMs: 0, chargeNext: true } };
    }
    case 'charge': {
      const hitWall = b.facing < 0 ? s.x <= s.arenaLeft + s.halfW + 4 : s.x >= s.arenaRight - s.halfW - 4;
      if (hitWall || timerMs >= CHARGE_MAX_MS) {
        const rocks = hitWall ? yetiIcicles(n, s.targetX ?? s.x, s.arenaLeft + 30, s.arenaRight - 30) : [];
        return { ...none, vx: 0, rocks, brain: { ...b, mode: 'dizzy', timerMs: 0, chargeNext: false } };
      }
      return { ...none, vx: b.facing * CHARGE_SPEED, brain: { ...b, timerMs } };
    }
    case 'dizzy': {
      if (timerMs >= GOAT_DIZZY_MS) return { ...none, vx: 0, brain: { ...b, mode: 'rest', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
