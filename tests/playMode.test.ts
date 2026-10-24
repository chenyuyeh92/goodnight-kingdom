import { test, expect } from 'vitest';
import { controlHint, intentsForMode, parsePlayMode } from '../src/input/playMode';

test('single 合併兩組按鍵', () => {
  const r = intentsForMode(new Set(['KeyD', 'Comma']), 'single');
  expect(r).toHaveLength(1);
  expect(r[0].right).toBe(true);
  expect(r[0].shoot).toBe(true);
});

test('duo 分開兩組', () => {
  const r = intentsForMode(new Set(['KeyD', 'Comma']), 'duo');
  expect(r).toHaveLength(2);
  expect(r[0].right).toBe(true);
  expect(r[0].shoot).toBe(false);
  expect(r[1].shoot).toBe(true);
  expect(r[1].right).toBe(false);
});

test('parsePlayMode', () => {
  expect(parsePlayMode('duo')).toBe('duo');
  expect(parsePlayMode('single')).toBe('single');
  expect(parsePlayMode('x')).toBeNull();
  expect(parsePlayMode(null)).toBeNull();
});

test('單人提示說兩組按鍵都可以用', () => {
  expect(controlHint('single')).toBe('A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍(方向鍵 , . 也可以)');
});

test('雙人提示分開列出兩位玩家的按鍵', () => {
  const hint = controlHint('duo');
  expect(hint).toContain('A:A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍');
  expect(hint).toContain('B:← → 移動  ↑ 上  ↓ 蹲/下  , 射擊  . 跳躍');
  expect(hint).not.toContain('也可以');
});

test('觸控 Intent 合併給玩家 A(單人)', () => {
  const touch = { left: false, right: true, up: false, down: false, jump: false, shoot: true };
  const r = intentsForMode(new Set(), 'single', touch);
  expect(r[0].right).toBe(true);
  expect(r[0].shoot).toBe(true);
});

test('觸控 Intent 合併給玩家 A(雙人),玩家 B 不受影響', () => {
  const touch = { left: false, right: true, up: false, down: false, jump: true, shoot: false };
  const r = intentsForMode(new Set(['Comma']), 'duo', touch);
  expect(r[0].right).toBe(true);
  expect(r[0].jump).toBe(true);
  expect(r[1].right).toBe(false);
  expect(r[1].jump).toBe(false);
  expect(r[1].shoot).toBe(true);
});

test('觸控版操作提示', () => {
  expect(controlHint('single', true)).toBe('左邊拖曳:移動/往上瞄準/蹲下   右邊:射擊、跳躍');
});

test('線上雙人(房主這台):兩組按鍵和觸控都給玩家 A,玩家 B 用網路收到的操作;斷線時 B 不動', () => {
  const remote = { left: false, right: true, up: false, down: false, jump: true, shoot: false };
  const [a, b] = intentsForMode(new Set(['KeyD', 'Comma']), 'duo', undefined, remote);
  expect(a.right).toBe(true);
  expect(a.shoot).toBe(true);
  expect(b).toEqual(remote);
  const [, lost] = intentsForMode(new Set(['ArrowLeft']), 'duo', undefined, null);
  expect(Object.values(lost).some(Boolean)).toBe(false);
});
