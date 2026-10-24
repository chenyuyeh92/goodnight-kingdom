import type { StorageLike } from './tuning';

/** 這台裝置的 localStorage;無痕模式或被封鎖時是 null(遊戲照常,只是記不住)。 */
export function safeLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
