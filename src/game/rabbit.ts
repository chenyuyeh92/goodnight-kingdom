import { MAX_DT_MS } from '../config/tuning';
import { arcShot } from './enemies';

export type RabbitMode = 'walk' | 'windup' | 'rest';

export interface RabbitBrain {
  mode: RabbitMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是木槌敲地(true)還是丟麻糬(false)。 */
  slamNext: boolean;
}

export interface RabbitSense {
  x: number;
  hpRatio: number;
  targetX: number | null;
  targetY: number | null;
  handX: number;
  handY: number;
  dtMs: number;
}

export interface RabbitStep {
  vx: number;
  brain: RabbitBrain;
  /** 木槌敲地往左右送出的震波。 */
  waves: { dir: 1 | -1; delayMs: number }[];
  /** 丟出去的麻糬(拋物線,黏到會變慢)。 */
  mochi: { vx: number; vy: number }[];
}

export const RABBIT_WALK_MS = 1800;
export const RABBIT_WINDUP_MS = 500;
const REST_MS = 700;
const WALK_SPEED = 55;
const KEEP = 280;
const SECOND_WAVE_MS = 450;
const MOCHI = { calm: 2, angry: 3 } as const;
const MOCHI_SPREAD = 110;
const MOCHI_OFFSETS = [0, -1, 1] as const;
export const MOCHI_GRAVITY = 800;
const ANGRY_RATIO = 0.5;

export function initialRabbitBrain(): RabbitBrain {
  return { mode: 'walk', timerMs: 0, facing: -1, slamNext: true };
}

/**
 * 失眠月兔(拿著搗麻糬的大木槌):走一走 → 輪流「木槌敲地,往左右送出震波(跳過;血量一半以下兩道)」
 * 與「丟麻糬(拋物線,黏到會變慢一下,不扣愛心;血量一半以下 3 顆)」。
 */
export function stepRabbit(b: RabbitBrain, s: RabbitSense): RabbitStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const angry = s.hpRatio <= ANGRY_RATIO;
  const none = { waves: [], mochi: [] };

  switch (b.mode) {
    case 'walk': {
      if (timerMs >= RABBIT_WALK_MS && s.targetX !== null) return { ...none, vx: 0, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > KEEP;
      return { ...none, vx: far ? toward * WALK_SPEED : 0, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < RABBIT_WINDUP_MS) return { ...none, vx: 0, brain: { ...b, timerMs } };
      if (b.slamNext) {
        const waves: RabbitStep['waves'] = [
          { dir: -1, delayMs: 0 },
          { dir: 1, delayMs: 0 },
        ];
        if (angry) waves.push({ dir: -1, delayMs: SECOND_WAVE_MS }, { dir: 1, delayMs: SECOND_WAVE_MS });
        return { ...none, vx: 0, waves, brain: { ...b, mode: 'rest', timerMs: 0, slamNext: false } };
      }
      const n = angry ? MOCHI.angry : MOCHI.calm;
      const tx = s.targetX ?? s.x + b.facing * 300;
      // 第一顆直直丟向玩家,其他落在玩家前後。
      const mochi = MOCHI_OFFSETS.slice(0, n).map((o) => arcShot(s.handX, s.handY, tx + o * MOCHI_SPREAD, s.targetY ?? s.handY, MOCHI_GRAVITY));
      return { ...none, vx: 0, mochi, brain: { ...b, mode: 'rest', timerMs: 0, slamNext: true } };
    }
    case 'rest': {
      if (timerMs >= REST_MS) return { ...none, vx: 0, brain: { ...b, mode: 'walk', timerMs: 0 } };
      return { ...none, vx: 0, brain: { ...b, timerMs } };
    }
  }
}
