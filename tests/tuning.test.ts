import { test, expect } from 'vitest';
import {
  DEFAULT_TUNING,
  TUNING_STORAGE_KEY,
  createTuningStore,
  sanitizeTuning,
  type StorageLike,
} from '../src/config/tuning';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

test('sanitizeTuning(undefined) 等於預設值', () => {
  expect(sanitizeTuning(undefined)).toEqual(DEFAULT_TUNING);
});

test('壞值用預設、超出範圍夾住', () => {
  const t = sanitizeTuning({ walkSpeed: 'abc', gravity: -5, jumpVelocity: 99999, bulletSpeed: NaN });
  expect(t.walkSpeed).toBe(DEFAULT_TUNING.walkSpeed);
  expect(t.gravity).toBe(500);
  expect(t.jumpVelocity).toBe(1000);
  expect(t.bulletSpeed).toBe(DEFAULT_TUNING.bulletSpeed);
});

test('多餘欄位被忽略', () => {
  const t = sanitizeTuning({ walkSpeed: 200, hacked: 1 });
  expect(Object.keys(t).sort()).toEqual(Object.keys(DEFAULT_TUNING).sort());
});

test('store.set 後 get 取得新值並寫入儲存', () => {
  const storage = memoryStorage();
  const store = createTuningStore(storage);
  store.set('walkSpeed', 250);
  expect(store.get().walkSpeed).toBe(250);
  expect(JSON.parse(storage.getItem(TUNING_STORAGE_KEY)!).walkSpeed).toBe(250);
});

test('store.set 超出範圍會夾住', () => {
  const store = createTuningStore(null);
  store.set('walkSpeed', 9999);
  expect(store.get().walkSpeed).toBe(400);
});

test('重新建立 store 會讀回儲存的值', () => {
  const storage = memoryStorage();
  createTuningStore(storage).set('gravity', 2000);
  expect(createTuningStore(storage).get().gravity).toBe(2000);
});

test('儲存丟例外時仍可運作', () => {
  const broken: StorageLike = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('SecurityError');
    },
  };
  const store = createTuningStore(broken);
  store.set('walkSpeed', 250);
  expect(store.get().walkSpeed).toBe(250);
});

test('儲存內容是壞 JSON 時用預設值', () => {
  const storage = memoryStorage();
  storage.setItem(TUNING_STORAGE_KEY, '{oops');
  expect(createTuningStore(storage).get()).toEqual(DEFAULT_TUNING);
});

test('reset 回到預設值', () => {
  const store = createTuningStore(memoryStorage());
  store.set('walkSpeed', 250);
  store.reset();
  expect(store.get()).toEqual(DEFAULT_TUNING);
});

test('storage 為 null 時可運作', () => {
  const store = createTuningStore(null);
  store.set('coyoteMs', 200);
  expect(store.get().coyoteMs).toBe(200);
});

test('toJSON 可被 sanitizeTuning 讀回', () => {
  const store = createTuningStore(null);
  store.set('walkSpeed', 210);
  expect(sanitizeTuning(JSON.parse(store.toJSON())).walkSpeed).toBe(210);
});
