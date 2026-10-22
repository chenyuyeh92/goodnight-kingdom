import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';

export type GiraffeMode = 'walk' | 'windup' | 'kick' | 'rest';

export interface GiraffeBrain {
  mode: GiraffeMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一次脖子橫掃是掃高的(true)還是掃低的(false)。 */
  highNext: boolean;
  /** 預備中的是脖子橫掃(true)還是後腿踢(false)。 */
  sweep: boolean;
  /** 剛踢過(下一招一定是脖子橫掃,不會一直踢)。 */
  kicked: boolean;
}

export interface GiraffeSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  dtMs: number;
}

export interface GiraffeStep {
  vx: number;
  brain: GiraffeBrain;
  /** 脖子橫掃:高度(中心 y)、往哪邊、晚多久出來。 */
  sweeps: { y: number; dir: 1 | -1; delayMs: number }[];
}

export const GIRAFFE_WALK_MS = 1800;
export const GIRAFFE_WINDUP_MS = 500;
export const GIRAFFE_KICK_MS = 300;
const REST_MS = 600;
const WALK_SPEED = 50;
/** 和玩家保持這個距離。 */
const KEEP = 300;
/** 玩家靠這麼近就用後腿踢(往玩家那邊蹬一下)。 */
export const KICK_RANGE = 130;
const KICK_SPEED = 300;
/** 掃高的:站在地上就從頭上掃過去,跳起來或站在平台上會被打到。 */
export const SWEEP_HIGH_Y = GROUND_Y - 95;
/** 掃低的:要跳過去(蹲下也躲不過)。 */
export const SWEEP_LOW_Y = GROUND_Y - 22;
export const SWEEP_SPEED = 480;
/** 生氣時連掃兩下:一律先掃高(站著不動)、再掃低(跳過),中間隔 0.6 秒;反過來的話跳過低的還沒落地就撞到高的。 */
const SECOND_SWEEP_MS = 600;
const ANGRY_RATIO = 0.5;

export function initialGiraffeBrain(): GiraffeBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, highNext: true, sweep: true, kicked: false };
}

/**
 * 失眠長頸鹿:走一走 → 脖子橫掃(高的站著不動、低的跳過,輪流;血量一半以下先高後低連掃兩下);
 * 玩家靠太近就用後腿蹬一下(不連續踢)。
 */
export function stepGiraffe(b: GiraffeBrain, s: GiraffeSense): GiraffeStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const none = { sweeps: [] };

  switch (b.mode) {
    case 'walk': {
      const dist = s.targetX === null ? Infinity : Math.abs(s.targetX - s.x);
      const near = dist < KICK_RANGE && !b.kicked;
      if (s.targetX !== null && (near || timerMs >= GIRAFFE_WALK_MS)) {
        return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward, sweep: !near } };
      }
      return { ...none, vx: dist > KEEP ? toward * WALK_SPEED : 0, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < GIRAFFE_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      if (!b.sweep) return { ...none, vx: b.facing * KICK_SPEED, brain: { ...b, mode: 'kick', timerMs: 0 } };
      const sweeps: GiraffeStep['sweeps'] =
        s.hpRatio <= ANGRY_RATIO
          ? [
              { y: SWEEP_HIGH_Y, dir: b.facing, delayMs: 0 },
              { y: SWEEP_LOW_Y, dir: b.facing, delayMs: SECOND_SWEEP_MS },
            ]
          : [{ y: b.highNext ? SWEEP_HIGH_Y : SWEEP_LOW_Y, dir: b.facing, delayMs: 0 }];
      return { ...none, vx: 0, sweeps, brain: { ...b, mode: 'rest', timerMs: 0, highNext: !b.highNext, kicked: false } };
    }
    case 'kick': {
      // 踢完下一次一定是脖子橫掃(不會一直踢)。
      if (timerMs >= GIRAFFE_KICK_MS) return { ...none, vx: 0, brain: { ...b, mode: 'rest', timerMs: 0, kicked: true } };
      return { ...none, vx: b.facing * KICK_SPEED, brain: { ...b, timerMs } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
