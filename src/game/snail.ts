import { MAX_DT_MS } from '../config/tuning';

export type SnailMode = 'crawl' | 'windup' | 'shell';

export interface SnailBrain {
  mode: SnailMode;
  timerMs: number;
  facing: 1 | -1;
}

export interface SnailSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  /** 殼頂的火山口(熔岩球從這裡噴出來)。 */
  ventX: number;
  ventY: number;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface SnailStep {
  vx: number;
  brain: SnailBrain;
  /** 縮在殼裡:子彈全部彈開。 */
  armored: boolean;
  lavaBalls: { vx: number; vy: number }[];
}

export const SNAIL_CRAWL_MS = 1800;
export const SNAIL_WINDUP_MS = 500;
export const SNAIL_SHELL_MS = 1800;
const CRAWL_SPEED = 40;
const ANGRY_RATIO = 0.5;
/** 熔岩球:往上噴高再落下,花的時間固定(看得到從天上掉下來)。 */
export const LAVA_GRAVITY = 900;
const LOB_S = 1.3;
const LOB_GAP = 110;
const LANDING_Y = 470;

export function initialSnailBrain(): SnailBrain {
  return { mode: 'crawl', timerMs: 0, facing: -1 };
}

/** 熔岩球落點:以玩家為中心每隔 LOB_GAP 散開,夾在範圍裡。 */
export function snailTargets(n: number, targetX: number, left: number, right: number): number[] {
  return Array.from({ length: n }, (_, i) => Math.min(Math.max(targetX + (i - (n - 1) / 2) * LOB_GAP, left), right));
}

/** 熬夜火山蝸牛:慢慢爬 → 殼上的火山噴出熔岩球(往上再落在玩家周圍)→ 縮進殼裡(打不動)→ 再爬。 */
export function stepSnail(b: SnailBrain, s: SnailSense): SnailStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const none = { armored: false, lavaBalls: [] };

  switch (b.mode) {
    case 'crawl': {
      if (timerMs >= SNAIL_CRAWL_MS && s.targetX !== null) return { ...none, vx: 0, brain: { mode: 'windup', timerMs: 0, facing: toward } };
      const near = s.targetX === null || Math.abs(s.targetX - s.x) < 160;
      return { ...none, vx: near ? 0 : toward * CRAWL_SPEED, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < SNAIL_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      const n = s.hpRatio <= ANGRY_RATIO ? 5 : 3;
      const xs = snailTargets(n, s.targetX ?? s.x + b.facing * 250, s.arenaLeft + 20, s.arenaRight - 20);
      const lavaBalls = xs.map((x) => ({ vx: (x - s.ventX) / LOB_S, vy: (LANDING_Y - s.ventY) / LOB_S - 0.5 * LAVA_GRAVITY * LOB_S }));
      return { ...none, armored: true, vx: 0, lavaBalls, brain: { ...b, mode: 'shell', timerMs: 0 } };
    }
    case 'shell': {
      if (timerMs >= SNAIL_SHELL_MS) return { ...none, vx: 0, brain: { ...b, mode: 'crawl', timerMs: 0 } };
      return { ...none, armored: true, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
