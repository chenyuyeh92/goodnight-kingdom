import { MAX_DT_MS } from '../config/tuning';

/** 藤蔓:頂端掛在 (x, top),美術圖 20×160。 */
export interface Vine {
  x: number;
  top: number;
}

export const VINE_LEN = 160;
/** 抓住的地方離頂端多遠(手的位置)。 */
export const HAND_R = 150;
/** 藤蔓上半段抓不到,只有下面這段(離頂端 50 以下)。 */
const GRAB_FROM = 50;
/** 玩家中心離藤蔓這麼近就抓得到。 */
const GRAB_DX = 22;
/** 盪的重力(和玩家跳躍的重力一樣)。 */
const SWING_G = 1550;
/** 按住左右可以越盪越高。 */
const PUMP = 4;
/** 最多盪到 70 度。 */
export const MAX_ANGLE = 1.2;
/** 抓到時至少有這個角速度(小朋友不用自己盪也過得去,大約盪到 50 度)。 */
export const GRAB_OMEGA = 2.6;
/** 沒人抓的藤蔓慢慢停回垂直。 */
const FREE_DAMP = 3;
/** 放手時的速度:水平至少 260、最多 420,往上 520。 */
export const RELEASE_MIN_VX = 260;
const RELEASE_MAX_VX = 420;
export const RELEASE_VY = -520;
/** 放手後這麼久之內不會再抓回同一條(避免一放手又抓住)。 */
export const REGRAB_MS = 400;

export interface VineState {
  /** 偏離垂直的角度(弧度),往右為正。 */
  angle: number;
  /** 角速度(弧度/秒)。 */
  omega: number;
}

export const restingVine = (): VineState => ({ angle: 0, omega: 0 });

/** 手的位置。 */
export function vineHand(v: Vine, st: VineState, r = HAND_R): { x: number; y: number } {
  return { x: v.x + Math.sin(st.angle) * r, y: v.top + Math.cos(st.angle) * r };
}

/** 玩家(在空中)碰到藤蔓下段就抓得住。身體上緣 top、下緣 bottom。 */
export function canGrab(v: Vine, st: VineState, px: number, top: number, bottom: number): boolean {
  const lo = v.top + Math.cos(st.angle) * GRAB_FROM;
  const hi = v.top + Math.cos(st.angle) * VINE_LEN;
  if (bottom < lo || top > hi) return false;
  // 藤蔓在玩家身體中間那個高度的 x。
  const y = Math.min(Math.max((top + bottom) / 2, lo), hi);
  const along = (y - v.top) / Math.max(Math.cos(st.angle), 0.2);
  return Math.abs(px - (v.x + Math.sin(st.angle) * along)) <= GRAB_DX;
}

/** 抓住時的角速度:順著玩家飛過來的方向(沒速度就看面向),至少 GRAB_OMEGA。 */
export function grabOmega(vx: number, facing: 1 | -1): number {
  const dir = Math.abs(vx) > 20 ? Math.sign(vx) : facing;
  return dir * Math.max(Math.abs(vx) / HAND_R, GRAB_OMEGA);
}

/**
 * 盪一格:單擺,按住左右(push)往那邊加速;沒人抓時慢慢停回垂直。
 * 盪到 MAX_ANGLE 就停在那裡往回盪。
 */
export function stepVine(st: VineState, held: boolean, push: -1 | 0 | 1, dtMs: number): VineState {
  const dt = Math.min(dtMs, MAX_DT_MS) / 1000;
  let alpha = (-SWING_G / HAND_R) * Math.sin(st.angle);
  if (held && push !== 0) alpha += push * PUMP;
  let omega = st.omega + alpha * dt;
  if (!held) omega *= Math.max(0, 1 - FREE_DAMP * dt);
  let angle = st.angle + omega * dt;
  if (Math.abs(angle) > MAX_ANGLE) {
    angle = Math.sign(angle) * MAX_ANGLE;
    omega = 0;
  }
  return { angle, omega };
}

/** 放手:往盪的方向飛出去(盪得慢時看面向),水平夾在 260–420、往上 520。 */
export function releaseVelocity(st: VineState, facing: 1 | -1): { vx: number; vy: number } {
  const speed = Math.abs(st.omega * HAND_R);
  const dir = Math.abs(st.omega) > 0.3 ? Math.sign(st.omega) : facing;
  return { vx: dir * Math.min(Math.max(speed, RELEASE_MIN_VX), RELEASE_MAX_VX), vy: RELEASE_VY };
}
