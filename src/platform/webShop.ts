/**
 * 網頁版的完整版(葉宸佑 2026-10-26:綠界付款,只放網頁版)。
 * - 在網頁上用綠界買(小商店 shop/,Cloudflare Worker),付款完成拿到「解鎖碼」;遊戲問小商店這個碼對不對,對了就記在這台裝置。
 * - **App 版一律不用這裡**(Apple 3.1.1:App 裡的解鎖只能用 Apple/Google 的付款,不能出現綠界或「去網站買」):
 *   App 打包時設 VITE_APP=1,這個檔案的功能整個關掉;萬一網頁版的程式跑在 App 裡(isNativeApp()),也一樣關掉。
 * - 測試環境(綠界測試特店)買到的碼只在這一次打開時解鎖,不存起來:測試特店的金鑰是公開的,任何人都能偽造付款。
 */

import type { StorageLike } from '../config/tuning';
import { isNativeApp } from './native';

/** App 版打包(app/scripts/build-web.mjs 設 VITE_APP=1):網頁版的購買整個不存在。 */
export const APP_BUILD = import.meta.env.VITE_APP === '1';
/** 小商店的網址(本機測試可以用 VITE_SHOP_URL 換成 http://localhost:8789)。 */
export const SHOP_URL: string = import.meta.env.VITE_APP === '1' ? '' : (import.meta.env.VITE_SHOP_URL ?? 'https://goodnight-shop.mozart-shop.workers.dev');
/**
 * 開賣了沒:綠界正式環境上線後改成 true(shop/README.md「換正式」)。
 * 還沒開賣時,網頁版照舊寫「完整版即將推出」;網址加 ?shop=1 才看得到購買按鈕(測試用)。
 */
export const SHOP_OPEN = false;

export const WEB_FULL_KEY = 'gk.webfull.v1';
export const PRICE_TEXT = 'NT$100';

export type RedeemResult = 'ok' | 'test' | 'notfound' | 'limit' | 'format' | 'network';

export const webState: { full: boolean; test: boolean; shopShown: boolean } = { full: false, test: false, shopShown: false };

let storage: StorageLike | null = null;
const listeners = new Set<(r: RedeemResult) => void>();

/** 解鎖碼檢查完了(選關畫面用來重新整理;回傳取消監聽)。 */
export function onWebShop(cb: (r: RedeemResult) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 這個環境能不能用網頁版的購買(App 裡永遠不行)。 */
export function webShopAllowed(): boolean {
  // 直接寫 import.meta.env(不經過 APP_BUILD):App 打包時整段變成 false,後面用到的文字、網址都會被打包工具拿掉。
  return import.meta.env.VITE_APP === '1' ? false : !isNativeApp();
}

/** 網頁版要不要顯示「解鎖完整版」「輸入解鎖碼」。 */
export function webShopVisible(): boolean {
  return webShopAllowed() && webState.shopShown;
}

/** 玩家輸入的碼:大小寫、空白、橫線都不管。 */
export function normalizeCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function resetWebShop(): void {
  webState.full = false;
  webState.test = false;
  webState.shopShown = false;
  storage = null;
  listeners.clear();
}

/** 啟動時:讀這台裝置記住的解鎖;網址帶 #unlock=解鎖碼(付款完成頁的「回到遊戲並解鎖」)就自動解鎖。 */
export function initWebShop(store: StorageLike | null, params: URLSearchParams): void {
  if (import.meta.env.VITE_APP === '1' || !webShopAllowed()) return;
  storage = store;
  webState.shopShown = SHOP_OPEN || params.get('shop') === '1';
  try {
    if (store?.getItem(WEB_FULL_KEY)) webState.full = true;
  } catch {
    // 無法讀取(私密瀏覽)時當作沒買過;可以再輸入一次解鎖碼。
  }
  const m = /^#unlock=([A-Za-z0-9-]{1,40})$/.exec(window.location.hash);
  if (!m) return;
  webState.shopShown = true;
  void redeemCode(m[1]).then((r) => {
    // 檢查完就把解鎖碼從網址拿掉(不留在瀏覽紀錄、分享網址時也不會帶出去);連不上網路時留著,重新整理就會再試一次。
    if (r !== 'network') history.replaceState(null, '', window.location.pathname + window.location.search);
    showToast(redeemMessage(r));
  });
}

/** 問小商店這個解鎖碼對不對;對了就打開完整版。 */
export async function redeemCode(raw: string, fetcher: typeof fetch = fetch): Promise<RedeemResult> {
  if (import.meta.env.VITE_APP === '1' || !webShopAllowed()) return 'notfound';
  const code = normalizeCode(raw);
  if (code.length !== 12) return 'format';
  let j: { ok?: boolean; stage?: boolean; error?: string };
  try {
    const r = await fetcher(`${SHOP_URL}/api/redeem`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    j = await r.json();
  } catch {
    return done('network');
  }
  if (!j.ok) return done(j.error === 'limit' || j.error === 'format' ? j.error : 'notfound');
  webState.full = true;
  if (j.stage) {
    webState.test = true;
    return done('test');
  }
  try {
    storage?.setItem(WEB_FULL_KEY, JSON.stringify({ code, at: new Date().toISOString() }));
  } catch {
    // 存不起來(私密瀏覽):這次照樣解鎖,下次再輸入一次。
  }
  return done('ok');
}

function done(r: RedeemResult): RedeemResult {
  listeners.forEach((cb) => cb(r));
  return r;
}

/** 到小商店的購買頁(同一個分頁;遊戲進度都存在這台裝置,回來不會不見)。 */
export function openBuyPage(): void {
  if (!webShopAllowed()) return;
  window.location.assign(`${SHOP_URL}/buy${SHOP_OPEN ? '' : '?test=1'}`);
}

/** 解鎖碼檢查結果的說明(畫面上的字)。 */
export function redeemMessage(r: RedeemResult): { zh: string; en: string } {
  if (import.meta.env.VITE_APP === '1') return { zh: '', en: '' };
  switch (r) {
    case 'ok':
      return { zh: '謝謝你!完整版打開了,十個世界都可以玩。', en: 'Thank you! The full version is unlocked. All ten worlds are open.' };
    case 'test':
      return { zh: '測試解鎖:這是測試環境買的解鎖碼,只在這次打開有效(重新整理就會恢復免費版)。', en: 'Test unlock: this code is from the test shop and only lasts until you reload.' };
    case 'limit':
      return { zh: '這個解鎖碼已經用在太多台裝置了。請寫信給我們(信箱在購買頁)。', en: 'This code has been used on too many devices. Please email us (address on the shop page).' };
    case 'format':
      return { zh: '解鎖碼是 12 個英文字母和數字(例如 ABCD-EFGH-JKLM),請再檢查一次。', en: 'An unlock code has 12 letters and numbers (like ABCD-EFGH-JKLM). Please check it again.' };
    case 'network':
      return { zh: '連不上網路,請檢查網路後再試一次。', en: 'Could not connect. Check your connection and try again.' };
    default:
      return { zh: '找不到這個解鎖碼,請再檢查一次(信箱裡也有)。', en: 'That unlock code was not found. Please check it again (it is also in your email).' };
  }
}

/** 畫面上方跳出一行字,幾秒後消失(從付款完成頁回來時,不管在哪個畫面都看得到)。 */
function showToast(text: { zh: string; en: string }): void {
  const el = document.createElement('div');
  el.textContent = document.documentElement.lang === 'en' ? text.en : text.zh;
  el.setAttribute('role', 'status');
  el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);max-width:min(90vw,640px);z-index:50;padding:12px 18px;border-radius:14px;background:#2b2a6b;color:#ffe08a;border:2px solid #ffe08a;font:600 17px/1.5 system-ui,sans-serif;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.4)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 7000);
}
