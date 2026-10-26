/**
 * 網頁版是免費試玩(世界 1–3);完整版在電腦上賣「Windows 下載版」(葉宸佑 2026-10-26 定案,小商店 shop/)。
 * 這裡只負責網頁版的「買電腦版」按鈕:按了到小商店的購買頁。網頁版本身不能解鎖完整版。
 * - **App 版一律不用這裡**(Apple 3.1.1:App 裡的解鎖只能用 Apple/Google 的付款,不能出現綠界或「去網站買」):
 *   App 和電腦版打包時設 VITE_APP=1,這個檔案的功能整個關掉;萬一網頁版的程式跑在 App 裡(isNativeApp()),也一樣關掉。
 */

import { isNativeApp } from './native';

/** 小商店的網址(本機測試可以用 VITE_SHOP_URL 換成 http://localhost:8789)。App/電腦版打包時是空的。 */
export const SHOP_URL: string = import.meta.env.VITE_APP === '1' ? '' : (import.meta.env.VITE_SHOP_URL ?? 'https://goodnight-shop.mozart-shop.workers.dev');
/**
 * 開賣了沒:綠界正式環境上線後改成 true(shop/README.md「換正式」)。
 * 還沒開賣時,網頁版照舊寫「完整版即將推出」;網址加 ?shop=1 才看得到購買按鈕(測試用)。
 */
export const SHOP_OPEN = false;
export const PRICE_TEXT = 'NT$100';

let shown = false;

/** 這個環境能不能出現網頁版的購買按鈕(App、電腦版裡永遠不行)。 */
export function webShopAllowed(): boolean {
  // 直接寫 import.meta.env(不經過別的常數):打包 App/電腦版時整段變成 false,後面的文字、網址都會被打包工具拿掉。
  return import.meta.env.VITE_APP === '1' ? false : !isNativeApp();
}

/** 網頁版要不要顯示「買 Windows 電腦版」。 */
export function webShopVisible(): boolean {
  return webShopAllowed() && shown;
}

export function initWebShop(params: URLSearchParams): void {
  if (import.meta.env.VITE_APP === '1' || !webShopAllowed()) return;
  shown = SHOP_OPEN || params.get('shop') === '1';
}

export function resetWebShop(): void {
  shown = false;
}

/** 到小商店的購買頁(開新分頁,試玩的進度留在原本的分頁)。 */
export function openBuyPage(): void {
  if (import.meta.env.VITE_APP === '1' || !webShopAllowed()) return;
  window.open(`${SHOP_URL}/buy${SHOP_OPEN ? '' : '?test=1'}`, '_blank', 'noopener');
}
