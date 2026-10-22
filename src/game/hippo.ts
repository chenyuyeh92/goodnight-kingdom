import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';

export type HippoMode = 'idle' | 'windup' | 'hop';

export interface HippoBrain {
  mode: HippoMode;
  timerMs: number;
  /** 下一招是噴蒸氣(true)還是跳起來砸地(false)。 */
  steamNext: boolean;
}

export interface HippoSense {
  grounded: boolean;
  hpRatio: number;
  targetX: number | null;
  dtMs: number;
}

export interface HippoStep {
  /** null 表示交給重力。 */
  vy: number | null;
  brain: HippoBrain;
  /** 噴出來的蒸氣:高度(中心 y)與往玩家飄的速度。 */
  steam: { y: number; speed: number }[];
  /** 落地時往左右送出的震波。 */
  waves: { dir: 1 | -1; delayMs: number }[];
}

export const HIPPO_IDLE_MS = 1800;
export const HIPPO_WINDUP_MS = 500;
const HOP_VY = -520;
const HOP_MIN_MS = 250;
const ANGRY_RATIO = 0.5;
/** 低的蒸氣要跳過;高的站著就從頭上飄過去(跳起來會撞到)。 */
export const STEAM_LOW_Y = GROUND_Y - 22;
export const STEAM_HIGH_Y = GROUND_Y - 100;
/** 速度不同,飄著飄著就拉開距離,一團一團跳過。 */
const STEAM = [
  { y: STEAM_LOW_Y, speed: 180 },
  { y: STEAM_HIGH_Y, speed: 140 },
  { y: STEAM_LOW_Y, speed: 115 },
  { y: STEAM_HIGH_Y, speed: 160 },
  { y: STEAM_LOW_Y, speed: 90 },
] as const;
const SECOND_WAVE_MS = 450;

export function initialHippoBrain(): HippoBrain {
  return { mode: 'idle', timerMs: 0, steamNext: true };
}

/**
 * 失眠溫泉河馬:泡在溫泉裡(美術的圖連溫泉一起畫,所以不走動),
 * 輪流「噴蒸氣(同時冒白霧)」與「整個跳起來砸地,落地往左右送出震波」。血量一半以下蒸氣 5 團、震波兩道。
 */
export function stepHippo(b: HippoBrain, s: HippoSense): HippoStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const angry = s.hpRatio <= ANGRY_RATIO;
  const none = { steam: [], waves: [] };

  switch (b.mode) {
    case 'idle': {
      if (timerMs >= HIPPO_IDLE_MS && s.targetX !== null) return { ...none, vy: null, brain: { ...b, mode: 'windup', timerMs: 0 } };
      return { ...none, vy: null, brain: { ...b, timerMs: Math.min(timerMs, HIPPO_IDLE_MS) } };
    }
    case 'windup': {
      if (timerMs < HIPPO_WINDUP_MS) return { ...none, vy: null, brain: { ...b, timerMs } };
      if (b.steamNext) {
        const steam = STEAM.slice(0, angry ? 5 : 3).map((c) => ({ ...c }));
        return { ...none, vy: null, steam, brain: { mode: 'idle', timerMs: 0, steamNext: false } };
      }
      return { ...none, vy: HOP_VY, brain: { ...b, mode: 'hop', timerMs: 0 } };
    }
    case 'hop': {
      if (timerMs >= HOP_MIN_MS && s.grounded) {
        const waves: HippoStep['waves'] = [
          { dir: -1, delayMs: 0 },
          { dir: 1, delayMs: 0 },
        ];
        if (angry) waves.push({ dir: -1, delayMs: SECOND_WAVE_MS }, { dir: 1, delayMs: SECOND_WAVE_MS });
        return { ...none, vy: null, waves, brain: { mode: 'idle', timerMs: 0, steamNext: true } };
      }
      return { ...none, vy: null, brain: { ...b, timerMs } };
    }
  }
}
