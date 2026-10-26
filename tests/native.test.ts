import { test, expect, beforeEach } from 'vitest';
import { parseNativeMessage, nativeState, applyNativeMessage, resetNativeState, requestPurchase, initNativeBridge, FULL_KEY } from '../src/platform/native';
import { needsFullVersion } from '../src/config/edition';

beforeEach(() => resetNativeState());

test('App 傳來的訊息要檢查格式:商店狀態、購買結果;壞掉的丟掉', () => {
  expect(parseNativeMessage({ type: 'store', full: false, price: 'NT$100' })).toEqual({ type: 'store', full: false, price: 'NT$100' });
  expect(parseNativeMessage({ type: 'store', full: true, price: null })).toEqual({ type: 'store', full: true, price: null });
  expect(parseNativeMessage({ type: 'purchase', result: 'ok', full: true })).toEqual({ type: 'purchase', result: 'ok', full: true });
  expect(parseNativeMessage({ type: 'purchase', result: 'cancelled', full: false })).toEqual({ type: 'purchase', result: 'cancelled', full: false });
  expect(parseNativeMessage({ type: 'purchase', result: 'weird', full: true })).toBeNull();
  expect(parseNativeMessage({ type: 'store', full: 'yes' })).toBeNull();
  expect(parseNativeMessage({ type: 'nope' })).toBeNull();
  expect(parseNativeMessage(null)).toBeNull();
  expect(parseNativeMessage('{"type":"store","full":true,"price":null}')).toEqual({ type: 'store', full: true, price: null });
});

test('買到完整版:世界 4–10 打開;還沒買時鎖著', () => {
  expect(needsFullVersion('w4-1')).toBe(true);
  applyNativeMessage({ type: 'store', full: false, price: 'NT$100' });
  expect(nativeState.price).toBe('NT$100');
  expect(needsFullVersion('w4-1')).toBe(true);
  applyNativeMessage({ type: 'purchase', result: 'ok', full: true });
  expect(nativeState.full).toBe(true);
  expect(needsFullVersion('w4-1')).toBe(false);
  expect(needsFullVersion('w10-3')).toBe(false);
});

test('購買中的狀態:送出購買後是 busy,收到結果就結束;取消不會解鎖', () => {
  nativeState.busy = true;
  applyNativeMessage({ type: 'purchase', result: 'cancelled', full: false });
  expect(nativeState.busy).toBe(false);
  expect(nativeState.lastResult).toBe('cancelled');
  expect(needsFullVersion('w4-1')).toBe(true);
});

test('已經買過的人(恢復購買、重新安裝):商店狀態說 full 就解鎖', () => {
  applyNativeMessage({ type: 'store', full: true, price: null });
  expect(needsFullVersion('w7-2')).toBe(false);
});

test('買、恢復購買:送出一次後等結果,中間再按不會重送', () => {
  const sent: string[] = [];
  (globalThis as unknown as { window: unknown }).window = { ReactNativeWebView: { postMessage: (d: string) => sent.push(d) } };
  try {
    requestPurchase('buy');
    requestPurchase('buy');
    expect(sent).toEqual(['{"type":"buy"}']);
    applyNativeMessage({ type: 'purchase', result: 'failed', full: false });
    requestPurchase('restore');
    expect(sent).toEqual(['{"type":"buy"}', '{"type":"restore"}']);
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
});

test('買過的人沒有網路也能玩:完整版記在裝置上,下次打開 App 直接解鎖', () => {
  const data = new Map<string, string>();
  const store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  (globalThis as unknown as { window: unknown }).window = { ReactNativeWebView: { postMessage: () => undefined } };
  try {
    initNativeBridge(store);
    expect(nativeState.full).toBe(false);
    applyNativeMessage({ type: 'purchase', result: 'ok', full: true });
    expect(data.get(FULL_KEY)).toBe('1');
    resetNativeState();
    initNativeBridge(store);
    expect(nativeState.full).toBe(true);
    // App Store 查不到(沒網路)時傳 full:false,也不會把買過的鎖回去。
    applyNativeMessage({ type: 'store', full: false, price: null });
    expect(nativeState.full).toBe(true);
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
});

test('購買前詢問(孩子的帳號):先是等家長,家長同意後 App 再傳一次就解鎖', () => {
  expect(parseNativeMessage({ type: 'purchase', result: 'pending', full: false })).toEqual({ type: 'purchase', result: 'pending', full: false });
  nativeState.busy = true;
  applyNativeMessage({ type: 'purchase', result: 'pending', full: false });
  expect(nativeState.busy).toBe(false);
  expect(needsFullVersion('w4-1')).toBe(true);
  applyNativeMessage({ type: 'purchase', result: 'ok', full: true });
  expect(needsFullVersion('w4-1')).toBe(false);
});
