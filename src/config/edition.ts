import type { LevelId } from '../levels/levelDef';
import { worldOf } from '../game/progress';
import { testModeOn } from './testTools';
import { nativeState } from '../platform/native';
import { webShopAllowed, webState } from '../platform/webShop';

/**
 * 免費版與完整版(葉宸佑 2026-10-25 定案:網頁版跟 App 一樣,世界 1–3 免費)。
 * App 版在 App 裡用 Apple 內購買完整版(NT$100)後全部開放(src/platform/native.ts)。
 * 網頁版用綠界買、輸入解鎖碼後全部開放(src/platform/webShop.ts,2026-10-26);網頁版的解鎖在 App 裡不算數。
 */
export const FREE_WORLDS = 3;
export const FULL_BUILD = import.meta.env.VITE_FULL === '1';

/** 自動測試專用的打包(VITE_E2E=1):測試網址(?test=1)可以玩全部。正式網站的打包沒有這個。 */
export const E2E_BUILD = import.meta.env.VITE_E2E === '1';

let testFull = false;

export function setTestFull(on: boolean): void {
  testFull = on;
}

/** 現在能不能玩完整版(世界 4–10):App 裡買過完整版、網頁版輸入過解鎖碼(只在網頁版算)、測試網址、選關畫面的測試模式都算。 */
export function fullVersion(): boolean {
  return FULL_BUILD || nativeState.full || (webState.full && webShopAllowed()) || testFull || testModeOn();
}

/** 這一關要不要完整版才能玩。 */
export function needsFullVersion(id: LevelId, full: boolean = fullVersion()): boolean {
  const w = worldOf(id);
  return !full && w !== null && w > FREE_WORLDS;
}
