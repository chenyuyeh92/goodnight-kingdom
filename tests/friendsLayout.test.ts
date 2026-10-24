import { test, expect } from 'vitest';
import { friendSpots, backRowFirst } from '../src/story/friendsLayout';

test('結局第 8 幕:魔王排兩排,左右交錯', () => {
  const spots = friendSpots(11, 960, 400);
  expect(spots).toHaveLength(11);
  expect(spots[1]).toEqual({ x: 630, y: 400 });
  expect(spots[3]).toEqual({ x: 686, y: 370 });
});

test('結局第 8 幕:後排(y 小)先畫,前排才不會被後排蓋住;同一排維持原本順序', () => {
  const spots = friendSpots(11, 960, 400);
  const order = backRowFirst(spots);
  expect([...order].sort((a, b) => a - b)).toEqual(spots.map((_, i) => i));
  const back = order.filter((i) => spots[i].y < 400);
  const front = order.filter((i) => spots[i].y === 400);
  expect(order).toEqual([...back, ...front]);
  expect(back).toEqual([...back].sort((a, b) => a - b));
  expect(front).toEqual([...front].sort((a, b) => a - b));
  // 雪怪(後排)在人面獅身(前排)之前畫。
  expect(order.indexOf(3)).toBeLessThan(order.indexOf(1));
});
