/**
 * 存檔備份(葉宸佑 2026-10-26 定案:換電腦時進度要帶得過去;第一版用「匯出存檔/匯入存檔」小檔案,雲端存檔放第二版)。
 * 把這台裝置上遊戲的資料(gk. 開頭:通關紀錄、背包、畫的守衛、音量、語言)存成一個 JSON 檔;匯入時整份換掉。
 * 「買過完整版」的紀錄不放進備份:不然拿別人的備份檔就能打開完整版。
 */

import type { StorageLike } from '../config/tuning';
import { tr } from '../i18n/lang';

export const BACKUP_APP = 'goodnight-kingdom';
export const BACKUP_VERSION = 1;
const PREFIX = 'gk.';
/** 不備份、匯入時也不動的資料:App 版和網頁版的購買紀錄、測試模式。 */
const SKIP = new Set(['gk.full.v1', 'gk.webfull.v1', 'gk.test.v1']);

export interface BackupStorage extends StorageLike {
  readonly length: number;
  key(i: number): string | null;
  removeItem(k: string): void;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  at: string;
  data: Record<string, string>;
}

function gameKeys(s: BackupStorage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k && k.startsWith(PREFIX) && !SKIP.has(k)) keys.push(k);
  }
  return keys.sort();
}

export function makeBackup(s: BackupStorage, now: Date = new Date()): Backup {
  const data: Record<string, string> = {};
  for (const k of gameKeys(s)) {
    const v = s.getItem(k);
    if (v !== null) data[k] = v;
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, at: now.toISOString(), data };
}

/** 檢查檔案是不是晚安王國的存檔;不是就回 null(不碰任何資料)。 */
export function parseBackup(text: string): Backup | null {
  let x: unknown;
  try {
    x = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof x !== 'object' || x === null) return null;
  const b = x as Record<string, unknown>;
  if (b.app !== BACKUP_APP || typeof b.version !== 'number' || b.version > BACKUP_VERSION) return null;
  if (typeof b.data !== 'object' || b.data === null || Array.isArray(b.data)) return null;
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(b.data as Record<string, unknown>)) {
    if (!k.startsWith(PREFIX) || SKIP.has(k)) continue;
    if (typeof v !== 'string') return null;
    data[k] = v;
  }
  return { app: BACKUP_APP, version: b.version, at: typeof b.at === 'string' ? b.at : '', data };
}

/**
 * 匯入:這台裝置現在的遊戲資料整份換成備份裡的(購買紀錄不動)。
 * 先寫進去、都成功了才刪掉備份裡沒有的舊資料;寫到一半失敗(例如空間滿了)就還原原本的,回傳 false。
 */
export function restoreBackup(s: BackupStorage, b: Backup): boolean {
  const old = makeBackup(s).data;
  try {
    for (const [k, v] of Object.entries(b.data)) s.setItem(k, v);
  } catch {
    for (const k of gameKeys(s)) if (!(k in old)) s.removeItem(k);
    for (const [k, v] of Object.entries(old)) {
      try {
        s.setItem(k, v);
      } catch {
        // 還原也失敗就沒辦法了;各存檔讀取時都會清理壞資料,遊戲照樣開得起來。
      }
    }
    return false;
  }
  for (const k of gameKeys(s)) if (!(k in b.data)) s.removeItem(k);
  return true;
}

/** 存檔檔名:晚安王國存檔-2026-10-26.json(英文:GoodnightKingdom-save-2026-10-26.json) */
export function backupFileName(now: Date = new Date()): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${tr('晚安王國存檔', 'GoodnightKingdom-save')}-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

/** 下載備份檔(網頁版:瀏覽器的下載;電腦版:跳出「另存新檔」)。 */
export function downloadBackup(s: BackupStorage): void {
  const blob = new Blob([JSON.stringify(makeBackup(s))], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** 選一個備份檔(要在按鈕的點擊裡呼叫,瀏覽器才肯開選檔視窗);取消就不會呼叫 cb。 */
export function pickBackupFile(cb: (text: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    const f = input.files?.[0];
    input.remove();
    if (f) void f.text().then(cb);
  });
  document.body.appendChild(input);
  input.click();
}
