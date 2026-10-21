import { test, expect } from 'vitest';
import { enemyPose, playerPose, IDLE } from '../src/art/motion';

const range = (f: (t: number) => number) => {
  const v = Array.from({ length: 100 }, (_, i) => f(i * 10));
  return { min: Math.min(...v), max: Math.max(...v) };
};

test('走路時上下彈跳、左右搖擺', () => {
  const dy = range((t) => enemyPose('alarmBug', 'walk', t, -80, 0, true).dy);
  const angle = range((t) => enemyPose('alarmBug', 'walk', t, -80, 0, true).angle);
  expect(dy.min).toBeLessThan(-2);
  expect(dy.max).toBeLessThanOrEqual(0);
  expect(angle.max - angle.min).toBeGreaterThan(6);
});

test('蝙蝠拍翅:高度一直伸縮', () => {
  const sy = range((t) => enemyPose('nightBat', 'hover', t, 0, 0, false).scaleY);
  expect(sy.max - sy.min).toBeGreaterThan(0.15);
});

test('咖啡豆往上跳時拉長、站著時不變形', () => {
  const up = enemyPose('coffeeBean', 'hop', 0, 0, -400, false);
  expect(up.scaleY).toBeGreaterThan(1.05);
  expect(up.scaleX).toBeLessThan(1);
});

test('刺蝟滾動時旋轉', () => {
  const a = enemyPose('hedgehog', 'roll', 0, -260, 0, true);
  const b = enemyPose('hedgehog', 'roll', 100, -260, 0, true);
  expect(a.spin).toBe(true);
  expect(a.angle).not.toBe(b.angle);
});

test('玩家站著不動只有輕微呼吸,走路才彈跳', () => {
  const idle = range((t) => playerPose(t, 0, true, 0, false).dy);
  expect(idle.min).toBe(0);
  const walk = range((t) => playerPose(t, 230, true, 0, false).dy);
  expect(walk.min).toBeLessThan(-2);
  expect(IDLE.angle).toBe(0);
});
