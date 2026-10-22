import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';
import { ENEMY_DEFS, arcShot } from './enemies';

export type SquirrelMode = 'throw' | 'shield' | 'hop';

export interface SquirrelBrain {
  mode: SquirrelMode;
  timerMs: number;
  /** 這一輪已經丟了幾顆橡實。 */
  thrown: number;
  facing: 1 | -1;
}

export interface SquirrelSense {
  x: number;
  grounded: boolean;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface SquirrelStep {
  /** null 表示保留目前的水平速度(跳到一半)。 */
  vx: number | null;
  /** null 表示交給重力。 */
  vy: number | null;
  brain: SquirrelBrain;
  /** 用大尾巴擋在前面:子彈全部彈開。 */
  armored: boolean;
  acorns: { vx: number; vy: number }[];
}

/** 橡實的重力(拋物線)。 */
export const ACORN_GRAVITY = 900;
export const SQUIRREL_SHIELD_MS = 1500;
const THROW_GAP_MS = { calm: 450, angry: 300 } as const;
const ACORNS = { calm: 3, angry: 5 } as const;
/** 橡實落點以玩家為中心左右散開。 */
const ACORN_SPREAD = 50;
const HOP_VY = -650;
/** 跳到新位置大約花的時間(決定水平速度)。 */
const HOP_S = 0.9;
const HOP_MIN_MS = 200;
const ANGRY_RATIO = 0.5;

export function initialSquirrelBrain(): SquirrelBrain {
  return { mode: 'throw', timerMs: 0, thrown: 0, facing: -1 };
}

/** 跳過去的位置:在畫面右半邊的兩個點之間來回(不會跳到玩家身上)。 */
export function hopSpot(x: number, arenaLeft: number, arenaRight: number): number {
  const half = ENEMY_DEFS.squirrel.w / 2;
  const near = arenaLeft + (arenaRight - arenaLeft) * 0.55;
  const far = arenaRight - half - 20;
  return Math.abs(x - far) < Math.abs(x - near) ? near : far;
}

/** 失眠大松鼠:丟橡實 → 轉身用大尾巴當盾 → 跳到另一個位置 → 再丟。 */
export function stepSquirrel(b: SquirrelBrain, s: SquirrelSense): SquirrelStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const angry = s.hpRatio <= ANGRY_RATIO;
  const none = { armored: false, acorns: [] };

  if (b.mode === 'throw') {
    if (s.targetX === null) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs } };
    if (b.thrown >= (angry ? ACORNS.angry : ACORNS.calm)) {
      // 轉身,大尾巴對著玩家。
      return { ...none, armored: true, vx: 0, vy: null, brain: { ...b, mode: 'shield', timerMs: 0, facing: (-toward as 1 | -1) } };
    }
    if (timerMs < (angry ? THROW_GAP_MS.angry : THROW_GAP_MS.calm)) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs, facing: toward } };
    const def = ENEMY_DEFS.squirrel;
    const handX = s.x + toward * (def.w / 2);
    const handY = GROUND_Y - def.h * 0.6;
    const offset = ((b.thrown % 3) - 1) * ACORN_SPREAD;
    const acorn = arcShot(handX, handY, s.targetX + offset, s.targetY ?? GROUND_Y - 24, ACORN_GRAVITY);
    return { ...none, acorns: [acorn], vx: 0, vy: null, brain: { ...b, timerMs: 0, thrown: b.thrown + 1, facing: toward } };
  }

  if (b.mode === 'shield') {
    if (timerMs < SQUIRREL_SHIELD_MS) return { ...none, armored: true, vx: 0, vy: null, brain: { ...b, timerMs } };
    const spot = hopSpot(s.x, s.arenaLeft, s.arenaRight);
    return { ...none, vx: (spot - s.x) / HOP_S, vy: HOP_VY, brain: { ...b, mode: 'hop', timerMs: 0, facing: spot < s.x ? -1 : 1 } };
  }

  if (timerMs >= HOP_MIN_MS && s.grounded) return { ...none, vx: 0, vy: null, brain: { mode: 'throw', timerMs: 0, thrown: 0, facing: toward } };
  return { ...none, vx: null, vy: null, brain: { ...b, timerMs } };
}
