import { describe, test, expect } from 'vitest';
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

const F = LEVELS.forest;
const VIEW_W = 960;

test('森林:五段加關主,每段開頭有檢查點', () => {
  expect(F.worldW).toBe(10960);
  expect(F.checkpoints).toEqual([150, 2250, 4250, 6300, 8450, 9900]);
  expect(F.targets).toHaveLength(0);
});

test('森林:四個寶箱,蘑菇坡上路一個、隱藏寶箱在高處', () => {
  expect(F.chests).toHaveLength(4);
  expect(F.chests[1].bottom).toBeLessThan(320);
  expect(F.chests[2].bottom).toBeLessThan(300);
});

/** 從地面出發,能往上跳 ≤ 140、橫向間隔 ≤ 80 的平台都算到得了;寶箱所在的平台要到得了。 */
function expectReachable(chest: { x: number; bottom: number }, L = F): void {
  const plats = L.terrain.filter((r) => r.h <= 20);
  const target = plats.find((r) => r.y === chest.bottom && chest.x >= r.x && chest.x <= r.x + r.w);
  expect(target, `寶箱 ${chest.x} 底下要有平台`).toBeDefined();
  const reached = new Set(plats.filter((r) => 480 - r.y <= 140));
  for (let changed = true; changed; ) {
    changed = false;
    for (const r of plats) {
      if (reached.has(r)) continue;
      const from = [...reached].some((q) => q.y - r.y <= 140 && r.x <= q.x + q.w + 80 && r.x + r.w >= q.x - 80);
      if (from) {
        reached.add(r);
        changed = true;
      }
    }
  }
  expect(reached.has(target!), `寶箱 ${chest.x} 跳得上去`).toBe(true);
}

test('森林:高處寶箱跳得上去', () => {
  expectReachable(F.chests[1]);
  expectReachable(F.chests[2]);
});

test('森林:零星魔物至少 25 組,每一段至少 3 組', () => {
  const groups = new Set(F.trickles.map((t) => t.triggerScrollX));
  expect(groups.size).toBeGreaterThanOrEqual(25);
  const cps = F.checkpoints;
  for (let i = 0; i < cps.length - 1; i++) {
    const inSeg = [...groups].filter((x) => x + 384 >= cps[i] && x + 384 < cps[i + 1]);
    expect(inSeg.length, `第 ${i + 1} 段`).toBeGreaterThanOrEqual(3);
  }
});

test('森林:低矮通道蹲得過、站不過', () => {
  const ceilings = F.terrain.filter((r) => r.h > 20);
  expect(ceilings.length).toBeGreaterThan(0);
  for (const c of ceilings) {
    const gap = 480 - (c.y + c.h);
    expect(gap).toBeGreaterThan(28);
    expect(gap).toBeLessThan(48);
    // 跳躍高度約 145,通道頂端要高到跳不上去,只能蹲著過。
    expect(480 - c.y).toBeGreaterThanOrEqual(170);
  }
});

test('森林:戰鬥區鎖住時走不到下一個檢查點', () => {
  for (const a of F.arenas) {
    const reachable = a.lockScrollX + VIEW_W;
    for (const cp of F.checkpoints) expect(cp <= a.lockScrollX || cp > reachable).toBe(true);
  }
});

test('森林:戰鬥區與關主鎖定點都在世界內,右側生成不會超出世界', () => {
  for (const a of F.arenas) {
    expect(a.lockScrollX + VIEW_W).toBeLessThanOrEqual(F.worldW);
    const usesRight = a.waves.some((w) => w.some((s) => s.from === 'right'));
    if (usesRight) expect(a.lockScrollX + VIEW_W + 20).toBeLessThanOrEqual(F.worldW);
  }
  expect(F.boss!.lockScrollX + VIEW_W).toBe(F.worldW);
});

test('森林:戰鬥區鎖定範圍互不重疊,關主在最後', () => {
  const locks = F.arenas.map((a) => a.lockScrollX).sort((x, y) => x - y);
  for (let i = 1; i < locks.length; i++) expect(locks[i] - locks[i - 1]).toBeGreaterThanOrEqual(VIEW_W);
  expect(F.boss!.lockScrollX).toBeGreaterThan(locks[locks.length - 1]);
});

test('森林:零星魔物在關主鎖定點前一個畫面就結束,不會一路跟進關主戰', () => {
  for (const t of F.trickles) {
    expect(t.triggerScrollX + VIEW_W).toBeLessThanOrEqual(F.boss!.lockScrollX);
    if (t.spawn.x !== undefined) expect(t.spawn.x).toBeLessThan(F.boss!.lockScrollX);
  }
});

test('森林:從左邊來的零星魔物不會生在樹洞裡', () => {
  const tunnels = F.terrain.filter((r) => r.h > 20);
  for (const t of F.trickles.filter((x) => x.spawn.from === 'left')) {
    const spawnX = t.triggerScrollX - 20;
    for (const c of tunnels) expect(spawnX < c.x - 30 || spawnX > c.x + c.w + 30, `${t.triggerScrollX}`).toBe(true);
  }
});

describe.each(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'] as const)('關卡共通規則:%s', (id) => {
  const L = LEVELS[id];

  test('有小頭目或關主,鎖定畫面剛好到世界盡頭', () => {
    expect(L.boss).not.toBeNull();
    expect(L.boss!.lockScrollX + VIEW_W).toBe(L.worldW);
    expect(L.boss!.spawnX).toBeGreaterThan(L.boss!.lockScrollX);
  });

  test('檢查點不在戰鬥區鎖住的畫面裡', () => {
    for (const a of L.arenas) for (const cp of L.checkpoints) expect(cp <= a.lockScrollX || cp > a.lockScrollX + VIEW_W).toBe(true);
  });

  test('零星魔物在關主前一個畫面結束,地面冒出的不在關主區', () => {
    for (const t of L.trickles) {
      expect(t.triggerScrollX + VIEW_W).toBeLessThanOrEqual(L.boss!.lockScrollX);
      if (t.spawn.x !== undefined) expect(t.spawn.x).toBeLessThan(L.boss!.lockScrollX);
    }
  });

  test('零星魔物夠多(邊走邊打):至少 28 組', () => {
    // 同一組的魔物觸發位置相差 40,相差更多就算新的一組。
    const xs = [...new Set(L.trickles.map((t) => t.triggerScrollX))].sort((a, b) => a - b);
    const groups = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 40).length;
    expect(groups).toBeGreaterThanOrEqual(28);
  });

  test('檢查點(雙人時 B 在右邊 40)不在荊棘上', () => {
    for (const cp of L.checkpoints) {
      for (const t of L.thorns) {
        expect(cp + 40 < t.x - 20 || cp > t.x + t.w + 20, `檢查點 ${cp} 荊棘 ${t.x}`).toBe(true);
      }
    }
  });

  test('戰鬥區鎖定範圍互不重疊,都在關主之前', () => {
    const locks = L.arenas.map((a) => a.lockScrollX).sort((x, y) => x - y);
    for (let i = 1; i < locks.length; i++) expect(locks[i] - locks[i - 1]).toBeGreaterThanOrEqual(VIEW_W);
    for (const l of locks) expect(l + VIEW_W).toBeLessThanOrEqual(L.boss!.lockScrollX);
  });

  test('地圖夠長(一局約 4–5 分鐘)', () => {
    expect(L.worldW).toBeGreaterThanOrEqual(9000);
  });
});

test('1-1:高處寶箱跳得上去、前面有教學告示牌', () => {
  const G = LEVELS['w1-1'];
  const high = G.chests.filter((c) => c.bottom < 300);
  expect(high.length).toBeGreaterThan(0);
  for (const c of high) expectReachable(c, G);
  expect(G.hints!.map((h) => h.kind)).toEqual(expect.arrayContaining(['move', 'jump', 'aimUp', 'crouch', 'melee']));
  expect(G.boss!.type).toBe('squirrel');
});

describe('1-2 河邊', () => {
  const R = LEVELS['w1-2'];
  const W = R.water!;
  const inGap = (x: number): boolean => W.gaps.some((g) => x >= g.x - 20 && x <= g.x + g.w + 20);

  test('有淺水、河溝與荷葉,小頭目是熬夜大河狸', () => {
    expect(W.shallow.length).toBeGreaterThan(0);
    expect(W.gaps.length).toBeGreaterThan(0);
    expect(R.boss!.type).toBe('beaver');
  });

  test('每個河溝都跳得過去:沒有荷葉時寬度 ≤ 110,有荷葉時每一跳 ≤ 110', () => {
    for (const g of W.gaps) {
      const pads = W.pads.filter((p) => p.x >= g.x && p.x + p.w <= g.x + g.w).sort((a, b) => a.x - b.x);
      let from = g.x;
      for (const p of pads) {
        expect(p.x - from, `河溝 ${g.x}`).toBeLessThanOrEqual(110);
        from = p.x + p.w;
      }
      expect(g.x + g.w - from, `河溝 ${g.x}`).toBeLessThanOrEqual(110);
    }
  });

  test('檢查點、寶箱、地面冒出的魔物都不在河溝上', () => {
    for (const cp of R.checkpoints) expect(inGap(cp), `檢查點 ${cp}`).toBe(false);
    for (const c of R.chests.filter((c) => c.bottom === 480)) expect(inGap(c.x), `寶箱 ${c.x}`).toBe(false);
    for (const t of R.trickles) if (t.spawn.x !== undefined) expect(inGap(t.spawn.x)).toBe(false);
    for (const a of R.arenas) for (const w of a.waves) for (const s of w) if (s.x !== undefined) expect(inGap(s.x)).toBe(false);
  });

  test('關主區沒有河溝', () => {
    for (const g of W.gaps) expect(g.x + g.w).toBeLessThan(R.boss!.lockScrollX);
  });

  test('高處寶箱跳得上去', () => {
    for (const c of R.chests.filter((c) => c.bottom < 300)) expectReachable(c, R);
  });
});

describe.each(['w2-1', 'w2-2', 'w2-3'] as const)('世界 2 沙漠:%s', (id) => {
  const L = LEVELS[id];
  const sand = L.sand ?? [];
  const onSand = (x: number, margin = 0): boolean => sand.some((s) => x >= s.x - margin && x <= s.x + s.w + margin);

  test('屬於世界 2,用沙漠場景', () => {
    expect(L.world).toBe(2);
    for (const s of L.scenes) expect(s.scene.startsWith('w2-')).toBe(true);
  });

  test('流沙走得過去:每段不超過 200 寬(走路約 1.7 秒,不到陷下去的 2 秒)', () => {
    expect(sand.length).toBeGreaterThan(0);
    for (const s of sand) expect(s.w).toBeLessThanOrEqual(200);
  });

  test('檢查點(雙人 B 在右邊 40)、地上的寶箱不在流沙或壓力板上', () => {
    for (const cp of L.checkpoints) {
      expect(onSand(cp, 20) || onSand(cp + 40, 20), `檢查點 ${cp}`).toBe(false);
      for (const p of L.plates ?? []) expect(Math.abs(cp - p.x) > 60 && Math.abs(cp + 40 - p.x) > 60, `檢查點 ${cp}`).toBe(true);
    }
    for (const c of L.chests.filter((c) => c.bottom === 480)) expect(onSand(c.x, 20), `寶箱 ${c.x}`).toBe(false);
  });

  test('咖啡沙蛇從流沙裡冒出來', () => {
    const snakes = [...L.trickles.map((t) => t.spawn), ...L.arenas.flatMap((a) => a.waves.flat())].filter((s) => s.type === 'sandSnake');
    expect(snakes.length).toBeGreaterThan(0);
    for (const s of snakes) {
      expect(s.from).toBe('ground');
      expect(onSand(s.x!), `沙蛇 ${s.x}`).toBe(true);
    }
  });

  test('關主區沒有流沙、壓力板與仙人掌', () => {
    const lock = L.boss!.lockScrollX;
    for (const s of sand) expect(s.x + s.w).toBeLessThan(lock);
    for (const p of L.plates ?? []) for (const x of [p.x, ...p.drops]) expect(x).toBeLessThan(lock - 20);
    for (const t of L.thorns) expect(t.x + t.w).toBeLessThan(lock);
  });

  test('高處寶箱跳得上去', () => {
    const high = L.chests.filter((c) => c.bottom < 300);
    expect(high.length).toBeGreaterThan(0);
    for (const c of high) expectReachable(c, L);
  });
});

test('世界 2 的小頭目是新的魔物,關主是人面獅身', () => {
  expect(LEVELS['w2-1'].boss!.type).toBe('camel');
  expect(LEVELS['w2-2'].boss!.type).toBe('fennec');
  expect(LEVELS['w2-3'].boss!.type).toBe('sphinx');
  expect(LEVELS['w2-1'].hints!.map((h) => h.kind)).toContain('quicksand');
  expect(LEVELS['w2-3'].hints!.map((h) => h.kind)).toContain('plate');
  expect(LEVELS['w2-3'].plates!.length).toBeGreaterThanOrEqual(4);
  expect(LEVELS['w2-3'].scenes.map((s) => s.scene)).toEqual(['w2-s3', 'w2-s4']);
});

describe.each(['w3-1', 'w3-2', 'w3-3'] as const)('世界 3 海底:%s', (id) => {
  const L = LEVELS[id];
  const fishSpawns = [...L.trickles.map((t) => t.spawn), ...L.arenas.flatMap((a) => a.waves.flat())].filter((s) => s.y !== undefined);

  test('屬於世界 3,整關在水裡,用海底場景', () => {
    expect(L.world).toBe(3);
    expect(L.underwater).toBe(true);
    for (const s of L.scenes) expect(s.scene.startsWith('w3-')).toBe(true);
  });

  test('魚游進來的高度在水面與海床之間', () => {
    expect(fishSpawns.length).toBeGreaterThan(10);
    for (const s of fishSpawns) {
      expect(s.y!, `${s.type}`).toBeGreaterThanOrEqual(120);
      expect(s.y!, `${s.type}`).toBeLessThanOrEqual(440);
    }
  });

  test('高處的寶箱游得上去(在水面以下)', () => {
    const high = L.chests.filter((c) => c.bottom < 300);
    expect(high.length).toBeGreaterThan(0);
    for (const c of high) expect(c.bottom - 40).toBeGreaterThan(70);
  });

  test('關主區沒有水流與海膽', () => {
    const lock = L.boss!.lockScrollX;
    for (const c of L.currents ?? []) expect(c.x + c.w).toBeLessThan(lock);
    for (const t of L.thorns) expect(t.x + t.w).toBeLessThan(lock);
  });

  test('檢查點(雙人 B 在右邊 40)不在氣泡柱或水流裡', () => {
    for (const c of L.currents ?? []) {
      for (const cp of L.checkpoints) expect(cp + 40 < c.x - 10 || cp > c.x + c.w + 10, `檢查點 ${cp}`).toBe(true);
    }
  });
});

test('世界 3 的小頭目是寄居蟹、電鰻,關主是尼斯湖水怪;3-1 教游泳', () => {
  expect(LEVELS['w3-1'].boss!.type).toBe('hermitCrab');
  expect(LEVELS['w3-2'].boss!.type).toBe('eel');
  expect(LEVELS['w3-3'].boss!.type).toBe('nessie');
  expect(LEVELS['w3-1'].hints!.map((h) => h.kind)).toEqual(expect.arrayContaining(['swim', 'dive']));
  expect(LEVELS['w3-2'].currents!.some((c) => c.vx !== 0)).toBe(true);
  expect(LEVELS['w3-3'].currents!.some((c) => c.vy < 0)).toBe(true);
  expect(LEVELS['w3-3'].scenes.map((s) => s.scene)).toEqual(['w3-s3', 'w3-s4']);
});

test('3-3 的高處寶箱底下有氣泡柱可以搭', () => {
  const R = LEVELS['w3-3'];
  const high = R.chests.find((c) => c.bottom < 200)!;
  expect(R.currents!.some((c) => c.vy < 0 && Math.abs(c.x + c.w / 2 - high.x) < 200)).toBe(true);
});
