import type { StorageLike } from '../config/tuning';
import { MAX_STARS, SPECIAL_WEAPONS, type SpecialWeaponId } from './weapons';
import { isLevelId, type LevelId } from '../levels/levelDef';

export const SAVE_KEY = 'gk.save.v1';

export interface SaveData {
  version: 1;
  /** 背包:擁有的特殊武器與星等。 */
  weapons: Partial<Record<SpecialWeaponId, number>>;
  /** 通關過的關卡與最佳時間(ms);舊存檔沒有這一欄,讀進來是空的。 */
  cleared: Partial<Record<LevelId, number>>;
}

function emptySave(): SaveData {
  return { version: 1, weapons: {}, cleared: {} };
}

/** 版本不符或格式錯就丟掉;未知武器與不合法的星等個別丟掉。 */
export function sanitizeSave(raw: unknown): SaveData {
  const save = emptySave();
  if (typeof raw !== 'object' || raw === null) return save;
  const r = raw as { version?: unknown; weapons?: unknown; cleared?: unknown };
  if (r.version !== 1 || typeof r.weapons !== 'object' || r.weapons === null) return save;
  const weapons = r.weapons as Record<string, unknown>;
  for (const id of SPECIAL_WEAPONS) {
    const stars = weapons[id];
    if (typeof stars === 'number' && Number.isInteger(stars) && stars >= 1 && stars <= MAX_STARS) save.weapons[id] = stars;
  }
  if (typeof r.cleared === 'object' && r.cleared !== null) {
    for (const [id, ms] of Object.entries(r.cleared as Record<string, unknown>)) {
      if (isLevelId(id) && typeof ms === 'number' && Number.isFinite(ms) && ms > 0) save.cleared[id] = ms;
    }
  }
  return save;
}

export interface SaveStore {
  get(): SaveData;
  setStars(id: SpecialWeaponId, stars: number): void;
  /** 記下通關,保留最佳時間。 */
  markCleared(id: LevelId, ms: number): void;
  clear(): void;
  /** 是否真的存得進去;false 時進度重新整理後會不見。 */
  ok(): boolean;
}

/** 讀寫失敗(無痕模式、被封鎖)時照常運作,只是不保存。 */
export function createSaveStore(storage: StorageLike | null): SaveStore {
  let current = emptySave();
  let ok = storage !== null;
  try {
    const text = storage?.getItem(SAVE_KEY);
    if (text) current = sanitizeSave(JSON.parse(text));
  } catch (e) {
    current = emptySave();
    // 內容壞掉不影響之後寫入;讀取本身被封鎖才算存不了。
    if (!(e instanceof SyntaxError)) ok = false;
  }

  const write = (): void => {
    try {
      storage?.setItem(SAVE_KEY, JSON.stringify(current));
    } catch {
      ok = false;
    }
  };

  // 一開始就試寫一次,才能在玩之前就告訴玩家這個瀏覽器存不了檔。
  if (storage) write();

  return {
    get: () => current,
    setStars(id, stars) {
      current = { ...current, weapons: { ...current.weapons, [id]: Math.min(Math.max(stars, 1), MAX_STARS) } };
      write();
    },
    markCleared(id, ms) {
      const best = current.cleared[id];
      current = { ...current, cleared: { ...current.cleared, [id]: best === undefined ? ms : Math.min(best, ms) } };
      write();
    },
    clear() {
      current = emptySave();
      write();
    },
    ok: () => ok,
  };
}
