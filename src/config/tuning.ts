export interface Tuning {
  walkSpeed: number;
  crawlSpeed: number;
  airSpeed: number;
  jumpVelocity: number;
  gravity: number;
  coyoteMs: number;
  jumpBufferMs: number;
  fireIntervalMs: number;
  bulletSpeed: number;
  hitStopMs: number;
  shakeMs: number;
  shakeIntensity: number;
}

export const DEFAULT_TUNING: Readonly<Tuning> = Object.freeze({
  walkSpeed: 180,
  crawlSpeed: 60,
  airSpeed: 150,
  jumpVelocity: 560,
  gravity: 1500,
  coyoteMs: 100,
  jumpBufferMs: 120,
  fireIntervalMs: 160,
  bulletSpeed: 620,
  hitStopMs: 60,
  shakeMs: 80,
  shakeIntensity: 0.004,
});

/** 每格時間差上限,避免卡頓或切回分頁時穿牆、一次跳過計時。 */
export const MAX_DT_MS = 50;

export const TUNING_LIMITS: Readonly<Record<keyof Tuning, { min: number; max: number; step: number; label: string }>> = {
  walkSpeed: { min: 60, max: 400, step: 10, label: '走路速度' },
  crawlSpeed: { min: 0, max: 200, step: 10, label: '爬行速度' },
  airSpeed: { min: 0, max: 400, step: 10, label: '空中移動速度' },
  jumpVelocity: { min: 200, max: 1000, step: 10, label: '跳躍力道' },
  gravity: { min: 500, max: 4000, step: 50, label: '重力' },
  coyoteMs: { min: 0, max: 300, step: 10, label: '離台寬容(毫秒)' },
  jumpBufferMs: { min: 0, max: 300, step: 10, label: '提早按跳寬容(毫秒)' },
  fireIntervalMs: { min: 50, max: 1000, step: 10, label: '射擊間隔(毫秒)' },
  bulletSpeed: { min: 100, max: 1500, step: 20, label: '子彈速度' },
  hitStopMs: { min: 0, max: 200, step: 10, label: '擊倒停頓(毫秒)' },
  shakeMs: { min: 0, max: 300, step: 10, label: '畫面晃動時間(毫秒)' },
  shakeIntensity: { min: 0, max: 0.02, step: 0.001, label: '畫面晃動強度' },
};

export const TUNING_STORAGE_KEY = 'gk.tuning.v1';

const TUNING_KEYS = Object.keys(DEFAULT_TUNING) as (keyof Tuning)[];

function clampValue(key: keyof Tuning, value: number): number {
  const { min, max } = TUNING_LIMITS[key];
  return Math.min(max, Math.max(min, value));
}

/** 把任意輸入整理成合法的 Tuning:壞值用預設,超出範圍夾住,多餘欄位忽略。 */
export function sanitizeTuning(raw: unknown): Tuning {
  const result = { ...DEFAULT_TUNING };
  if (typeof raw !== 'object' || raw === null) return result;
  const source = raw as Record<string, unknown>;
  for (const key of TUNING_KEYS) {
    const v = source[key];
    if (typeof v === 'number' && Number.isFinite(v)) result[key] = clampValue(key, v);
  }
  return result;
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export interface TuningStore {
  get(): Tuning;
  set(key: keyof Tuning, value: number): void;
  reset(): void;
  toJSON(): string;
}

/** 儲存失敗(無痕模式、封鎖)時照常運作,只是不保存。 */
export function createTuningStore(storage: StorageLike | null): TuningStore {
  let current = load();

  function load(): Tuning {
    try {
      const text = storage?.getItem(TUNING_STORAGE_KEY);
      return text ? sanitizeTuning(JSON.parse(text)) : { ...DEFAULT_TUNING };
    } catch {
      return { ...DEFAULT_TUNING };
    }
  }

  function save(): void {
    try {
      storage?.setItem(TUNING_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // 不保存也能玩
    }
  }

  return {
    get: () => current,
    set(key, value) {
      if (!Number.isFinite(value)) return;
      current = { ...current, [key]: clampValue(key, value) };
      save();
    },
    reset() {
      current = { ...DEFAULT_TUNING };
      save();
    },
    toJSON: () => JSON.stringify(current, null, 2),
  };
}
