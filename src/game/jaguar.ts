import { MAX_DT_MS } from '../config/tuning';

export type JaguarMode = 'prowl' | 'windup' | 'dash' | 'leap' | 'tree' | 'mark' | 'drop' | 'dizzy';

export interface JaguarBrain {
  mode: JaguarMode;
  timerMs: number;
  facing: 1 | -1;
  /** 下一招是衝過來(true)還是跳上樹撲下來(false)。 */
  dashNext: boolean;
  /** 地上影子(撲下來的落點)。 */
  markX: number;
  /** 這一輪還要再撲幾次(血量一半以下連撲兩次)。 */
  poundsLeft: number;
}

export interface JaguarSense {
  x: number;
  y: number;
  grounded: boolean;
  hpRatio: number;
  targetX: number | null;
  arenaLeft: number;
  arenaRight: number;
  halfW: number;
  dtMs: number;
}

export interface JaguarStep {
  /** null 表示保留目前的速度。 */
  vx: number | null;
  vy: number | null;
  brain: JaguarBrain;
  /** 躲在樹上(畫面上方看不到、打不到、碰不到)。 */
  hidden: boolean;
  /** 搬到這個位置(躲在樹上時跟著影子、撲下來的起點)。 */
  teleport: { x: number; y: number } | null;
  /** 畫在地上的影子位置(撲下來前的預告);null 表示沒有。 */
  shadowX: number | null;
}

export const JAGUAR_PROWL_MS = 1600;
export const JAGUAR_WINDUP_MS = 450;
export const JAGUAR_DASH_MS = 900;
/** 跳上樹:往上衝出畫面,這麼久之後算躲好了。 */
const LEAP_MS = 500;
const TREE_MS = 600;
/** 地上的影子出現多久才撲下來(來得及走開)。 */
export const MARK_MS = 800;
export const DIZZY_MS = 900;
const PROWL_SPEED = 60;
/** 和玩家保持這個距離慢慢繞。 */
const PROWL_KEEP = 250;
const DASH_SPEED = 420;
const LEAP_VY = -950;
const DROP_VY = 900;
/** 躲在樹上時的高度(畫面上方外面)。 */
export const TREE_Y = -200;
const ANGRY_RATIO = 0.5;

export function initialJaguarBrain(): JaguarBrain {
  return { mode: 'prowl', timerMs: 0, facing: -1, dashNext: true, markX: 0, poundsLeft: 0 };
}

/**
 * 熬夜美洲豹:慢慢繞 → 預告 → 輪流「衝過來(要跳過)」與「跳上樹(看不到)→ 玩家腳下出現影子 → 撲下來 → 落地頭暈(可以打)」。
 * 血量一半以下連撲兩次。
 */
export function stepJaguar(b: JaguarBrain, s: JaguarSense): JaguarStep {
  const dt = Math.min(s.dtMs, MAX_DT_MS);
  const timerMs = b.timerMs + dt;
  const toward: 1 | -1 = s.targetX === null ? b.facing : s.targetX < s.x ? -1 : 1;
  const none = { hidden: false, teleport: null, shadowX: null };
  const clampX = (x: number): number => Math.min(Math.max(x, s.arenaLeft + s.halfW), s.arenaRight - s.halfW);

  switch (b.mode) {
    case 'prowl': {
      if (timerMs >= JAGUAR_PROWL_MS && s.targetX !== null) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'windup', timerMs: 0, facing: toward } };
      const far = s.targetX !== null && Math.abs(s.targetX - s.x) > PROWL_KEEP;
      return { ...none, vx: far ? toward * PROWL_SPEED : 0, vy: null, brain: { ...b, timerMs, facing: toward } };
    }
    case 'windup': {
      if (timerMs < JAGUAR_WINDUP_MS) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs } };
      if (b.dashNext) return { ...none, vx: b.facing * DASH_SPEED, vy: null, brain: { ...b, mode: 'dash', timerMs: 0 } };
      const poundsLeft = s.hpRatio <= ANGRY_RATIO ? 2 : 1;
      return { ...none, vx: 0, vy: LEAP_VY, brain: { ...b, mode: 'leap', timerMs: 0, poundsLeft } };
    }
    case 'dash': {
      if (timerMs >= JAGUAR_DASH_MS) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'prowl', timerMs: 0, dashNext: false } };
      // 衝到畫面邊就掉頭。
      let facing = b.facing;
      if (s.x <= s.arenaLeft + s.halfW + 2) facing = 1;
      if (s.x >= s.arenaRight - s.halfW - 2) facing = -1;
      return { ...none, vx: facing * DASH_SPEED, vy: null, brain: { ...b, timerMs, facing } };
    }
    case 'leap': {
      if (timerMs < LEAP_MS) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs } };
      return { ...none, hidden: true, vx: 0, vy: 0, teleport: { x: s.x, y: TREE_Y }, brain: { ...b, mode: 'tree', timerMs: 0 } };
    }
    case 'tree': {
      if (timerMs < TREE_MS) return { ...none, hidden: true, vx: 0, vy: 0, teleport: { x: s.x, y: TREE_Y }, brain: { ...b, timerMs } };
      const markX = clampX(s.targetX ?? s.x);
      return { ...none, hidden: true, vx: 0, vy: 0, teleport: { x: markX, y: TREE_Y }, shadowX: markX, brain: { ...b, mode: 'mark', timerMs: 0, markX } };
    }
    case 'mark': {
      if (timerMs < MARK_MS) return { ...none, hidden: true, vx: 0, vy: 0, teleport: { x: b.markX, y: TREE_Y }, shadowX: b.markX, brain: { ...b, timerMs } };
      return { ...none, vx: 0, vy: DROP_VY, shadowX: b.markX, brain: { ...b, mode: 'drop', timerMs: 0 } };
    }
    case 'drop': {
      if (s.grounded && timerMs > 100) return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'dizzy', timerMs: 0, poundsLeft: b.poundsLeft - 1 } };
      return { ...none, vx: 0, vy: DROP_VY, shadowX: b.markX, brain: { ...b, timerMs } };
    }
    case 'dizzy': {
      if (timerMs < DIZZY_MS) return { ...none, vx: 0, vy: null, brain: { ...b, timerMs } };
      if (b.poundsLeft > 0) return { ...none, vx: 0, vy: LEAP_VY, brain: { ...b, mode: 'leap', timerMs: 0 } };
      return { ...none, vx: 0, vy: null, brain: { ...b, mode: 'prowl', timerMs: 0, dashNext: true } };
    }
  }
}
