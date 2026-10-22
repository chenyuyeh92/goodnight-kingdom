import { MAX_DT_MS } from '../config/tuning';
import type { Span } from './water';

/** 流沙上走路速度的倍數。 */
export const SAND_SPEED = 0.5;
/** 流沙上跳躍力道的倍數。 */
export const SAND_JUMP = 0.8;
/** 連續站在流沙上這麼久就陷下去扣一顆愛心。 */
export const SINK_MS = 2000;
/** 陷到最深時圖往下沉的距離。 */
export const SINK_PX = 20;
/** 離開流沙或跳起來時,陷下的程度以兩倍速恢復。 */
const RECOVER_RATE = 2;
/** 陷下去扣血後彈出來的力道。 */
export const SAND_POP_VY = -450;

export interface SandState {
  /** 已經陷了多久(毫秒)。 */
  ms: number;
}

export function freshSand(): SandState {
  return { ms: 0 };
}

export function inQuicksand(x: number, sand: readonly Span[]): boolean {
  return sand.some((s) => x >= s.x && x <= s.x + s.w);
}

/**
 * 每格更新:腳踩在流沙上就越陷越深,陷滿 SINK_MS 扣一顆愛心並彈出來(重新計時);
 * 跳起來或離開流沙慢慢恢復。睡著的人不會陷。
 */
export function stepSand(s: SandState, input: { inSand: boolean; grounded: boolean; down: boolean; dtMs: number }): { state: SandState; sunk: boolean } {
  if (input.down) return { state: freshSand(), sunk: false };
  const dt = Math.min(input.dtMs, MAX_DT_MS);
  if (input.inSand && input.grounded) {
    const ms = s.ms + dt;
    if (ms >= SINK_MS) return { state: freshSand(), sunk: true };
    return { state: { ms }, sunk: false };
  }
  return { state: { ms: Math.max(0, s.ms - dt * RECOVER_RATE) }, sunk: false };
}

/** 圖往下沉多少 px。 */
export function sinkDepth(s: SandState): number {
  return (SINK_PX * Math.min(s.ms, SINK_MS)) / SINK_MS;
}
