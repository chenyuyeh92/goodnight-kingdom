import { test, expect } from 'vitest';
import { WORLD1, isUnlocked, levelNumber, nextLevel } from '../src/game/progress';
import { createSaveStore, sanitizeSave, SAVE_KEY } from '../src/game/save';
import type { StorageLike } from '../src/config/tuning';

test('世界 1 依序是 1-1 草原、1-2 河邊、1-3 森林', () => {
  expect(WORLD1).toEqual(['w1-1', 'w1-2', 'forest']);
  expect(WORLD1.map(levelNumber)).toEqual(['1-1', '1-2', '1-3']);
});

test('只有 1-1 一開始就能玩,通關才解鎖下一關', () => {
  expect(isUnlocked('w1-1', {})).toBe(true);
  expect(isUnlocked('w1-2', {})).toBe(false);
  expect(isUnlocked('w1-2', { 'w1-1': 200000 })).toBe(true);
  expect(isUnlocked('forest', { 'w1-1': 200000 })).toBe(false);
});

test('下一關', () => {
  expect(nextLevel('w1-1')).toBe('w1-2');
  expect(nextLevel('forest')).toBeNull();
  expect(nextLevel('range')).toBeNull();
});

test('舊存檔沒有通關紀錄,讀進來是空的', () => {
  expect(sanitizeSave({ version: 1, weapons: { sheepGun: 1 } }).cleared).toEqual({});
});

test('通關紀錄只留認得的關卡與合理的時間', () => {
  const s = sanitizeSave({ version: 1, weapons: {}, cleared: { 'w1-1': 180000, bad: 5, 'w1-2': -3, forest: 'x' } });
  expect(s.cleared).toEqual({ 'w1-1': 180000 });
});

test('通關紀錄保留最佳時間', () => {
  const data = new Map<string, string>();
  const m: StorageLike = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
  const store = createSaveStore(m);
  store.markCleared('w1-1', 300000);
  store.markCleared('w1-1', 250000);
  store.markCleared('w1-1', 280000);
  expect(createSaveStore(m).get().cleared['w1-1']).toBe(250000);
  expect(JSON.parse(data.get(SAVE_KEY)!).weapons).toEqual({});
});
