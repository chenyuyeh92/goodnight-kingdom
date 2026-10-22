import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';

export type PeacockMode = 'walk' | 'windup' | 'rest';

export interface PeacockBrain {
  mode: PeacockMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是開屏(true)還是羽毛飛鏢(false)。 */
  fanNext: boolean;
}

export interface PeacockSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  dtMs: number;
}

export interface PeacockStep {
  vx: number;
  brain: PeacockBrain;
  /** 開屏:尾羽發光,玩家左右顛倒一陣子。 */
  fan: boolean;
  /** 羽毛飛鏢:高度(中心 y)、速度、往哪邊。 */
  darts: { y: number; speed: number; dir: 1 | -1 }[];
}

export const PEACOCK_WALK_MS = 1800;
export const PEACOCK_WINDUP_MS = 600;
/** 開屏後左右顛倒多久。 */
export const REVERSE_MS = 2500;
const REST_MS = 700;
const WALK_SPEED = 50;
const KEEP = 300;
/** 低的飛鏢要跳過,高的站著就從頭上飛過去。 */
export const DART_LOW_Y = GROUND_Y - 22;
export const DART_HIGH_Y = GROUND_Y - 100;
const DARTS = [
  { y: DART_LOW_Y, speed: 300 },
  { y: DART_HIGH_Y, speed: 250 },
  { y: DART_LOW_Y, speed: 210 },
  { y: DART_HIGH_Y, speed: 280 },
  { y: DART_LOW_Y, speed: 170 },
] as const;
const ANGRY_RATIO = 0.5;

export function initialPeacockBrain(): PeacockBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, fanNext: true };
}

/**
 * 熬夜孔雀:走一走 → 輪流「開屏,尾羽發光,玩家左右顛倒 2.5 秒」與「射羽毛飛鏢,有高有低(3 支,血量一半以下 5 支)」。
 */
export function stepPeacock(b: PeacockBrain, s: PeacockSense): PeacockStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const none = { fan: false, darts: [] };

  switch (b.mode) {
    case 'walk': {
      if (timerMs >= PEACOCK_WALK_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > KEEP;
      return { ...none, vx: far ? toward * WALK_SPEED : 0, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < PEACOCK_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      if (b.fanNext) return { ...none, vx: 0, fan: true, brain: { ...b, mode: 'rest', timerMs: 0, fanNext: false } };
      const n = s.hpRatio <= ANGRY_RATIO ? 5 : 3;
      const darts = DARTS.slice(0, n).map((d) => ({ ...d, dir: b.facing }));
      return { ...none, vx: 0, darts, brain: { ...b, mode: 'rest', timerMs: 0, fanNext: true } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}

/** 左右顛倒:按左往右、按右往左(上下、跳、射照常)。 */
export function reverseIntent<T extends { left: boolean; right: boolean }>(intent: T): T {
  return { ...intent, left: intent.right, right: intent.left };
}
