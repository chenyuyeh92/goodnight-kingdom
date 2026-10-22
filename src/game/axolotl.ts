import { MAX_DT_MS } from '../config/tuning';

export type AxolotlMode = 'swim' | 'windup' | 'rest';

export interface AxolotlBrain {
  mode: AxolotlMode;
  timerMs: number;
  facing: 1 | -1;
  /** 多久沒被打了(超過一段時間就慢慢回血)。 */
  calmMs: number;
  /** 回血計時。 */
  healMs: number;
}

export interface AxolotlSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  mouthX: number;
  mouthY: number;
  /** 這一格有沒有被打到(扣血)。 */
  hurt: boolean;
  dtMs: number;
}

export interface AxolotlStep {
  vx: number;
  brain: AxolotlBrain;
  bubbles: { vx: number; vy: number }[];
  /** 這一格回幾點血。 */
  heal: number;
}

export const AXOLOTL_SWIM_MS = 2000;
export const AXOLOTL_WINDUP_MS = 500;
const REST_MS = 700;
const SWIM_SPEED = 55;
const KEEP = 280;
/** 3 秒沒被打就開始回血,每 0.6 秒回 1 點。 */
export const HEAL_AFTER_MS = 3000;
export const HEAL_EVERY_MS = 600;
const BUBBLES = { calm: 3, angry: 5 } as const;
const BUBBLE_SPEED = 120;
const BUBBLE_SPREAD_DEG = 50;
const ANGRY_RATIO = 0.5;

export function initialAxolotlBrain(): AxolotlBrain {
  return { mode: 'swim', timerMs: 0, facing: -1, calmMs: 0, healMs: 0 };
}

/**
 * 失眠六角恐龍:在地底湖邊慢慢游,輪流吐一串慢慢飄的水泡(3 顆,血量一半以下 5 顆);
 * 3 秒沒被打就慢慢回血(要一直打它)。
 */
export function stepAxolotl(b: AxolotlBrain, s: AxolotlSense): AxolotlStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const calmMs = s.hurt ? 0 : b.calmMs + dt;
  let healMs = s.hurt || calmMs < HEAL_AFTER_MS || s.hpRatio >= 1 ? 0 : b.healMs + dt;
  let heal = 0;
  if (healMs >= HEAL_EVERY_MS) {
    heal = 1;
    healMs -= HEAL_EVERY_MS;
  }
  const base = { ...b, calmMs, healMs };
  const none = { bubbles: [], heal };

  switch (b.mode) {
    case 'swim': {
      if (timerMs >= AXOLOTL_SWIM_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...base, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > KEEP;
      return { ...none, vx: far ? toward * SWIM_SPEED : 0, brain: { ...base, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < AXOLOTL_WINDUP_MS) return { ...none, vx: 0, brain: { ...base, timerMs } };
      const n = s.hpRatio <= ANGRY_RATIO ? BUBBLES.angry : BUBBLES.calm;
      const aim = Math.atan2((s.targetY ?? s.mouthY) - s.mouthY, (s.targetX ?? s.x + b.facing * 300) - s.mouthX);
      const bubbles = Array.from({ length: n }, (_, i) => {
        const a = aim + (((i - (n - 1) / 2) / Math.max(n - 1, 1)) * BUBBLE_SPREAD_DEG * Math.PI) / 180;
        return { vx: Math.cos(a) * BUBBLE_SPEED, vy: Math.sin(a) * BUBBLE_SPEED };
      });
      return { ...none, vx: 0, bubbles, brain: { ...base, mode: 'rest', timerMs: 0 } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...base, mode: 'swim', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...base, timerMs } };
    }
  }
}
