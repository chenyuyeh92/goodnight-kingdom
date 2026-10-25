/**
 * 測試工具(葉宸佑 2026-10-22 要求):選關畫面的「測試模式」按鈕,可以不照順序玩任何一關,或直接從關主開始。
 *
 * ⚠️ 公開上市前把 TEST_TOOLS 改成 false(docs/release-checklist.md 第一項),按鈕就會整個消失。
 */
export const TEST_TOOLS = false;

const KEY = 'gk.test.v1';

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

function storage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** 測試模式是否開著(記在這台裝置上);TEST_TOOLS 關掉時永遠是 false。 */
export function testModeOn(s: StorageLike | null = storage()): boolean {
  if (!TEST_TOOLS) return false;
  try {
    return s?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setTestMode(on: boolean, s: StorageLike | null = storage()): void {
  if (!TEST_TOOLS) return;
  try {
    s?.setItem(KEY, on ? '1' : '0');
  } catch {
    // 無法存檔(私密瀏覽)時只是記不住,不影響遊戲。
  }
}
