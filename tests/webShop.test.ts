import { afterEach, expect, test } from 'vitest';
import { initWebShop, resetWebShop, webShopAllowed, webShopVisible } from '../src/platform/webShop';
import { fullVersion, needsFullVersion } from '../src/config/edition';

// 網頁版是免費試玩:開賣後(或測試網址 ?shop=1)世界 4 有「買 Windows 電腦版」;網頁版本身不能解鎖完整版。App 裡一律沒有(Apple 3.1.1)。

afterEach(() => {
  resetWebShop();
  delete (globalThis as { window?: unknown }).window;
});

test('還沒開賣:沒有購買按鈕;?shop=1 才有', () => {
  initWebShop(new URLSearchParams(''));
  expect(webShopVisible()).toBe(false);
  initWebShop(new URLSearchParams('shop=1'));
  expect(webShopVisible()).toBe(true);
});

test('網頁版不能解鎖完整版', () => {
  initWebShop(new URLSearchParams('shop=1'));
  expect(fullVersion()).toBe(false);
  expect(needsFullVersion('w4-1')).toBe(true);
});

test('App 裡(有 ReactNativeWebView):網頁版的購買按鈕不存在', () => {
  (globalThis as { window?: unknown }).window = { ReactNativeWebView: { postMessage: () => {} } };
  expect(webShopAllowed()).toBe(false);
  initWebShop(new URLSearchParams('shop=1'));
  expect(webShopVisible()).toBe(false);
});
