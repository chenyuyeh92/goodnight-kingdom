import { test, expect } from 'vitest';
import { cleanCode, isSignalMsg, makeRoomCode, packIntent, unpackIntent } from '../src/net/room';
import { EMPTY_INTENT } from '../src/input/intent';

test('房間號碼是 6 位數字(一百萬種,陌生人猜不到),可以是 0 開頭', () => {
  expect(makeRoomCode(() => 0)).toBe('000000');
  expect(makeRoomCode(() => 0.9999999)).toBe('999999');
  expect(makeRoomCode(() => 0.0421)).toBe('042100');
  for (let i = 0; i < 50; i++) expect(makeRoomCode()).toMatch(/^\d{6}$/);
});

test('輸入的號碼:去掉空白、全形數字轉半形,不是 6 位數字就不算', () => {
  expect(cleanCode(' 123 456 ')).toBe('123456');
  expect(cleanCode('０４２１００')).toBe('042100');
  expect(cleanCode('1234')).toBeNull();
  expect(cleanCode('1234567')).toBeNull();
  expect(cleanCode('12a456')).toBeNull();
});

test('操作打包成一個數字再拆回來,每個按鍵都對得上', () => {
  expect(packIntent(EMPTY_INTENT)).toBe(0);
  const keys = ['left', 'right', 'up', 'down', 'jump', 'shoot'] as const;
  for (const k of keys) {
    const i = { ...EMPTY_INTENT, [k]: true };
    expect(unpackIntent(packIntent(i))).toEqual(i);
  }
  const all = { left: true, right: true, up: true, down: true, jump: true, shoot: true };
  expect(unpackIntent(packIntent(all))).toEqual(all);
});

test('收到的訊號訊息要檢查格式,壞掉或不認得的丟掉', () => {
  expect(isSignalMsg({ t: 'hello', from: 'abc' })).toBe(true);
  expect(isSignalMsg({ t: 'offer', from: 'h', to: 'g', sdp: 'v=0' })).toBe(true);
  expect(isSignalMsg({ t: 'answer', from: 'g', to: 'h', sdp: 'v=0' })).toBe(true);
  expect(isSignalMsg({ t: 'ice', from: 'g', to: 'h', c: { candidate: 'x' } })).toBe(true);
  expect(isSignalMsg({ t: 'ice', from: 'g', to: 'h', c: null })).toBe(true);
  expect(isSignalMsg({ t: 'probe', from: 'h' })).toBe(true);
  expect(isSignalMsg({ t: 'taken', to: 'h' })).toBe(true);
  expect(isSignalMsg({ t: 'full', to: 'g' })).toBe(true);
  expect(isSignalMsg({ t: 'offer', from: 'h', to: 'g' })).toBe(false);
  expect(isSignalMsg({ t: 'hello' })).toBe(false);
  expect(isSignalMsg({ t: 'nope', from: 'x' })).toBe(false);
  expect(isSignalMsg(null)).toBe(false);
  expect(isSignalMsg('hello')).toBe(false);
});

test('記住上次加入的房號:3 小時內再加入房間會自動填好,太久就不填', async () => {
  const { rememberRoom, recallRoom } = await import('../src/net/room');
  const mem = new Map<string, string>();
  const s = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
  expect(recallRoom(s, 0)).toBeNull();
  rememberRoom(s, '042100', 1000);
  expect(recallRoom(s, 1000 + 60_000)).toBe('042100');
  expect(recallRoom(s, 1000 + 3 * 3600_000 + 1)).toBeNull();
  // 壞掉的資料、沒有存檔空間都不會出錯。
  mem.set('gk.lastRoom.v1', 'oops');
  expect(recallRoom(s, 0)).toBeNull();
  expect(recallRoom(null, 0)).toBeNull();
  expect(() => rememberRoom(null, '123456', 0)).not.toThrow();
});
