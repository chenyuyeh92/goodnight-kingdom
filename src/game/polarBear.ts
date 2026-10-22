import { MAX_DT_MS } from '../config/tuning';
import { ENEMY_DEFS } from './enemies';

export type BearMode = 'walk' | 'slide' | 'windup' | 'rest';

export interface BearBrain {
  mode: BearMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是肚子滑過來(true)還是拍地掉冰柱(false)。 */
  slideNext: boolean;
}

export interface BearSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface BearStep {
  vx: number;
  brain: BearBrain;
  /** 拍地後從上面掉下來的冰柱位置。 */
  icicles: number[];
}

export const BEAR_WALK_MS = 1800;
export const BEAR_SLIDE_MS = 1400;
const WINDUP_MS = 500;
const REST_MS = 600;
const WALK_SPEED = 60;
const SLIDE_SPEED = 300;
/** 冰柱:一根對準玩家,其他左右散開。 */
const ICICLE_OFFSETS = { calm: [0, -180, 180], angry: [0, -150, 150, -300] } as const;
const ANGRY_RATIO = 0.5;

export function initialBearBrain(): BearBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, slideNext: true };
}

/** 失眠北極熊:走一走 → 輪流「肚子貼地滑過來」與「拍地讓上面掉冰柱」。 */
export function stepBear(b: BearBrain, s: BearSense): BearStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const half = ENEMY_DEFS.polarBear.w / 2;

  if (b.mode === 'walk') {
    if (timerMs >= BEAR_WALK_MS && s.targetX !== null) {
      if (b.slideNext) return { vx: toward * SLIDE_SPEED, icicles: [], brain: { ...b, mode: 'slide', timerMs: 0, facing: toward } };
      return { vx: 0, icicles: [], brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
    }
    const near = s.targetX === null || Math.abs(s.targetX - s.x) < 200;
    return { vx: near ? 0 : toward * WALK_SPEED, icicles: [], brain: { ...b, timerMs, facing: toward } };
  }
  if (b.mode === 'slide') {
    if (timerMs >= BEAR_SLIDE_MS) return { vx: 0, icicles: [], brain: { ...b, mode: 'rest', timerMs: 0, slideNext: false } };
    let facing = b.facing;
    if (s.x <= s.arenaLeft + half + 2) facing = 1;
    if (s.x >= s.arenaRight - half - 2) facing = -1;
    return { vx: facing * SLIDE_SPEED, icicles: [], brain: { ...b, timerMs, facing } };
  }
  if (b.mode === 'windup') {
    if (timerMs < WINDUP_MS) return { vx: 0, icicles: [], brain: { ...b, timerMs } };
    const tx = s.targetX ?? s.x + b.facing * 300;
    const offsets = s.hpRatio <= ANGRY_RATIO ? ICICLE_OFFSETS.angry : ICICLE_OFFSETS.calm;
    const icicles = offsets.map((o) => Math.min(Math.max(tx + o, s.arenaLeft + 30), s.arenaRight - 30));
    return { vx: 0, icicles, brain: { ...b, mode: 'rest', timerMs: 0, slideNext: true } };
  }
  if (timerMs >= REST_MS) return { vx: 0, icicles: [], brain: { ...b, mode: 'walk', timerMs: 0 } };
  return { vx: 0, icicles: [], brain: { ...b, timerMs } };
}
