import type { Intent } from '../input/intent';
import type { HostLink } from './link';

/** 房主這台目前開著的線上房間;回到主選單時關掉(朋友那邊會顯示房主離開了)。 */
export const online: { host: HostLink | null } = { host: null };

export function endOnline(): void {
  online.host?.close();
  online.host = null;
}

/** 線上雙人時玩家 B 的操作(斷線時 null);不是線上雙人時 undefined。 */
export function remoteIntent(): Intent | null | undefined {
  return online.host ? online.host.intent() : undefined;
}
