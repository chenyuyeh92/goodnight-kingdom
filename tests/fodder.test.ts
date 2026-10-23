import { test, expect } from 'vitest';
import { ENEMY_DEFS } from '../src/game/enemies';
import { BOSS_FODDER_MAX, FODDER_MAX_Y, WORLD_FODDER, bossFodderSide, addArenaFodder, fodderEchoes, initialBossFodder, isFodder, stepBossFodder, type BossFodder } from '../src/game/fodder';

test('每個世界都有一地一飛的雜魚,都是一兩下打倒', () => {
  for (let w = 1; w <= 10; w++) {
    const f = WORLD_FODDER[w];
    expect(f, `world ${w}`).toBeDefined();
    for (const t of [f.ground, f.flying]) expect(ENEMY_DEFS[t].hp, t).toBeLessThanOrEqual(3);
    expect(ENEMY_DEFS[f.flying].flying, f.flying).toBe(true);
  }
  expect(isFodder(1, 'alarmBug')).toBe(true);
  expect(isFodder(1, 'hedgehog')).toBe(false);
});

test('零星雜魚變成一群 3 隻:兩隻跟班晚 0.25、0.5 秒,位置錯開', () => {
  const fly = fodderEchoes({ type: 'nightBat', from: 'right', y: 300, delayMs: 0 });
  expect(fly.map((e) => e.delayMs)).toEqual([250, 500]);
  expect(fly.map((e) => e.y)).toEqual([340, 260]);
  const ground = fodderEchoes({ type: 'alarmBug', from: 'ground', x: 1000, delayMs: 0 });
  expect(ground.map((e) => e.x)).toEqual([1040, 1080]);
  expect(fodderEchoes({ type: 'alarmBug', from: 'left', delayMs: 0 }).every((e) => e.y === undefined && e.x === undefined)).toBe(true);
});

test('戰鬥區每一波多 2 隻雜魚(一地一飛),排在這一波最後', () => {
  const arenas = addArenaFodder([{ lockScrollX: 500, waves: [[{ type: 'hedgehog', from: 'right', delayMs: 400 }], []] }], 1);
  expect(arenas[0].waves[0]).toHaveLength(3);
  expect(arenas[0].waves[0].slice(1).map((s) => [s.type, s.delayMs])).toEqual([
    ['alarmBug', 700],
    ['nightBat', 1000],
  ]);
  expect(arenas[0].waves[1]).toHaveLength(2);
});

test('魔王叫雜魚:依階段的間隔、3 隻一群、左右輪流、最多 6 隻、暫停時不算', () => {
  const run = (s: BossFodder, ms: number, phase: 1 | 2 | 3, alive = 0, paused = false) => {
    let count = 0;
    let side: 'left' | 'right' | null = null;
    for (let t = 0; t < ms; t += 50) {
      const r = stepBossFodder(s, { phase, alive, paused, dtMs: 50 });
      s = r.state;
      if (r.count > 0) {
        count += r.count;
        side = r.side;
      }
    }
    return { s, count, side };
  };
  expect(run(initialBossFodder(), 5950, 1).count).toBe(0);
  const first = run(initialBossFodder(), 6000, 1);
  expect(first.count).toBe(3);
  const second = run(first.s, 6000, 1);
  expect(second.side).not.toBe(first.side);
  expect(run(initialBossFodder(), 4000, 3).count).toBe(3);
  expect(run(initialBossFodder(), 6000, 1, 5).count).toBe(1);
  const full = run(initialBossFodder(), 7000, 1, BOSS_FODDER_MAX);
  expect(full.count).toBe(0);
  // 滿了就等:有空位的下一格馬上叫。
  expect(stepBossFodder(full.s, { phase: 1, alive: 3, paused: false, dtMs: 16 }).count).toBe(3);
  expect(run(initialBossFodder(), 30000, 1, 0, true).count).toBe(0);
});

test('跟班不會生在地底下(海底的小丑魚)', () => {
  for (const e of fodderEchoes({ type: 'clownfish', from: 'right', y: 440, delayMs: 0 })) expect(e.y!).toBeLessThanOrEqual(FODDER_MAX_Y);
});

test('魔王區右邊沒有空間(世界盡頭)時,雜魚改從左邊來,不會在畫面裡突然冒出來', () => {
  expect(bossFodderSide('right', 9240, 960, 10200, 60)).toBe('left');
  expect(bossFodderSide('right', 5000, 960, 10200, 60)).toBe('right');
  expect(bossFodderSide('left', 9240, 960, 10200, 60)).toBe('left');
});
