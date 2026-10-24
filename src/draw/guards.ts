import type { StorageLike } from '../config/tuning';
import { tr } from '../i18n/lang';

export const GUARDS_KEY = 'gk.guards.v1';
export const MAX_GUARDS = 8;
const MAX_NAME = 8;
/** 一張守衛圖(高 128 的 PNG)通常 10–40 KB,超過 300 KB 一定有問題。 */
const MAX_PNG_CHARS = 300_000;
const PNG_PREFIX = 'data:image/png;base64,';

export type GuardPlayer = 'A' | 'B';

export interface Guard {
  id: string;
  name: string;
  png: string;
  createdAt: number;
}

export interface GuardData {
  version: 1;
  guards: Guard[];
  /** 每位玩家選用的守衛;null 是預設的小綿羊。 */
  selected: Record<GuardPlayer, string | null>;
}

export type AddResult = { ok: true; guard: Guard } | { ok: false; reason: 'full' | 'storage' };

/** 名字最多 8 個字(用字元算,emoji 不會被切一半)。 */
function cutName(name: string): string {
  return Array.from(name).slice(0, MAX_NAME).join('');
}

function empty(): GuardData {
  return { version: 1, guards: [], selected: { A: null, B: null } };
}

function validPng(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith(PNG_PREFIX) && v.length <= MAX_PNG_CHARS;
}

export function sanitizeGuards(raw: unknown): GuardData {
  const out = empty();
  if (typeof raw !== 'object' || raw === null) return out;
  const r = raw as { version?: unknown; guards?: unknown; selected?: unknown };
  if (r.version !== 1 || !Array.isArray(r.guards)) return out;
  for (const g of r.guards) {
    if (typeof g !== 'object' || g === null) continue;
    const { id, name, png, createdAt } = g as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || !validPng(png) || typeof createdAt !== 'number') continue;
    if (out.guards.length < MAX_GUARDS) out.guards.push({ id, name: cutName(name), png, createdAt });
  }
  const sel = (typeof r.selected === 'object' && r.selected !== null ? r.selected : {}) as Record<string, unknown>;
  for (const p of ['A', 'B'] as const) {
    const id = sel[p];
    out.selected[p] = typeof id === 'string' && out.guards.some((g) => g.id === id) ? id : null;
  }
  return out;
}

/** 下載用的檔名:去掉檔名不能用的字元。 */
export function guardFileName(name: string): string {
  const safe = cutName(name.replace(/[\\/:*?"<>|\s]+/g, '')) || tr('守衛', 'guard');
  return tr(`晚安王國-${safe}.png`, `goodnight-kingdom-${safe}.png`);
}

export interface GuardStore {
  get(): GuardData;
  add(name: string, png: string): AddResult;
  remove(id: string): void;
  select(player: GuardPlayer, id: string | null): void;
  /** 清除所有守衛(設定畫面的清除存檔)。 */
  clear(): void;
}

/** 守衛存在玩家自己的裝置上;讀壞的資料丟掉,寫不進去時回報。 */
export function createGuardStore(storage: StorageLike | null, now: () => number = Date.now): GuardStore {
  let current = empty();
  try {
    const text = storage?.getItem(GUARDS_KEY);
    if (text) current = sanitizeGuards(JSON.parse(text));
  } catch {
    current = empty();
  }
  // 寫不進去(無痕模式、容量滿)時不改記憶體裡的資料,畫面和存檔保持一致。
  const write = (next: GuardData): boolean => {
    if (!storage) return false;
    try {
      storage.setItem(GUARDS_KEY, JSON.stringify(next));
      current = next;
      return true;
    } catch {
      return false;
    }
  };
  return {
    get: () => current,
    add(name, png) {
      if (current.guards.length >= MAX_GUARDS) return { ok: false, reason: 'full' };
      const guard: Guard = { id: `g${now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, name: cutName(name.trim()) || tr('守衛', 'Guard'), png, createdAt: now() };
      return write({ ...current, guards: [...current.guards, guard] }) ? { ok: true, guard } : { ok: false, reason: 'storage' };
    },
    remove(id) {
      const selected = { A: current.selected.A === id ? null : current.selected.A, B: current.selected.B === id ? null : current.selected.B };
      write({ ...current, guards: current.guards.filter((g) => g.id !== id), selected });
    },
    select(player, id) {
      // 選擇就算存不進去,這次遊玩也照選的用。
      const next = { ...current, selected: { ...current.selected, [player]: id } };
      if (!write(next)) current = next;
    },
    clear() {
      if (!write(empty())) current = empty();
    },
  };
}
