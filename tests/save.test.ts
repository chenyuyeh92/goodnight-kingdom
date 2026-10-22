import { test, expect } from 'vitest';
import { SAVE_KEY, createSaveStore, sanitizeSave } from '../src/game/save';
import type { StorageLike } from '../src/config/tuning';

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

test('sanitizeSave(undefined) → 空背包', () => {
  expect(sanitizeSave(undefined)).toEqual({ version: 1, weapons: {}, cleared: {} });
});

test('未知武器、星等 0 或 9、字串星等都被丟掉,合法的保留', () => {
  const s = sanitizeSave({ version: 1, weapons: { sheepGun: 2, laser: 1, milkSpray: 0, moonLamp: 9, pillowCannon: '2', lullabyHarp: 3 } });
  expect(s.weapons).toEqual({ sheepGun: 2, lullabyHarp: 3 });
});

test('版本不是 1 → 空背包', () => {
  expect(sanitizeSave({ version: 2, weapons: { sheepGun: 1 } }).weapons).toEqual({});
});

test('setStars 後寫入儲存,重建 store 讀回', () => {
  const m = memory();
  createSaveStore(m).setStars('sheepGun', 2);
  expect(JSON.parse(m.getItem(SAVE_KEY)!).weapons.sheepGun).toBe(2);
  expect(createSaveStore(m).get().weapons.sheepGun).toBe(2);
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
  const store = createSaveStore(broken);
  store.setStars('milkSpray', 1);
  expect(store.get().weapons.milkSpray).toBe(1);
});

test('壞 JSON → 空背包,之後 setStars 正常', () => {
  const m = memory();
  m.setItem(SAVE_KEY, '{bad');
  const store = createSaveStore(m);
  expect(store.get().weapons).toEqual({});
  store.setStars('moonLamp', 1);
  expect(createSaveStore(m).get().weapons.moonLamp).toBe(1);
});

test('storage 為 null 時可運作', () => {
  const store = createSaveStore(null);
  store.setStars('sheepGun', 1);
  expect(store.get().weapons.sheepGun).toBe(1);
});

test('clear 清空背包並寫入', () => {
  const m = memory();
  const store = createSaveStore(m);
  store.setStars('sheepGun', 2);
  store.clear();
  expect(store.get().weapons).toEqual({});
  expect(createSaveStore(m).get().weapons).toEqual({});
});

test('ok:可以正常存檔時為 true,讀寫失敗或沒有儲存空間時為 false', () => {
  expect(createSaveStore(memory()).ok()).toBe(true);
  expect(createSaveStore(null).ok()).toBe(false);
  const readOnly: StorageLike = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceeded');
    },
  };
  const store = createSaveStore(readOnly);
  store.setStars('sheepGun', 1);
  expect(store.ok()).toBe(false);
});
