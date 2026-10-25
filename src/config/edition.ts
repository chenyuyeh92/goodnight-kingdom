import type { LevelId } from '../levels/levelDef';
import { worldOf } from '../game/progress';
import { testModeOn } from './testTools';

/**
 * 免費版與完整版(葉宸佑 2026-10-25 定案:網頁版跟 App 一樣,世界 1–3 免費)。
 * 網頁版是免費版;App 版打包時設 VITE_FULL=1,或之後買了完整版才全部開放。
 */
export const FREE_WORLDS = 3;
export const FULL_BUILD = import.meta.env.VITE_FULL === '1';

/** 測試用網址(?test=1)也全部開放;TEST_TOOLS 關掉時沒有作用。 */
let testFull = false;

export function setTestFull(on: boolean): void {
  testFull = on;
}

/** 現在能不能玩完整版(世界 4–10)。選關畫面的測試模式也算。 */
export function fullVersion(): boolean {
  return FULL_BUILD || testFull || testModeOn();
}

/** 這一關要不要完整版才能玩。 */
export function needsFullVersion(id: LevelId, full: boolean = fullVersion()): boolean {
  const w = worldOf(id);
  return !full && w !== null && w > FREE_WORLDS;
}
