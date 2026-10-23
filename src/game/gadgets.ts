import { MAX_DT_MS } from '../config/tuning';

/** 移動平台:x、y 是起點的左上角,在起點與起點 +(dx, dy) 之間來回一趟 periodMs。 */
export interface MoverDef {
  x: number;
  y: number;
  w: number;
  dx: number;
  dy: number;
  periodMs: number;
}

/** 平滑的來回(兩端慢、中間快)。 */
export function moverOffset(m: MoverDef, tMs: number): { x: number; y: number } {
  const k = (1 - Math.cos((2 * Math.PI * tMs) / m.periodMs)) / 2;
  return { x: m.dx * k, y: m.dy * k };
}

export const MOVER_H = 20;

/** 彈跳墊:往上速度(一般跳 670,大約跳兩倍高)、寬、高。 */
export const SPRING_VY = 950;
export const SPRING_W = 56;
export const SPRING_H = 18;

/** 會掉的平台:站上去抖多久才掉、掉下去多久長回來。 */
export const CRUMBLE_SHAKE_MS = 800;
export const CRUMBLE_RESPAWN_MS = 4000;

export interface CrumbleState {
  phase: 'solid' | 'shaking' | 'fallen';
  ms: number;
}

export function stepCrumble(s: CrumbleState, stoodOn: boolean, dtMs: number): CrumbleState {
  const ms = s.ms + Math.min(dtMs, MAX_DT_MS);
  switch (s.phase) {
    case 'solid':
      return stoodOn ? { phase: 'shaking', ms: 0 } : s;
    case 'shaking':
      // 抖起來之後離開也會掉。
      return ms >= CRUMBLE_SHAKE_MS ? { phase: 'fallen', ms: 0 } : { phase: 'shaking', ms };
    case 'fallen':
      return ms >= CRUMBLE_RESPAWN_MS ? { phase: 'solid', ms: 0 } : { phase: 'fallen', ms };
  }
}

/**
 * Arcade 物理固定每步 frameMs(1/60 秒):把這一格的時間加進累積的時間,算出這一格會走幾步。
 * 高更新率螢幕(144 Hz 以上)有的格子一步都不走、有的走一步。
 */
export function physicsSteps(elapsedMs: number, dtMs: number, frameMs: number): number {
  return Math.floor((elapsedMs + dtMs) / frameMs);
}

/** 這一格要走 delta 的距離:平均分給這一格會走的步數(一步都不走時速度 0,下一格再補)。 */
export function moverVelocity(delta: number, steps: number, frameMs: number): number {
  return steps > 0 ? (delta * 1000) / (steps * frameMs) : 0;
}
