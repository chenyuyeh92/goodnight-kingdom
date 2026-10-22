import { test, expect } from 'vitest';
import { WORLD1, WORLD2, WORLD3, isUnlocked, levelNumber, nextLevel, worldOf } from '../src/game/progress';
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

test('下一關:1-3 通關後接 2-1、2-3 接 3-1,最後一關沒有下一關', () => {
  expect(nextLevel('w1-1')).toBe('w1-2');
  expect(nextLevel('forest')).toBe('w2-1');
  expect(nextLevel('w2-3')).toBe('w3-1');
  expect(nextLevel('w3-3')).toBe('w4-1');
  expect(nextLevel('w4-3')).toBe('w5-1');
  expect(nextLevel('w5-3')).toBe('w6-1');
  expect(nextLevel('w6-3')).toBe('w7-1');
  expect(nextLevel('w7-3')).toBe('w8-1');
  expect(nextLevel('w8-3')).toBe('w9-1');
  expect(nextLevel('w9-3')).toBe('w10-1');
  expect(nextLevel('w10-3')).toBeNull();
  expect(nextLevel('range')).toBeNull();
});

test('世界 2 是 2-1 綠洲、2-2 沙丘、2-3 金字塔,先通過 1-3 才開放', () => {
  expect(WORLD2.map(levelNumber)).toEqual(['2-1', '2-2', '2-3']);
  expect(WORLD2.map(worldOf)).toEqual([2, 2, 2]);
  expect(worldOf('range')).toBeNull();
  expect(isUnlocked('w2-1', { 'w1-1': 1, 'w1-2': 1 })).toBe(false);
  expect(isUnlocked('w2-1', { forest: 1 })).toBe(true);
  expect(isUnlocked('w2-2', { forest: 1 })).toBe(false);
  expect(isUnlocked('w2-3', { 'w2-2': 1 })).toBe(true);
  expect(isUnlocked('range', {})).toBe(true);
});

test('世界 3 是 3-1 珊瑚礁、3-2 沉船、3-3 遺跡,先通過 2-3 才開放', () => {
  expect(WORLD3.map(levelNumber)).toEqual(['3-1', '3-2', '3-3']);
  expect(isUnlocked('w3-1', { 'w2-2': 1 })).toBe(false);
  expect(isUnlocked('w3-1', { 'w2-3': 1 })).toBe(true);
});

test('舊存檔裡世界 2 的通關紀錄也讀得進來', () => {
  expect(sanitizeSave({ version: 1, weapons: {}, cleared: { 'w2-1': 240000 } }).cleared).toEqual({ 'w2-1': 240000 });
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
