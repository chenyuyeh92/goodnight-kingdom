import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y } from '../levels/levelDef';

export type PandaMode = 'walk' | 'windup' | 'roll' | 'rest';

export interface PandaBrain {
  mode: PandaMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是縮成一團滾過來(true)還是丟竹子(false)。 */
  rollNext: boolean;
}

export interface PandaSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  halfW: number;
  arenaLeft: number;
  arenaRight: number;
  dtMs: number;
}

export interface PandaStep {
  vx: number;
  brain: PandaBrain;
  /** 丟出去的竹子(迴旋:飛出去再飛回來):往哪邊、晚多久丟。 */
  bamboos: { dir: 1 | -1; delayMs: number }[];
}

export const PANDA_WALK_MS = 1800;
export const PANDA_WINDUP_MS = 500;
/** 滾一趟(撞到畫面邊會彈回來)。 */
export const PANDA_ROLL_MS = 2200;
const REST_MS = 700;
const WALK_SPEED = 50;
const KEEP = 280;
export const ROLL_SPEED = 330;
/** 竹子:往前飛 600,一直往回減速,大約 1 秒後飛回來;高度打得到站著的人,蹲下就從頭上飛過。 */
export const BAMBOO_Y = GROUND_Y - 40;
export const BAMBOO_VX = 600;
export const BAMBOO_AX = 600;
const SECOND_BAMBOO_MS = 450;
const ANGRY_RATIO = 0.5;

export function initialPandaBrain(): PandaBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, rollNext: true };
}

/**
 * 失眠熊貓(本來就有黑眼圈):走一走 → 輪流「縮成一團滾過來,撞到畫面邊彈回去(站到雲朵平台上躲)」
 * 與「丟竹子(迴旋,蹲下躲;血量一半以下連丟兩根)」。
 */
export function stepPanda(b: PandaBrain, s: PandaSense): PandaStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const none = { bamboos: [] };

  switch (b.mode) {
    case 'walk': {
      if (timerMs >= PANDA_WALK_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > KEEP;
      return { ...none, vx: far ? toward * WALK_SPEED : 0, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < PANDA_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      if (b.rollNext) return { ...none, vx: b.facing * ROLL_SPEED, brain: { ...b, mode: 'roll', timerMs: 0 } };
      const bamboos: PandaStep['bamboos'] = [{ dir: b.facing, delayMs: 0 }];
      if (s.hpRatio <= ANGRY_RATIO) bamboos.push({ dir: b.facing, delayMs: SECOND_BAMBOO_MS });
      return { ...none, vx: 0, bamboos, brain: { ...b, mode: 'rest', timerMs: 0, rollNext: true } };
    }
    case 'roll': {
      if (timerMs >= PANDA_ROLL_MS) return { ...none, vx: 0, brain: { ...b, mode: 'rest', timerMs: 0, rollNext: false } };
      let facing = b.facing;
      if (s.x <= s.arenaLeft + s.halfW + 2) facing = 1;
      if (s.x >= s.arenaRight - s.halfW - 2) facing = -1;
      return { ...none, vx: facing * ROLL_SPEED, brain: { ...b, timerMs, facing } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
