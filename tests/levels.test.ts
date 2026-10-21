import { test, expect } from 'vitest';
import { parseLevelId } from '../src/levels/levelDef';
import { LEVELS } from '../src/levels';

test('parseLevelId', () => {
  expect(parseLevelId('range')).toBe('range');
  expect(parseLevelId(null)).toBe('forest');
  expect(parseLevelId('x')).toBe('forest');
});

test('靶場資料與搬移前一致', () => {
  const r = LEVELS.range;
  expect(r.checkpoints).toEqual([150, 1200, 2000]);
  expect(r.chests).toHaveLength(3);
  expect(r.chests[0].x).toBe(960);
  expect(r.arenas).toHaveLength(2);
  expect(r.worldW).toBe(3200);
  expect(r.targets).toHaveLength(6);
  expect(r.boss).toBeNull();
});
