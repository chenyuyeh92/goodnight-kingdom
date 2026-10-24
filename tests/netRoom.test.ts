import { test, expect } from 'vitest';
import { cleanCode, isSignalMsg, makeRoomCode, packIntent, unpackIntent } from '../src/net/room';
import { EMPTY_INTENT } from '../src/input/intent';

test('房間號碼是 4 位數字,可以是 0 開頭', () => {
  expect(makeRoomCode(() => 0)).toBe('0000');
  expect(makeRoomCode(() => 0.99999)).toBe('9999');
  expect(makeRoomCode(() => 0.0421)).toBe('0421');
  for (let i = 0; i < 50; i++) expect(makeRoomCode()).toMatch(/^\d{4}$/);
});

test('輸入的號碼:去掉空白、全形數字轉半形,不是 4 位數字就不算', () => {
  expect(cleanCode(' 12 34 ')).toBe('1234');
  expect(cleanCode('０４２１')).toBe('0421');
  expect(cleanCode('123')).toBeNull();
  expect(cleanCode('12345')).toBeNull();
  expect(cleanCode('12a4')).toBeNull();
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
