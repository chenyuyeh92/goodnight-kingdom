import { beforeEach, test, expect } from 'vitest';
import { KeyboardSource } from '../src/input/keyboardSource';

function key(type: string, code: string): Event {
  return Object.assign(new Event(type, { cancelable: true }), { code });
}

let win: EventTarget;
let doc: EventTarget & { visibilityState: string };
let src: KeyboardSource;

beforeEach(() => {
  win = new EventTarget();
  doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  src = new KeyboardSource(win, doc);
});

test('keydown 後 pressed 包含該鍵,keyup 後移除', () => {
  win.dispatchEvent(key('keydown', 'KeyD'));
  expect(src.pressed().has('KeyD')).toBe(true);
  win.dispatchEvent(key('keyup', 'KeyD'));
  expect(src.pressed().has('KeyD')).toBe(false);
});

test('遊戲按鍵會 preventDefault', () => {
  const e = key('keydown', 'ArrowDown');
  win.dispatchEvent(e);
  expect(e.defaultPrevented).toBe(true);
});

test('非遊戲按鍵不攔截', () => {
  const e = key('keydown', 'KeyT');
  win.dispatchEvent(e);
  expect(e.defaultPrevented).toBe(false);
  expect(src.pressed().has('KeyT')).toBe(false);
});

test('視窗失焦時清空', () => {
  win.dispatchEvent(key('keydown', 'KeyD'));
  win.dispatchEvent(new Event('blur'));
  expect(src.pressed().size).toBe(0);
});

test('分頁隱藏時清空', () => {
  win.dispatchEvent(key('keydown', 'KeyD'));
  doc.visibilityState = 'hidden';
  doc.dispatchEvent(new Event('visibilitychange'));
  expect(src.pressed().size).toBe(0);
});

test('destroy 後不再接收按鍵', () => {
  src.destroy();
  win.dispatchEvent(key('keydown', 'KeyD'));
  expect(src.pressed().size).toBe(0);
});
