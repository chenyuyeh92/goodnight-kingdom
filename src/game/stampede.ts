import { MAX_DT_MS } from '../config/tuning';
import type { Span } from './water';

/** 角馬跑的速度(px/s)。 */
export const HERD_SPEED = 360;
/** 衝過來之前,畫面邊緣揚起沙塵、地面震動的預告時間。 */
export const HERD_WARN_MS = 1200;
/** 玩家在奔跑區裡時,每隔這麼久衝來一群。 */
export const HERD_EVERY_MS = 7000;
/** 進到奔跑區後多久第一群開始預告。 */
export const HERD_FIRST_MS = 1500;
/**
 * 一群角馬:兩隻一組,組跟組之間留空隙(一組 0.3 秒就跑過去,組跟組之間 1.1 秒,一組一組跳得過)。
 * 數字是每隻離帶頭那隻多遠(往後排)。
 */
export const HERD_OFFSETS: readonly number[] = [0, 50, 450, 500, 900, 950];
/** 角馬的判定(比圖小一點,擦到邊不算)。 */
export const BEAST_W = 40;
export const BEAST_H = 48;

export interface StampedeState {
  timerMs: number;
  /** 正在預告的那一群從哪邊來(1:從左邊往右跑、-1:從右邊往左跑);null 表示沒有預告。 */
  warning: 1 | -1 | null;
  count: number;
}

export function freshStampede(): StampedeState {
  return { timerMs: HERD_EVERY_MS - HERD_FIRST_MS, warning: null, count: 0 };
}

export interface StampedeStep {
  state: StampedeState;
  /** 這一格開始預告(方向)。 */
  warn: 1 | -1 | null;
  /** 這一格放出一群(方向)。 */
  release: 1 | -1 | null;
}

/**
 * 奔跑區:有醒著的玩家在區裡時計時,時間到先預告 1.2 秒,再放一群角馬從右邊衝過來。
 * 沒人在區裡時重新計時;已經在預告的照樣放出來(玩家剛好走出區也一樣)。
 */
export function stepStampede(st: StampedeState, zones: readonly Span[], playerXs: readonly number[], dtMs: number): StampedeStep {
  const dt = Math.min(dtMs, MAX_DT_MS);
  if (st.warning !== null) {
    const timerMs = st.timerMs + dt;
    if (timerMs < HERD_WARN_MS) return { state: { ...st, timerMs }, warn: null, release: null };
    return { state: { timerMs: 0, warning: null, count: st.count + 1 }, warn: null, release: st.warning };
  }
  const inZone = playerXs.some((x) => zones.some((z) => x >= z.x && x <= z.x + z.w));
  if (!inZone) return { state: { ...freshStampede(), count: st.count }, warn: null, release: null };
  const timerMs = st.timerMs + dt;
  if (timerMs < HERD_EVERY_MS) return { state: { ...st, timerMs }, warn: null, release: null };
  return { state: { timerMs: 0, warning: -1, count: st.count }, warn: -1, release: null };
}

/** 角馬有沒有撞到玩家(玩家判定:中心 x、上緣、下緣、半寬)。 */
export function beastHits(beastX: number, groundY: number, px: number, top: number, bottom: number, halfW: number): boolean {
  const bTop = groundY - BEAST_H;
  return Math.abs(beastX - px) < BEAST_W / 2 + halfW && bottom > bTop && top < groundY;
}
