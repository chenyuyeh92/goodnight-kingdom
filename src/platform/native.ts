/**
 * App 版(iPhone、iPad):遊戲在 App 的 WebView 裡跑,透過這裡跟 App 溝通。
 * - 遊戲 → App:買完整版、恢復購買、用 Safari 開網頁、用系統分享選單分享畫的守衛。
 * - App → 遊戲:商店狀態(買過沒有、價格)、購買結果。App 用 window.__gkNative(訊息) 傳進來。
 * 網頁版沒有 App,這些都不會動(isNativeApp() 是 false)。
 */

import type { StorageLike } from '../config/tuning';

/** pending:孩子的帳號開了「購買前詢問」,要等家長在自己的手機上同意。 */
export type PurchaseResult = 'ok' | 'restored' | 'pending' | 'cancelled' | 'failed' | 'nothingToRestore';

export type FromNative =
  | { type: 'store'; full: boolean; price: string | null }
  | { type: 'purchase'; result: PurchaseResult; full: boolean };

export type ToNative =
  | { type: 'ready' }
  | { type: 'buy' }
  | { type: 'restore' }
  | { type: 'openUrl'; url: string }
  | { type: 'shareImage'; dataUrl: string; name: string };

const RESULTS: readonly PurchaseResult[] = ['ok', 'restored', 'pending', 'cancelled', 'failed', 'nothingToRestore'];

/** App 那邊的狀態:買過完整版沒有、商店顯示的價格、正在買、上一次購買的結果。 */
export const nativeState: { full: boolean; price: string | null; busy: boolean; lastResult: PurchaseResult | null } = {
  full: false,
  price: null,
  busy: false,
  lastResult: null,
};

const listeners = new Set<(m: FromNative) => void>();

/** 買過完整版就記在這台裝置上:沒有網路、App Store 查不到時也照樣能玩。 */
export const FULL_KEY = 'gk.full.v1';
let storage: StorageLike | null = null;

interface Bridge {
  postMessage(data: string): void;
}

function bridge(): Bridge | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { ReactNativeWebView?: Bridge }).ReactNativeWebView ?? null;
}

/** 是不是在 App 裡(App 的 WebView 會先放好 ReactNativeWebView)。 */
export function isNativeApp(): boolean {
  return bridge() !== null;
}

export function sendToNative(m: ToNative): void {
  bridge()?.postMessage(JSON.stringify(m));
}

/** 檢查 App 傳來的訊息;格式不對就丟掉。 */
export function parseNativeMessage(raw: unknown): FromNative | null {
  let x = raw;
  if (typeof x === 'string') {
    try {
      x = JSON.parse(x);
    } catch {
      return null;
    }
  }
  if (typeof x !== 'object' || x === null) return null;
  const m = x as Record<string, unknown>;
  if (m.type === 'store' && typeof m.full === 'boolean' && (m.price === null || typeof m.price === 'string')) {
    return { type: 'store', full: m.full, price: m.price as string | null };
  }
  if (m.type === 'purchase' && typeof m.full === 'boolean' && RESULTS.includes(m.result as PurchaseResult)) {
    return { type: 'purchase', result: m.result as PurchaseResult, full: m.full };
  }
  return null;
}

export function applyNativeMessage(m: FromNative): void {
  if (m.type === 'store') {
    nativeState.full = nativeState.full || m.full;
    nativeState.price = m.price;
  } else {
    nativeState.full = nativeState.full || m.full;
    nativeState.busy = false;
    nativeState.lastResult = m.result;
  }
  if (nativeState.full) storage?.setItem(FULL_KEY, '1');
  listeners.forEach((cb) => cb(m));
}

/** 收 App 的訊息(換畫面時記得取消)。 */
export function onNativeMessage(cb: (m: FromNative) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resetNativeState(): void {
  nativeState.full = false;
  nativeState.price = null;
  nativeState.busy = false;
  nativeState.lastResult = null;
  storage = null;
}

/** 遊戲開始時呼叫:準備好接 App 的訊息,告訴 App「可以傳商店狀態了」。 */
export function initNativeBridge(store: StorageLike | null): void {
  if (!isNativeApp()) return;
  storage = store;
  if (store?.getItem(FULL_KEY) === '1') nativeState.full = true;
  (window as unknown as { __gkNative?: (raw: unknown) => void }).__gkNative = (raw) => {
    const m = parseNativeMessage(raw);
    if (m) applyNativeMessage(m);
  };
  sendToNative({ type: 'ready' });
}

/** 說明、隱私權等網頁放在公開網站上(App 裡的遊戲是從手機本機載入的,Safari 打不開那個網址)。 */
export const SITE_URL = 'https://chenyuyeh92.github.io/goodnight-kingdom/';

/** 開網站上的說明頁:App 裡用 Safari 開,網頁版開新分頁。 */
export function openPage(file: string): void {
  if (isNativeApp()) sendToNative({ type: 'openUrl', url: SITE_URL + file });
  else window.open(`${import.meta.env.BASE_URL}${file}`, '_blank', 'noopener');
}

/** 買完整版、恢復購買:送出後等 App 回 purchase 訊息。 */
export function requestPurchase(kind: 'buy' | 'restore'): void {
  if (nativeState.busy) return;
  nativeState.busy = true;
  sendToNative({ type: kind });
}
