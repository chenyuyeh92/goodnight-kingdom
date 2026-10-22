import type { Tuning } from '../config/tuning';

/** 水裡的重力倍數(慢慢沉)。 */
export const WATER_GRAVITY = 0.3;
/** 水裡左右移動的速度倍數。 */
export const WATER_MOVE = 0.85;
/** 從海床起跳的力道倍數(小跳一下離開海床)。 */
export const WATER_JUMP = 0.5;
/** 按一下跳躍:往上划一下。 */
export const STROKE_VY = 300;
/** 按住跳躍:至少這麼快往上游。 */
export const RISE_VY = 190;
/** 放開:最快這麼快往下沉。 */
export const SINK_VY = 120;
/** 按住下:往下潛。 */
export const DIVE_VY = 220;
/** 放開跳躍時,往上的速度馬上降到這麼慢(手感比較跟手)。 */
export const RELEASE_VY = 60;
/** 腳最高到這裡(不能游出水面)。 */
export const SWIM_TOP = 70;

/** 水裡用的手感:重力小、左右慢一點、從海床只小跳一下。 */
export function waterTuning(t: Tuning): Tuning {
  return {
    ...t,
    gravity: t.gravity * WATER_GRAVITY,
    walkSpeed: t.walkSpeed * WATER_MOVE,
    airSpeed: t.airSpeed * WATER_MOVE,
    crawlSpeed: t.crawlSpeed * WATER_MOVE,
    jumpVelocity: t.jumpVelocity * WATER_JUMP,
  };
}

export interface SwimInput {
  jump: boolean;
  /** 這一格剛按下跳躍。 */
  jumpPressed: boolean;
  down: boolean;
  /** 腳踩在海床或平台上(這時由一般的跳躍處理)。 */
  grounded: boolean;
  /** 睡著時只會沉下去。 */
  asleep: boolean;
}

/**
 * 水中的垂直速度(往下為正):按一下往上划、按住往上游、按住下往下潛、放開慢慢沉。
 * 站在海床上時交給一般的跳躍,只限制下沉速度。
 */
export function swimVy(vy: number, s: SwimInput): number {
  if (s.asleep) return Math.min(vy, SINK_VY);
  if (!s.grounded) {
    if (s.jumpPressed) return Math.min(vy, -STROKE_VY);
    if (s.jump) return Math.min(vy, -RISE_VY);
    if (s.down) return DIVE_VY;
    return Math.min(Math.max(vy, -RELEASE_VY), SINK_VY);
  }
  return Math.min(vy, SINK_VY);
}

/** 頂到水面:腳不能比 SWIM_TOP 高,往上的速度歸零。 */
export function clampToWater(feetY: number, vy: number): { feetY: number; vy: number } | null {
  if (feetY >= SWIM_TOP) return null;
  return { feetY: SWIM_TOP, vy: Math.max(vy, 0) };
}
