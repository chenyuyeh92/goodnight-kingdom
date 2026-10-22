import { MAX_DT_MS } from '../config/tuning';

export type QueenMode = 'drift' | 'windup';
export type QueenAttack = 'summon' | 'sparks' | 'flash';

/** 招式輪流:叫小螢火蟲 → 射光點 → 燈泡一閃(之後四周變得很黑一下)。 */
export const QUEEN_ATTACKS: readonly QueenAttack[] = ['summon', 'sparks', 'flash'];

export interface QueenBrain {
  mode: QueenMode;
  timerMs: number;
  facing: 1 | -1;
  attacks: number;
  pending: QueenAttack;
}

export interface QueenSense {
  x: number;
  y: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  halfW: number;
  arenaLeft: number;
  arenaRight: number;
  firefliesAlive: number;
  dtMs: number;
}

export interface QueenStep {
  vx: number;
  vy: number;
  brain: QueenBrain;
  /** 叫出來的小螢火蟲數(會發光,打掉就變暗)。 */
  summon: number;
  /** 射出去的光點(朝玩家散開)。 */
  sparks: { vx: number; vy: number }[];
  /** 燈泡一閃:之後四周變得很黑一下。 */
  flash: boolean;
}

/** 飛的高度:身體底部大約 y 360–410,站在地上往前射打不到,跳起來射打得到(和貓頭鷹一樣)。 */
export const QUEEN_HOVER_Y = 330;
export const QUEEN_DRIFT_MS = 2000;
export const QUEEN_WINDUP_MS = 500;
/** 和玩家保持的水平距離。 */
const KEEP = 260;
const FLY_SPEED = 90;
const Y_SPRING = 3;
export const QUEEN_BOB = 25;
const BOB_PERIOD_MS = 1600;
/** 小螢火蟲:一次叫 2 隻(血量一半以下 3 隻),場上最多 4 隻。 */
const SUMMON = { calm: 2, angry: 3 } as const;
export const MAX_FIREFLIES = 4;
const SPARKS = { calm: 3, angry: 5 } as const;
const SPARK_SPEED = 200;
const SPARK_SPREAD_DEG = 40;
const ANGRY_RATIO = 0.5;

export function initialQueenBrain(): QueenBrain {
  return { mode: 'drift', timerMs: 0, facing: -1, attacks: 0, pending: 'summon' };
}

/**
 * 熬夜螢火蟲女王:在半空中上下飄,和玩家保持距離;輪流叫小螢火蟲(會發光照亮四周,打掉就變暗)、
 * 朝玩家射光點、燈泡一閃讓四周變得很黑一下(看不清楚)。
 */
export function stepQueen(b: QueenBrain, s: QueenSense): QueenStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const angry = s.hpRatio <= ANGRY_RATIO;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const bobY = QUEEN_HOVER_Y + QUEEN_BOB * Math.sin((timerMs / BOB_PERIOD_MS) * Math.PI * 2);
  const vy = (bobY - s.y) * Y_SPRING;
  const none = { summon: 0, sparks: [], flash: false };

  if (b.mode === 'drift') {
    let vx = 0;
    if (s.targetX !== null) {
      const want = Math.min(Math.max(s.targetX - toward * KEEP, s.arenaLeft + s.halfW), s.arenaRight - s.halfW);
      if (Math.abs(want - s.x) > 10) vx = Math.sign(want - s.x) * FLY_SPEED;
    }
    if (timerMs < QUEEN_DRIFT_MS || s.targetX === null) return { ...none, vx, vy, brain: { ...b, timerMs, facing: toward } };
    const pending = QUEEN_ATTACKS[b.attacks % QUEEN_ATTACKS.length];
    return { ...none, vx: 0, vy, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward, attacks: b.attacks + 1, pending } };
  }

  if (timerMs < QUEEN_WINDUP_MS) return { ...none, vx: 0, vy, brain: { ...b, timerMs } };
  const done: QueenBrain = { ...b, mode: 'drift', timerMs: 0 };
  if (b.pending === 'summon') {
    const n = Math.max(0, Math.min(angry ? SUMMON.angry : SUMMON.calm, MAX_FIREFLIES - s.firefliesAlive));
    return { ...none, vx: 0, vy, summon: n, brain: done };
  }
  if (b.pending === 'flash') return { ...none, vx: 0, vy, flash: true, brain: done };
  const n = angry ? SPARKS.angry : SPARKS.calm;
  const aim = Math.atan2((s.targetY ?? 440) - s.y, (s.targetX ?? s.x - 300) - s.x);
  const sparks = Array.from({ length: n }, (_, i) => {
    const a = aim + (((i - (n - 1) / 2) / Math.max(n - 1, 1)) * SPARK_SPREAD_DEG * Math.PI) / 180;
    return { vx: Math.cos(a) * SPARK_SPEED, vy: Math.sin(a) * SPARK_SPEED };
  });
  return { ...none, vx: 0, vy, sparks, brain: done };
}
