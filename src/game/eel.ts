import { MAX_DT_MS } from '../config/tuning';
import { ENEMY_DEFS } from './enemies';

export type EelMode = 'swim' | 'charge' | 'zap' | 'rest';

export interface EelBrain {
  mode: EelMode;
  timerMs: number;
  facing: 1 | -1;
  /** 游的高度(上下輪流)。 */
  laneY: number;
  /** 預告/放電的高度。 */
  beams: number[];
}

export interface EelSense {
  x: number;
  y: number;
  hpRatio: number;
  targetY: number | null;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface EelStep {
  vx: number;
  vy: number;
  brain: EelBrain;
  /** 預告中的電流高度(畫細線)。 */
  warn: number[];
  /** 正在放電的高度(碰到扣愛心)。 */
  zap: number[];
}

export const EEL_SWIM_MS = 2200;
export const EEL_CHARGE_MS = 700;
export const EEL_ZAP_MS = 600;
const REST_MS = 500;
const SWIM_SPEED = 160;
const LANE_SPRING = 3;
const LANES = [170, 380] as const;
/** 電流的上下範圍(不貼著水面,也不鑽進海床)。 */
export const BEAM_MIN_Y = 100;
export const BEAM_MAX_Y = 455;
/** 第二道電流和第一道的距離。 */
const SECOND_BEAM_GAP = 140;
/** 電流的半高(判定)。 */
export const BEAM_HALF_H = 14;
const ANGRY_RATIO = 0.5;

export function initialEelBrain(): EelBrain {
  return { mode: 'swim', timerMs: 0, facing: -1, laneY: LANES[0], beams: [] };
}

const clampBeam = (y: number): number => Math.min(Math.max(y, BEAM_MIN_Y), BEAM_MAX_Y);

/** 電流的位置:一道對準玩家;血量一半以下加一道,在離邊界比較遠的那一側。 */
export function eelBeams(targetY: number, hpRatio: number): number[] {
  const first = clampBeam(targetY);
  if (hpRatio > ANGRY_RATIO) return [first];
  const up = first - SECOND_BEAM_GAP;
  return [first, up >= BEAM_MIN_Y ? up : clampBeam(first + SECOND_BEAM_GAP)];
}

/** 熬夜電鰻:來回游 → 身體閃爍預告(畫面上出現細線)→ 沿著細線放出橫跨畫面的電流 → 休息。 */
export function stepEel(b: EelBrain, s: EelSense): EelStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const none = { warn: [], zap: [] };

  if (b.mode === 'swim') {
    if (timerMs >= EEL_SWIM_MS && s.targetY !== null) {
      const beams = eelBeams(s.targetY, s.hpRatio);
      return { ...none, vx: 0, vy: 0, warn: beams, brain: { ...b, mode: 'charge', timerMs: 0, beams } };
    }
    const half = ENEMY_DEFS.eel.w / 2;
    let facing = b.facing;
    if (s.x <= s.arenaLeft + half + 4) facing = 1;
    if (s.x >= s.arenaRight - half - 4) facing = -1;
    return { ...none, vx: facing * SWIM_SPEED, vy: (b.laneY - s.y) * LANE_SPRING, brain: { ...b, timerMs, facing } };
  }
  if (b.mode === 'charge') {
    if (timerMs >= EEL_CHARGE_MS) return { ...none, vx: 0, vy: 0, zap: b.beams, brain: { ...b, mode: 'zap', timerMs: 0 } };
    return { ...none, vx: 0, vy: 0, warn: b.beams, brain: { ...b, timerMs } };
  }
  if (b.mode === 'zap') {
    if (timerMs >= EEL_ZAP_MS) {
      const laneY = b.laneY === LANES[0] ? LANES[1] : LANES[0];
      return { ...none, vx: 0, vy: 0, brain: { ...b, mode: 'rest', timerMs: 0, beams: [], laneY } };
    }
    return { ...none, vx: 0, vy: 0, zap: b.beams, brain: { ...b, timerMs } };
  }
  if (timerMs >= REST_MS) return { ...none, vx: 0, vy: 0, brain: { ...b, mode: 'swim', timerMs: 0 } };
  return { ...none, vx: 0, vy: (b.laneY - s.y) * LANE_SPRING, brain: { ...b, timerMs } };
}
