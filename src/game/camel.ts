import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';
import { ENEMY_DEFS, SPIT_GRAVITY, arcShot } from './enemies';

export type CamelMode = 'walk' | 'windup' | 'rest';
export type CamelAttack = 'spit' | 'kick';

export interface CamelBrain {
  mode: CamelMode;
  timerMs: number;
  next: CamelAttack;
  facing: 1 | -1;
}

export interface CamelSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  /** 最近的玩家身體中心 y。 */
  targetY: number | null;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface CamelStep {
  vx: number;
  brain: CamelBrain;
  /** 吐出的口水(拋物線)。 */
  spits: { vx: number; vy: number }[];
  /** 踢起的沙浪方向;沒有時為 null。 */
  wave: 1 | -1 | null;
}

const WALK_MS = 1800;
const WINDUP_MS = 450;
const REST_MS = 500;
const SPEED = 90;
/** 駱駝想和玩家保持的距離。 */
const KEEP_DIST = 260;
/** 口水落點:以玩家為中心散開。 */
const SPIT_SPREAD = { full: [-80, 0, 80], angry: [-140, -70, 0, 70, 140] } as const;
/** 血量一半以下口水變五顆。 */
const ANGRY_RATIO = 0.5;

export function initialCamelBrain(): CamelBrain {
  return { mode: 'walk', timerMs: 0, next: 'spit', facing: -1 };
}

const toward = (x: number, targetX: number | null, fallback: 1 | -1): 1 | -1 => (targetX === null ? fallback : targetX < x ? -1 : 1);

/** 失眠駱駝:走一走 → 預備 → 輪流吐口水、踢沙浪 → 休息。 */
export function stepCamel(b: CamelBrain, s: CamelSense): CamelStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const dir = toward(s.x, s.targetX, b.facing);
  const none = { spits: [], wave: null };

  if (b.mode === 'walk') {
    if (timerMs >= WALK_MS && s.targetX !== null) {
      // 踢沙要用屁股對著玩家。
      const facing = b.next === 'kick' ? (-dir as 1 | -1) : dir;
      return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing } };
    }
    if (s.targetX === null) return { ...none, vx: 0, brain: { ...b, timerMs } };
    // 站到玩家同一側 KEEP_DIST 遠的地方;靠牆時改站到另一側。
    const half = ENEMY_DEFS.camel.w / 2;
    let goal = s.targetX - dir * KEEP_DIST;
    if (goal < s.arenaLeft + half || goal > s.arenaRight - half) goal = s.targetX + dir * KEEP_DIST;
    goal = Math.min(Math.max(goal, s.arenaLeft + half), s.arenaRight - half);
    const vx = Math.abs(goal - s.x) > 10 ? Math.sign(goal - s.x) * SPEED : 0;
    return { ...none, vx, brain: { ...b, timerMs, facing: dir } };
  }

  if (b.mode === 'windup') {
    if (timerMs < WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
    const rest: CamelBrain = { ...b, mode: 'rest', timerMs: 0, next: b.next === 'spit' ? 'kick' : 'spit' };
    if (b.next === 'kick') return { ...none, vx: 0, brain: rest, wave: (-b.facing as 1 | -1) };
    const def = ENEMY_DEFS.camel;
    const mouthX = s.x + b.facing * (def.w / 2);
    const mouthY = GROUND_Y - def.h + 16;
    const tx = s.targetX ?? mouthX + b.facing * KEEP_DIST;
    const ty = s.targetY ?? GROUND_Y - 20;
    const offsets = s.hpRatio <= ANGRY_RATIO ? SPIT_SPREAD.angry : SPIT_SPREAD.full;
    const spits = offsets.map((o) => arcShot(mouthX, mouthY, tx + o, ty, SPIT_GRAVITY));
    return { spits, wave: null, vx: 0, brain: rest };
  }

  if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
  return { ...none, vx: 0, brain: { ...b, timerMs } };
}
