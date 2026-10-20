import { test, expect } from 'vitest';
import { PLAYER_A_KEYS, PLAYER_B_KEYS } from '../src/input/keyBindings';
import { KEY_COMBOS, keyLabel, markSeen } from '../src/input/keyCombos';

test('每組玩家都有「右+射擊+跳躍」組合', () => {
  const names = KEY_COMBOS.map((c) => c.name);
  expect(names).toContain('玩家 A:右 + 射擊 + 跳躍');
  expect(names).toContain('玩家 B:右 + 射擊 + 跳躍');
});

test('組合用的是正確的按鍵', () => {
  const a = KEY_COMBOS.find((c) => c.name === '玩家 A:右 + 射擊 + 跳躍')!;
  expect([...a.codes].sort()).toEqual([PLAYER_A_KEYS.right, PLAYER_A_KEYS.shoot, PLAYER_A_KEYS.jump].sort());
});

test('有兩人同時按的組合,共 6 個鍵', () => {
  const both = KEY_COMBOS.find((c) => c.name.startsWith('兩人同時'))!;
  expect(both.codes).toHaveLength(6);
  expect(both.codes).toContain(PLAYER_B_KEYS.jump);
});

test('組合裡的鍵全部按住才算成功', () => {
  const combo = KEY_COMBOS.find((c) => c.name === '玩家 A:右 + 射擊 + 跳躍')!;
  const seen = new Set<string>();
  markSeen(seen, new Set(['KeyD', 'KeyF']));
  expect(seen.has(combo.name)).toBe(false);
  markSeen(seen, new Set(['KeyD', 'KeyF', 'KeyG']));
  expect(seen.has(combo.name)).toBe(true);
});

test('成功過的組合放開後仍保持成功', () => {
  const seen = new Set<string>();
  markSeen(seen, new Set(['KeyD', 'KeyF', 'KeyG']));
  markSeen(seen, new Set());
  expect(seen.has('玩家 A:右 + 射擊 + 跳躍')).toBe(true);
});

test('按鍵顯示名稱', () => {
  expect(keyLabel('KeyD')).toBe('D');
  expect(keyLabel('ArrowRight')).toBe('→');
  expect(keyLabel('Comma')).toBe(',');
  expect(keyLabel('Period')).toBe('.');
  expect(keyLabel('ShiftLeft')).toBe('ShiftLeft');
});

test('組合名稱不重複', () => {
  const names = KEY_COMBOS.map((c) => c.name);
  expect(new Set(names).size).toBe(names.length);
});

test('每組候選按鍵都有 4 個組合,含兩人同時', () => {
  for (const label of ['J K', 'V B', 'C V', 'H J']) {
    const group = KEY_COMBOS.filter((c) => c.group === `候選:射擊與跳躍改用 ${label}`);
    expect(group).toHaveLength(4);
    expect(group.some((c) => c.codes.length === 6)).toBe(true);
  }
});

test('候選 J K 的「右 + 射擊 + 跳躍」用 D J K', () => {
  const c = KEY_COMBOS.find((x) => x.group === '候選:射擊與跳躍改用 J K' && x.codes.length === 3 && x.codes.includes('KeyD'))!;
  expect([...c.codes].sort()).toEqual(['KeyD', 'KeyJ', 'KeyK']);
});
