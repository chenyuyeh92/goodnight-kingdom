import type { Intent } from '../input/intent';
import type { StorageLike } from '../config/tuning';

/** 房間號碼:6 位數字,念給朋友聽、用數字鍵就能輸入;一百萬種,陌生人很難剛好猜中。 */
export const CODE_LEN = 6;
const CODES = 10 ** CODE_LEN;

export function makeRoomCode(rand: () => number = Math.random): string {
  return String(Math.min(CODES - 1, Math.floor(rand() * CODES))).padStart(CODE_LEN, '0');
}

/** 朋友輸入的號碼:去掉空白、全形數字轉半形;不是剛好 6 位數字就回傳 null。 */
export function cleanCode(input: string): string | null {
  const s = input.replace(/\s+/g, '').replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  return new RegExp(`^\\d{${CODE_LEN}}$`).test(s) ? s : null;
}

const KEYS = ['left', 'right', 'up', 'down', 'jump', 'shoot'] as const;

/** 玩家 B 的操作打包成一個數字(每個按鍵一個位元),每秒送很多次也很省。 */
export function packIntent(i: Intent): number {
  return KEYS.reduce((n, k, bit) => (i[k] ? n | (1 << bit) : n), 0);
}

export function unpackIntent(n: number): Intent {
  return { left: !!(n & 1), right: !!(n & 2), up: !!(n & 4), down: !!(n & 8), jump: !!(n & 16), shoot: !!(n & 32) };
}

/**
 * 透過連線服務交換的訊息(每場只有幾則):
 * probe/taken 房主確認號碼沒人用;hello 朋友敲門;offer/answer/ice 建立直接連線;full 房間已經有人了。
 */
export type SignalMsg =
  | { t: 'probe'; from: string }
  | { t: 'taken'; to: string }
  | { t: 'hello'; from: string }
  | { t: 'full'; to: string }
  | { t: 'offer' | 'answer'; from: string; to: string; sdp: string }
  | { t: 'ice'; from: string; to: string; c: RTCIceCandidateInit | null };

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

export function isSignalMsg(x: unknown): x is SignalMsg {
  if (typeof x !== 'object' || x === null) return false;
  const m = x as Record<string, unknown>;
  switch (m.t) {
    case 'probe':
    case 'hello':
      return str(m.from);
    case 'taken':
    case 'full':
      return str(m.to);
    case 'offer':
    case 'answer':
      return str(m.from) && str(m.to) && str(m.sdp);
    case 'ice':
      return str(m.from) && str(m.to) && (m.c === null || (typeof m.c === 'object' && m.c !== undefined));
    default:
      return false;
  }
}

const LAST_ROOM_KEY = 'gk.lastRoom.v1';
/** 上次加入的房號記多久(朋友中途離開再加入時不用重新問)。 */
const LAST_ROOM_MS = 3 * 3600_000;

/** 記下這次加入的房號。 */
export function rememberRoom(storage: StorageLike | null, code: string, now: number): void {
  try {
    storage?.setItem(LAST_ROOM_KEY, JSON.stringify({ code, at: now }));
  } catch {
    // 記不住也沒關係,只是要重新輸入。
  }
}

/** 3 小時內加入過的房號;沒有或太久就是 null。 */
export function recallRoom(storage: StorageLike | null, now: number): string | null {
  try {
    const raw = JSON.parse(storage?.getItem(LAST_ROOM_KEY) ?? 'null') as { code?: unknown; at?: unknown } | null;
    if (!raw || typeof raw.code !== 'string' || typeof raw.at !== 'number') return null;
    return now - raw.at <= LAST_ROOM_MS ? cleanCode(raw.code) : null;
  } catch {
    return null;
  }
}
