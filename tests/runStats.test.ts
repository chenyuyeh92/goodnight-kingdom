import { test, expect } from 'vitest';
import { addWeapon, formatDuration, summaryLines, type RunStats } from '../src/game/runStats';

test('formatDuration', () => {
  expect(formatDuration(65_000)).toBe('1 分 05 秒');
  expect(formatDuration(9_000)).toBe('0 分 09 秒');
  expect(formatDuration(9_999)).toBe('0 分 09 秒');
});

const base: RunStats = { startedAt: 1000, defeated: 23, chestsFound: 2, chestsTotal: 3, weaponsGot: [], restarts: 1 };

test('summaryLines:有拿到武器', () => {
  expect(summaryLines({ ...base, weaponsGot: ['sheepGun', 'lullabyHarp'] }, 66_000)).toEqual([
    '通關時間 1 分 05 秒',
    '哄睡魔物 23 隻',
    '找到寶箱 2 / 3',
    '這次拿到:數羊機槍、搖籃曲豎琴',
    '睡著重來 1 次',
  ]);
});

test('summaryLines:沒拿到武器', () => {
  expect(summaryLines(base, 66_000)[3]).toBe('這次拿到:沒有');
});

test('addWeapon 不重複', () => {
  expect(addWeapon(['sheepGun'], 'sheepGun')).toEqual(['sheepGun']);
  expect(addWeapon(['sheepGun'], 'moonLamp')).toEqual(['sheepGun', 'moonLamp']);
});

test('summaryLines:連續哄睡 2 隻以上才多一行「最多連續哄睡」,放在哄睡魔物下面', () => {
  const lines = summaryLines({ ...base, bestCombo: 4 }, 66_000);
  expect(lines[2]).toBe('最多連續哄睡 4 隻');
  expect(summaryLines({ ...base, bestCombo: 1 }, 66_000).some((l) => l.includes('連續'))).toBe(false);
  expect(summaryLines(base, 66_000).some((l) => l.includes('連續'))).toBe(false);
});
