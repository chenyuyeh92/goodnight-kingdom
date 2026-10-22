import { MAX_DT_MS } from '../config/tuning';
import { ENEMY_DEFS } from './enemies';

export type CrabMode = 'walk' | 'shell' | 'windup' | 'rest';

export interface CrabBrain {
  mode: CrabMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是縮殼滑過來(true)還是吐泡泡(false)。 */
  shellNext: boolean;
}

export interface CrabSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  /** 嘴巴(吐泡泡的位置)。 */
  mouthY: number;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface CrabStep {
  vx: number;
  brain: CrabBrain;
  /** 縮在殼裡:子彈全部彈開。 */
  armored: boolean;
  bubbles: { vx: number; vy: number }[];
}

export const CRAB_WALK_MS = 2000;
export const CRAB_SHELL_MS = 1600;
const WINDUP_MS = 400;
const REST_MS = 600;
const WALK_SPEED = 70;
const SHELL_SPEED = 200;
const BUBBLE_SPEED = 110;
const BUBBLE_SPREAD_DEG = 40;
const ANGRY_RATIO = 0.5;

export function initialCrabBrain(): CrabBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, shellNext: true };
}

/** 失眠寄居蟹:走一走 → 輪流「縮進咖啡杯殼裡滑過來」與「吐慢慢飄的泡泡」。 */
export function stepCrab(b: CrabBrain, s: CrabSense): CrabStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const none = { armored: false, bubbles: [] };

  if (b.mode === 'walk') {
    if (timerMs >= CRAB_WALK_MS && s.targetX !== null) {
      if (b.shellNext) return { ...none, armored: true, vx: toward * SHELL_SPEED, brain: { ...b, mode: 'shell', timerMs: 0, facing: toward } };
      return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
    }
    const near = s.targetX === null || Math.abs(s.targetX - s.x) < 60;
    return { ...none, vx: near ? 0 : toward * WALK_SPEED, brain: { ...b, timerMs, facing: toward } };
  }

  if (b.mode === 'shell') {
    if (timerMs >= CRAB_SHELL_MS) return { ...none, vx: 0, brain: { ...b, mode: 'rest', timerMs: 0, shellNext: false } };
    // 滑到畫面邊緣就反彈。
    const half = ENEMY_DEFS.hermitCrab.w / 2;
    let facing = b.facing;
    if (s.x <= s.arenaLeft + half + 2) facing = 1;
    if (s.x >= s.arenaRight - half - 2) facing = -1;
    return { ...none, armored: true, vx: facing * SHELL_SPEED, brain: { ...b, timerMs, facing } };
  }

  if (b.mode === 'windup') {
    if (timerMs < WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
    const n = s.hpRatio <= ANGRY_RATIO ? 5 : 3;
    const aim = Math.atan2((s.targetY ?? s.mouthY) - s.mouthY, (s.targetX ?? s.x + b.facing * 100) - s.x);
    const spread = (BUBBLE_SPREAD_DEG * Math.PI) / 180;
    const bubbles = Array.from({ length: n }, (_, i) => {
      const a = aim - spread / 2 + (spread * i) / (n - 1);
      return { vx: Math.cos(a) * BUBBLE_SPEED, vy: Math.sin(a) * BUBBLE_SPEED };
    });
    return { ...none, vx: 0, bubbles, brain: { ...b, mode: 'rest', timerMs: 0, shellNext: true } };
  }

  if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
  return { ...none, vx: 0, brain: { ...b, timerMs } };
}
