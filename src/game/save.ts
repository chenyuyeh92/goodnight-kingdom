import type { StorageLike } from '../config/tuning';
import { MAX_STARS, SPECIAL_WEAPONS, type SpecialWeaponId } from './weapons';

export const SAVE_KEY = 'gk.save.v1';

export interface SaveData {
  version: 1;
  /** 背包:擁有的特殊武器與星等。 */
  weapons: Partial<Record<SpecialWeaponId, number>>;
}

function emptySave(): SaveData {
  return { version: 1, weapons: {} };
}

/** 版本不符或格式錯就丟掉;未知武器與不合法的星等個別丟掉。 */
export function sanitizeSave(raw: unknown): SaveData {
  const save = emptySave();
  if (typeof raw !== 'object' || raw === null) return save;
  const r = raw as { version?: unknown; weapons?: unknown };
  if (r.version !== 1 || typeof r.weapons !== 'object' || r.weapons === null) return save;
  const weapons = r.weapons as Record<string, unknown>;
  for (const id of SPECIAL_WEAPONS) {
    const stars = weapons[id];
    if (typeof stars === 'number' && Number.isInteger(stars) && stars >= 1 && stars <= MAX_STARS) save.weapons[id] = stars;
  }
  return save;
}

export interface SaveStore {
  get(): SaveData;
  setStars(id: SpecialWeaponId, stars: number): void;
  clear(): void;
}

/** 讀寫失敗(無痕模式、被封鎖)時照常運作,只是不保存。 */
export function createSaveStore(storage: StorageLike | null): SaveStore {
  let current = emptySave();
  try {
    const text = storage?.getItem(SAVE_KEY);
    if (text) current = sanitizeSave(JSON.parse(text));
  } catch {
    current = emptySave();
  }

  const write = (): void => {
    try {
      storage?.setItem(SAVE_KEY, JSON.stringify(current));
    } catch {
      // 不保存也能玩
    }
  };

  return {
    get: () => current,
    setStars(id, stars) {
      current = { ...current, weapons: { ...current.weapons, [id]: Math.min(Math.max(stars, 1), MAX_STARS) } };
      write();
    },
    clear() {
      current = emptySave();
      write();
    },
  };
}
