import { MAX_DT_MS } from '../config/tuning';
import type { Span } from './water';

/** 熔岩兩邊各內縮這麼多才算踩到(腳尖碰到邊緣不算)。 */
export const LAVA_EDGE = 8;
/** 噴發區:玩家在區裡時每隔這麼久噴發一次。 */
export const ERUPT_MS = 2800;
/** 進到噴發區後多久第一次噴發。 */
export const ERUPT_FIRST_MS = 1000;
/** 第二顆石頭離第一顆多遠(左右輪流)。 */
export const ERUPT_SIDE = 170;

export function onLava(x: number, lava: readonly Span[]): boolean {
  return lava.some((s) => x >= s.x + LAVA_EDGE && x <= s.x + s.w - LAVA_EDGE);
}

export interface EruptionState {
  timerMs: number;
  /** 這一局總共噴發幾次。 */
  count: number;
}

export function freshEruption(): EruptionState {
  return { timerMs: ERUPT_MS - ERUPT_FIRST_MS, count: 0 };
}

/**
 * 火山噴發:有醒著的玩家在噴發區裡時計時,時間到掉兩顆石頭(一顆對準那位玩家、一顆在旁邊,左右輪流),
 * 都夾在那個噴發區裡。沒有人在區裡時重新計時(下次進來 1 秒後噴發)。
 */
export function stepEruption(st: EruptionState, zones: readonly Span[], playerXs: readonly number[], dtMs: number): { state: EruptionState; rocks: number[] } {
  let zone: Span | undefined;
  let px = 0;
  for (const x of playerXs) {
    zone = zones.find((z) => x >= z.x && x <= z.x + z.w);
    if (zone) {
      px = x;
      break;
    }
  }
  // 噴發次數一直累加(除錯顯示用),只有計時重來。
  if (!zone) return { state: { ...freshEruption(), count: st.count }, rocks: [] };
  const timerMs = st.timerMs + Math.min(dtMs, MAX_DT_MS);
  if (timerMs < ERUPT_MS) return { state: { ...st, timerMs }, rocks: [] };
  const z = zone;
  const clamp = (x: number): number => Math.min(Math.max(x, z.x), z.x + z.w);
  // 玩家在區的邊上時,旁邊那顆改掉在另一邊(不疊在同一個位置)。
  let side = st.count % 2 === 0 ? 1 : -1;
  if (Math.abs(clamp(px + side * ERUPT_SIDE) - clamp(px)) < ERUPT_SIDE / 2) side = -side;
  return { state: { timerMs: 0, count: st.count + 1 }, rocks: [clamp(px), clamp(px + side * ERUPT_SIDE)] };
}
