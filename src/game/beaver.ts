import { MAX_DT_MS } from '../config/tuning';
import { ENEMY_DEFS } from './enemies';

export type BeaverMode = 'walk' | 'windup' | 'rest';
export type BeaverAttack = 'slap' | 'log';

export interface BeaverBrain {
  mode: BeaverMode;
  timerMs: number;
  next: BeaverAttack;
  facing: 1 | -1;
}

export interface BeaverSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface BeaverStep {
  vx: number;
  brain: BeaverBrain;
  /** 尾巴拍地送出的水波:方向與各自延遲。 */
  waves: { dir: 1 | -1; delayMs: number }[];
  /** 丟到天上、會掉在這些位置的木頭。 */
  logs: number[];
}

export const BEAVER_WALK_MS = 1600;
const WINDUP_MS = 450;
const REST_MS = 600;
const SPEED = 70;
const KEEP_DIST = 300;
/** 第二道水波晚出發;第二根木頭掉在玩家旁邊。 */
const SECOND_WAVE_MS = 600;
const SECOND_LOG_GAP = 130;
const ANGRY_RATIO = 0.5;

export function initialBeaverBrain(): BeaverBrain {
  return { mode: 'walk', timerMs: 0, next: 'slap', facing: -1 };
}

/** 熬夜大河狸:走一走 → 輪流「尾巴拍地送出水波」與「把木頭丟到玩家頭上」。 */
export function stepBeaver(b: BeaverBrain, s: BeaverSense): BeaverStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const angry = s.hpRatio <= ANGRY_RATIO;
  const none = { waves: [], logs: [] };

  if (b.mode === 'walk') {
    if (timerMs >= BEAVER_WALK_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
    if (s.targetX === null) return { ...none, vx: 0, brain: { ...b, timerMs } };
    const half = ENEMY_DEFS.beaver.w / 2;
    const goal = Math.min(Math.max(s.targetX - toward * KEEP_DIST, s.arenaLeft + half), s.arenaRight - half);
    const vx = Math.abs(goal - s.x) > 10 ? Math.sign(goal - s.x) * SPEED : 0;
    return { ...none, vx, brain: { ...b, timerMs, facing: toward } };
  }

  if (b.mode === 'windup') {
    if (timerMs < WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
    const rest: BeaverBrain = { ...b, mode: 'rest', timerMs: 0, next: b.next === 'slap' ? 'log' : 'slap' };
    if (b.next === 'slap') {
      const waves = [{ dir: b.facing, delayMs: 0 }, ...(angry ? [{ dir: b.facing, delayMs: SECOND_WAVE_MS }] : [])];
      return { ...none, vx: 0, waves, brain: rest };
    }
    const tx = s.targetX ?? s.x + b.facing * KEEP_DIST;
    const second = Math.min(Math.max(tx - b.facing * SECOND_LOG_GAP, s.arenaLeft + 30), s.arenaRight - 30);
    return { ...none, vx: 0, logs: angry ? [tx, second] : [tx], brain: rest };
  }

  if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
  return { ...none, vx: 0, brain: { ...b, timerMs } };
}
