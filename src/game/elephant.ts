import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';

export type ElephantMode = 'walk' | 'windup' | 'spray' | 'rest';

export interface ElephantBrain {
  mode: ElephantMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是鼻子噴水(true)還是跺腳(false)。 */
  sprayNext: boolean;
  /** 噴水時已經噴了幾發。 */
  jets: number;
}

export interface ElephantSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  dtMs: number;
}

export interface ElephantStep {
  vx: number;
  brain: ElephantBrain;
  /** 這一格噴出一發水柱(往哪邊)。 */
  jet: 1 | -1 | null;
  /** 跺腳往左右送出的震波。 */
  waves: { dir: 1 | -1; delayMs: number }[];
}

export const ELEPHANT_WALK_MS = 1800;
export const ELEPHANT_WINDUP_MS = 500;
const REST_MS = 700;
const WALK_SPEED = 45;
const KEEP = 320;
/** 水柱:每 150 毫秒一發,平常 6 發、血量一半以下 9 發。 */
const JET_EVERY_MS = 150;
const JETS = { calm: 6, angry: 9 } as const;
/** 水柱的高度:打得到站著的人,蹲下就從頭上噴過去。 */
export const JET_Y = GROUND_Y - 40;
export const JET_SPEED = 420;
const SECOND_WAVE_MS = 450;
const ANGRY_RATIO = 0.5;

export function initialElephantBrain(): ElephantBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, sprayNext: true, jets: 0 };
}

/** 熬夜大象:走一走 → 輪流「鼻子噴一串水柱(蹲下躲)」與「跺腳往左右送出震波(跳過)」。 */
export function stepElephant(b: ElephantBrain, s: ElephantSense): ElephantStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const angry = s.hpRatio <= ANGRY_RATIO;
  const none = { jet: null, waves: [] };

  switch (b.mode) {
    case 'walk': {
      if (timerMs >= ELEPHANT_WALK_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > KEEP;
      return { ...none, vx: far ? toward * WALK_SPEED : 0, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < ELEPHANT_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      if (b.sprayNext) return { ...none, vx: 0, brain: { ...b, mode: 'spray', timerMs: 0, jets: 0 } };
      const waves: ElephantStep['waves'] = [
        { dir: -1, delayMs: 0 },
        { dir: 1, delayMs: 0 },
      ];
      if (angry) waves.push({ dir: -1, delayMs: SECOND_WAVE_MS }, { dir: 1, delayMs: SECOND_WAVE_MS });
      return { ...none, vx: 0, waves, brain: { ...b, mode: 'rest', timerMs: 0, sprayNext: true } };
    }
    case 'spray': {
      const total = angry ? JETS.angry : JETS.calm;
      if (b.jets >= total) return { ...none, vx: 0, brain: { ...b, mode: 'rest', timerMs: 0, sprayNext: false } };
      if (timerMs >= b.jets * JET_EVERY_MS) return { ...none, vx: 0, jet: b.facing, brain: { ...b, timerMs, jets: b.jets + 1 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
