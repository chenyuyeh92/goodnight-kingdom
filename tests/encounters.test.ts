import { test, expect } from 'vitest';
import { initialEncounters, stepEncounters, type ArenaDef, type EncounterState, type TrickleDef } from '../src/game/encounters';

const A: ArenaDef = {
  lockScrollX: 1000,
  waves: [
    [
      { type: 'alarmBug', from: 'right', delayMs: 0 },
      { type: 'alarmBug', from: 'right', delayMs: 400 },
    ],
    [{ type: 'nightBat', from: 'left', delayMs: 0 }],
  ],
};
const T: TrickleDef[] = [{ triggerScrollX: 300, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } }];

function step(s: EncounterState, scrollX: number, alive = 0, dtMs = 50, trickles: TrickleDef[] = T) {
  return stepEncounters(s, [A], trickles, { scrollX, arenaEnemiesAlive: alive, dtMs });
}

test('鏡頭到 300 輸出零星魔物一次', () => {
  let r = step(initialEncounters(), 299);
  expect(r.spawns).toHaveLength(0);
  r = step(r.state, 300);
  expect(r.spawns).toEqual([{ spec: T[0].spawn, arena: false }]);
  expect(step(r.state, 310).spawns).toHaveLength(0);
});

test('一次跨過多個零星點會全部輸出', () => {
  const two: TrickleDef[] = [
    { triggerScrollX: 500, spawn: { type: 'nightBat', from: 'right', delayMs: 0 } },
    { triggerScrollX: 300, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } },
  ];
  const r = step(initialEncounters(), 600, 0, 50, two);
  expect(r.spawns.map((s) => s.spec.type)).toEqual(['alarmBug', 'nightBat']);
});

function startArena() {
  return step(initialEncounters(), 1000, 0, 50, []);
}

test('到達 lockScrollX 開始戰鬥並鎖住鏡頭', () => {
  const r = startArena();
  expect(r.lockScrollX).toBe(1000);
  expect(r.spawns).toEqual([{ spec: A.waves[0][0], arena: true }]);
});

test('延遲生成;最後一隻生成的那一格不會判定清完', () => {
  let r = startArena();
  for (let i = 1; i <= 7; i++) {
    r = step(r.state, 1000, 1, 50, []);
    expect(r.spawns).toHaveLength(0);
  }
  r = step(r.state, 1000, 0, 50, []);
  expect(r.spawns).toEqual([{ spec: A.waves[0][1], arena: true }]);
  expect(r.state.active!.wave).toBe(0);
  expect(r.lockScrollX).toBe(1000);
});

test('清完一波進下一波,清完最後一波解鎖', () => {
  let r = startArena();
  for (let i = 0; i < 8; i++) r = step(r.state, 1000, 1, 50, []);
  expect(r.state.active!.pending).toHaveLength(0);
  r = step(r.state, 1000, 0, 50, []);
  expect(r.state.active!.wave).toBe(1);
  r = step(r.state, 1000, 0, 50, []);
  expect(r.spawns).toEqual([{ spec: A.waves[1][0], arena: true }]);
  r = step(r.state, 1000, 1, 50, []);
  expect(r.lockScrollX).toBe(1000);
  r = step(r.state, 1000, 0, 50, []);
  expect(r.lockScrollX).toBeNull();
  expect(r.state.nextArena).toBe(1);
});

test('還有魔物時不前進', () => {
  let r = startArena();
  for (let i = 0; i < 12; i++) r = step(r.state, 1000, 2, 50, []);
  expect(r.state.active!.wave).toBe(0);
});

test('從戰鬥區中間重來不會把鏡頭往回拉', () => {
  expect(step(initialEncounters(), 1616, 0, 50, []).lockScrollX).toBe(1616);
});
