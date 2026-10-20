import { test, expect } from 'vitest';
import { freshHealth, type Health } from '../src/game/health';
import { decideTeam, reachedCheckpoint } from '../src/game/team';

function down(ms: number): Health {
  return { hearts: 0, invulnMs: 0, down: true, downMs: ms };
}

test('都醒著 → none', () => {
  expect(decideTeam([freshHealth(), freshHealth()])).toEqual({ kind: 'none' });
});

test('一人睡著未滿 3000ms → none', () => {
  expect(decideTeam([down(2999), freshHealth()])).toEqual({ kind: 'none' });
});

test('一人睡著滿 3000ms 且隊友醒著 → revive 該人', () => {
  expect(decideTeam([freshHealth(), down(3000)])).toEqual({ kind: 'revive', index: 1 });
});

test('單人睡著未滿 800ms → none,滿 800ms → restart', () => {
  expect(decideTeam([down(799)])).toEqual({ kind: 'none' });
  expect(decideTeam([down(800)])).toEqual({ kind: 'restart' });
});

test('兩人都睡著,後睡的未滿 800ms → none', () => {
  expect(decideTeam([down(5000), down(799)])).toEqual({ kind: 'none' });
});

test('兩人都睡著且都滿 800ms → restart', () => {
  expect(decideTeam([down(900), down(800)])).toEqual({ kind: 'restart' });
});

test('reachedCheckpoint 取到達過的最後一個', () => {
  const cps = [150, 1200, 2000];
  expect(reachedCheckpoint(cps, 1500)).toBe(1200);
  expect(reachedCheckpoint(cps, 100)).toBe(150);
  expect(reachedCheckpoint(cps, 2000)).toBe(2000);
});
