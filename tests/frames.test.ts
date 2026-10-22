import { test, expect } from 'vitest';
import { enemyFrame, guardFrame, type FrameInput } from '../src/art/frames';
import { SPRITES } from '../src/art/sprites';

const F = (over: Partial<FrameInput> = {}): FrameInput => ({ phase: 'walk', timerMs: 0, tMs: 0, vx: -70, vy: 0, grounded: true, bossPhase: 1, ...over });

test('鬧鐘蟲走路時四格輪流,停下來用原圖', () => {
  const keys = new Set([0, 120, 240, 360, 480].map((t) => enemyFrame('alarmBug', F({ tMs: t }))));
  expect(keys.size).toBe(4);
  expect(enemyFrame('alarmBug', F({ vx: 0 }))).toBeNull();
});

test('蝙蝠一直拍翅;貓頭鷹依階段拍翅,往下衝時用俯衝格', () => {
  expect(enemyFrame('nightBat', F({ vx: 0 }))).toMatch(/^night-bat-flap-/);
  expect(enemyFrame('nightOwl', F({ bossPhase: 2 }))).toMatch(/^owl-2-flap-/);
  expect(enemyFrame('nightOwl', F({ vy: 400 }))).toBe('owl-dive');
});

test('咖啡豆在空中用跳起格,快起跳時蹲下', () => {
  expect(enemyFrame('coffeeBean', F({ grounded: false }))).toBe('coffee-bean-jump');
  expect(enemyFrame('coffeeBean', F({ timerMs: 800 }))).toBe('coffee-bean-land');
  expect(enemyFrame('coffeeBean', F({ timerMs: 100 }))).toBeNull();
});

test('刺蝟滾的時候不用走路格;其他世界的魔物沒有動畫格', () => {
  expect(enemyFrame('hedgehog', F({ phase: 'roll', vx: -260 }))).toBeNull();
  expect(enemyFrame('hedgehog', F())).toMatch(/^hedgehog-walk-/);
  expect(enemyFrame('camel', F())).toBeNull();
});

test('小綿羊守衛:走路四格、空中跳躍格、站著用原圖', () => {
  expect(guardFrame(0, 230, true)).toMatch(/^guard-walk-/);
  expect(guardFrame(0, 0, false)).toBe('guard-jump');
  expect(guardFrame(0, 0, true)).toBeNull();
});

test('動畫格和原圖一樣大(腳底在同一條線)', () => {
  for (let i = 1; i <= 4; i++) {
    expect(SPRITES[`clockbug-walk-${i}` as keyof typeof SPRITES].h).toBe(SPRITES.clockbug.h);
    expect(SPRITES[`guard-walk-${i}` as keyof typeof SPRITES].h).toBe(SPRITES.guard.h);
  }
});
