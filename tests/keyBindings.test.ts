import { describe, test, expect } from 'vitest';
import { EMPTY_INTENT, mergeIntents } from '../src/input/intent';
import { GAME_CODES, PLAYER_A_KEYS, PLAYER_B_KEYS, intentFromKeys } from '../src/input/keyBindings';

describe('intentFromKeys', () => {
  test('玩家 A 按 D 與 F → right 與 shoot', () => {
    expect(intentFromKeys(new Set(['KeyD', 'KeyF']), PLAYER_A_KEYS)).toEqual({ ...EMPTY_INTENT, right: true, shoot: true });
  });

  test('玩家 B 按 Period → jump', () => {
    expect(intentFromKeys(new Set(['Period']), PLAYER_B_KEYS)).toEqual({ ...EMPTY_INTENT, jump: true });
  });

  test('左右同按 → 都不算', () => {
    const i = intentFromKeys(new Set(['KeyA', 'KeyD']), PLAYER_A_KEYS);
    expect(i.left).toBe(false);
    expect(i.right).toBe(false);
  });

  test('上下同按 → 都不算', () => {
    const i = intentFromKeys(new Set(['ArrowUp', 'ArrowDown']), PLAYER_B_KEYS);
    expect(i.up).toBe(false);
    expect(i.down).toBe(false);
  });

  test('玩家 A 的鍵不影響玩家 B', () => {
    expect(intentFromKeys(new Set(['KeyD']), PLAYER_B_KEYS)).toEqual(EMPTY_INTENT);
  });
});

test('mergeIntents 逐欄 OR', () => {
  const m = mergeIntents({ ...EMPTY_INTENT, right: true }, { ...EMPTY_INTENT, shoot: true });
  expect(m).toEqual({ ...EMPTY_INTENT, right: true, shoot: true });
});

test('GAME_CODES 共 12 個且不含 Space', () => {
  expect(GAME_CODES.size).toBe(12);
  expect(GAME_CODES.has('Space')).toBe(false);
});
