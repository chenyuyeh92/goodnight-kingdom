import { test, expect } from 'vitest';
import { ENEMY_DEFS } from '../src/game/enemies';
import { AMBIENT_FODDER_MAX, AMBIENT_FODDER_MS, BOSS_FODDER_MAX, FODDER_MAX_Y, WORLD_FODDER, ambientGroup, bossFodderSide, addArenaFodder, fodderEchoes, initialAmbientFodder, initialBossFodder, isFodder, stepAmbientFodder, stepBossFodder, type AmbientFodder, type BossFodder } from '../src/game/fodder';

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

test('戰鬥區每一波多 4 隻雜魚(兩地兩飛,左右上面都有),排在這一波最後', () => {
  const arenas = addArenaFodder([{ lockScrollX: 500, waves: [[{ type: 'hedgehog', from: 'right', delayMs: 400 }], []] }], 1);
  expect(arenas[0].waves[0]).toHaveLength(5);
  expect(arenas[0].waves[0].slice(1).map((s) => [s.type, s.from, s.delayMs])).toEqual([
    ['alarmBug', 'right', 700],
    ['nightBat', 'left', 900],
    ['alarmBug', 'left', 1100],
    ['nightBat', 'top', 1300],
  ]);
  expect(arenas[0].waves[1]).toHaveLength(4);
});

test('魔王叫雜魚:依階段的間隔(3.5/3/2.5 秒)、3 隻一群、右→上→左→上輪流、最多 9 隻、暫停時不算', () => {
  const run = (s: BossFodder, ms: number, phase: 1 | 2 | 3, alive = 0, paused = false) => {
    let count = 0;
    const sides: string[] = [];
    for (let t = 0; t < ms; t += 50) {
      const r = stepBossFodder(s, { phase, alive, paused, dtMs: 50 });
      s = r.state;
      if (r.count > 0) {
        count += r.count;
        sides.push(r.side);
      }
    }
    return { s, count, sides };
  };
  expect(run(initialBossFodder(), 3450, 1).count).toBe(0);
  expect(run(initialBossFodder(), 3500, 1).count).toBe(3);
  expect(run(initialBossFodder(), 2500, 3).count).toBe(3);
  expect(run(initialBossFodder(), 3000 * 4, 2).sides).toEqual(['right', 'top', 'left', 'top']);
  expect(BOSS_FODDER_MAX).toBe(9);
  expect(run(initialBossFodder(), 3500, 1, 8).count).toBe(1);
  const full = run(initialBossFodder(), 7000, 1, BOSS_FODDER_MAX);
  expect(full.count).toBe(0);
  // 滿了就等:有空位的下一格馬上叫。
  expect(stepBossFodder(full.s, { phase: 1, alive: 3, paused: false, dtMs: 16 }).count).toBe(3);
  expect(run(initialBossFodder(), 30000, 1, 0, true).count).toBe(0);
});

test('路上也一直有雜魚潮:每 3 秒一群 3 隻,右→上→左→上輪流,最多 8 隻;戰鬥區、魔王區、暫停時不叫', () => {
  expect(AMBIENT_FODDER_MS).toBe(3000);
  expect(AMBIENT_FODDER_MAX).toBe(8);
  const run = (s: AmbientFodder, ms: number, alive = 0, active = true) => {
    const froms: string[] = [];
    let count = 0;
    for (let t = 0; t < ms; t += 50) {
      const r = stepAmbientFodder(s, { alive, active, dtMs: 50 });
      s = r.state;
      if (r.count > 0) {
        count += r.count;
        froms.push(r.from);
      }
    }
    return { s, count, froms };
  };
  expect(run(initialAmbientFodder(), 2950).count).toBe(0);
  expect(run(initialAmbientFodder(), 3000).count).toBe(3);
  expect(run(initialAmbientFodder(), 12000).froms).toEqual(['right', 'top', 'left', 'top']);
  expect(run(initialAmbientFodder(), 3000, 6).count).toBe(2);
  expect(run(initialAmbientFodder(), 30000, AMBIENT_FODDER_MAX).count).toBe(0);
  expect(run(initialAmbientFodder(), 30000, 0, false).count).toBe(0);
});

test('雜魚潮的組成:從左右來的是地飛地;從上面來的是三隻會飛的、散開在畫面裡', () => {
  expect(ambientGroup(1, 'right', 3, 1000).map((g) => [g.type, g.from])).toEqual([
    ['alarmBug', 'right'],
    ['nightBat', 'right'],
    ['alarmBug', 'right'],
  ]);
  const top = ambientGroup(1, 'top', 3, 1000);
  expect(top.every((g) => g.type === 'nightBat' && g.from === 'top')).toBe(true);
  const xs = top.map((g) => g.x!);
  expect(new Set(xs).size).toBe(3);
  for (const x of xs) {
    expect(x).toBeGreaterThan(1000 + 100);
    expect(x).toBeLessThan(1000 + 860);
  }
  expect(ambientGroup(1, 'left', 2, 0)).toHaveLength(2);
});

test('跟班不會生在地底下(海底的小丑魚)', () => {
  for (const e of fodderEchoes({ type: 'clownfish', from: 'right', y: 440, delayMs: 0 })) expect(e.y!).toBeLessThanOrEqual(FODDER_MAX_Y);
});

test('魔王區右邊沒有空間(世界盡頭)時,雜魚改從左邊來,不會在畫面裡突然冒出來', () => {
  expect(bossFodderSide('right', 9240, 960, 10200, 60)).toBe('left');
  expect(bossFodderSide('right', 5000, 960, 10200, 60)).toBe('right');
  expect(bossFodderSide('left', 9240, 960, 10200, 60)).toBe('left');
});
