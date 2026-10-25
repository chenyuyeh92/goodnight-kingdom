import type { Intent } from '../input/intent';
import type { HostMedia } from './hostMedia';
import type { HostLink } from './link';

/** 房主這台目前開著的線上房間與要傳的畫面;回到主選單時關掉(朋友那邊會顯示連線中斷)。 */
export const online: { host: HostLink | null; media: HostMedia | null; code: string | null } = { host: null, media: null, code: null };

/** 每次開房間或離開都換一個號碼:還在等連線服務的舊流程看到號碼變了就自己收掉。 */
let generation = 0;

export function nextGeneration(): number {
  return ++generation;
}

export function isCurrent(gen: number): boolean {
  return gen === generation;
}

export function endOnline(): void {
  generation++;
  online.host?.close();
  online.host = null;
  online.code = null;
  online.media?.stop();
  online.media = null;
}

/** 線上雙人時玩家 B 的操作(朋友不在時 null);不是線上雙人時 undefined。 */
export function remoteIntent(): Intent | null | undefined {
  return online.host ? online.host.intent() : undefined;
}
