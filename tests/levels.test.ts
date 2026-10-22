import { describe, test, expect } from 'vitest';
import { GROUND_Y, parseLevelId } from '../src/levels/levelDef';
import { LEVELS } from '../src/levels';
import { ENEMY_DEFS } from '../src/game/enemies';
import { STAND_HITBOX } from '../src/game/playerMotor';

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

describe.each(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3', 'w4-1', 'w4-2', 'w4-3', 'w5-1', 'w5-2', 'w5-3', 'w6-1', 'w6-2', 'w6-3', 'w7-1', 'w7-2', 'w7-3', 'w8-1', 'w8-2', 'w8-3', 'w9-1', 'w9-2', 'w9-3', 'w10-1', 'w10-2', 'w10-3'] as const)('關卡共通規則:%s', (id) => {
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

describe.each(['w4-1', 'w4-2', 'w4-3'] as const)('世界 4 冰雪:%s', (id) => {
  const L = LEVELS[id];
  const ice = L.ice ?? [];

  test('屬於世界 4,有冰面與冰柱,平台用雪堆', () => {
    expect(L.world).toBe(4);
    expect(ice.length).toBeGreaterThan(0);
    expect((L.icicles ?? []).length).toBeGreaterThan(0);
    expect(L.platformArt).toBe('snow-platform');
    for (const s of L.scenes) expect(s.scene.startsWith('w4-')).toBe(true);
  });

  test('關主區沒有冰面、冰柱與冰刺', () => {
    const lock = L.boss!.lockScrollX;
    for (const s of ice) expect(s.x + s.w).toBeLessThan(lock);
    for (const x of L.icicles ?? []) expect(x).toBeLessThan(lock - 100);
    for (const t of L.thorns) expect(t.x + t.w).toBeLessThan(lock);
  });

  test('冰柱不在檢查點正上方(重來時不會一出來就被砸)', () => {
    for (const x of L.icicles ?? []) for (const cp of L.checkpoints) expect(Math.abs(x - cp) > 120 && Math.abs(x - (cp + 40)) > 120, `冰柱 ${x} 檢查點 ${cp}`).toBe(true);
  });

  test('冰刺不在冰面上(滑過去停不下來太不公平)', () => {
    for (const t of L.thorns) for (const s of ice) expect(t.x + t.w < s.x - 40 || t.x > s.x + s.w + 40, `冰刺 ${t.x}`).toBe(true);
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 4 的小頭目是北極熊、獨角鯨,關主是雪怪', () => {
  expect(LEVELS['w4-1'].boss!.type).toBe('polarBear');
  expect(LEVELS['w4-2'].boss!.type).toBe('narwhal');
  expect(LEVELS['w4-3'].boss!.type).toBe('yeti');
  expect(LEVELS['w4-1'].hints!.map((h) => h.kind)).toEqual(expect.arrayContaining(['ice', 'icicle']));
  expect(LEVELS['w4-3'].scenes.map((s) => s.scene)).toEqual(['w4-s3', 'w4-s4']);
});

describe.each(['w5-1', 'w5-2', 'w5-3'] as const)('世界 5 火山:%s', (id) => {
  const L = LEVELS[id];
  const lava = L.lava ?? [];
  const onLava = (x: number, margin: number): boolean => lava.some((s) => x >= s.x - margin && x <= s.x + s.w + margin);

  test('屬於世界 5,有熔岩與噴發區,平台用岩石', () => {
    expect(L.world).toBe(5);
    expect(lava.length).toBeGreaterThan(0);
    expect((L.eruptions ?? []).length).toBeGreaterThan(0);
    expect(L.platformArt).toBe('rock-platform');
    for (const s of L.scenes) expect(s.scene.startsWith('w5-')).toBe(true);
  });

  test('每片熔岩都跳得過:沒有平台時寬度 ≤ 110,有岩石平台時每一跳 ≤ 110、平台從地面跳得上去', () => {
    for (const s of lava) {
      const plats = L.terrain.filter((r) => r.h <= 20 && r.x >= s.x && r.x + r.w <= s.x + s.w).sort((a, b) => a.x - b.x);
      let from = s.x;
      for (const p of plats) {
        expect(p.x - from, `熔岩 ${s.x}`).toBeLessThanOrEqual(110);
        expect(GROUND_Y - p.y, `平台 ${p.x}`).toBeLessThanOrEqual(140);
        from = p.x + p.w;
      }
      expect(s.x + s.w - from, `熔岩 ${s.x}`).toBeLessThanOrEqual(110);
    }
  });

  test('熔岩上方沒有擋頭的平台(從地面起跳會撞到頭、跳不過去);熔岩裡踩的岩石平台除外', () => {
    for (const s of lava) {
      for (const r of L.terrain.filter((r) => r.h <= 20)) {
        const stepping = r.x >= s.x && r.x + r.w <= s.x + s.w;
        const over = r.x < s.x + s.w + 80 && r.x + r.w > s.x - 80;
        expect(stepping || !over || r.y <= 300, `熔岩 ${s.x} 平台 ${r.x}`).toBe(true);
      }
    }
  });

  test('檢查點不在噴發區附近(重來時不會一出來就被石頭砸)', () => {
    for (const z of L.eruptions ?? []) for (const cp of L.checkpoints) expect(cp + 40 < z.x - 150 || cp > z.x + z.w + 150, `噴發區 ${z.x} 檢查點 ${cp}`).toBe(true);
  });

  test('檢查點(雙人時 B 在右邊 40)、地上的寶箱不在熔岩上', () => {
    for (const cp of L.checkpoints) expect(onLava(cp, 20) || onLava(cp + 40, 20), `檢查點 ${cp}`).toBe(false);
    for (const c of L.chests.filter((c) => c.bottom === GROUND_Y)) expect(onLava(c.x, 30), `寶箱 ${c.x}`).toBe(false);
  });

  test('戰鬥區與關主區沒有熔岩、不會噴發', () => {
    const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
    for (const w of windows) {
      for (const s of lava) expect(s.x + s.w <= w || s.x >= w + VIEW_W, `熔岩 ${s.x} 戰鬥區 ${w}`).toBe(true);
      for (const z of L.eruptions ?? []) expect(z.x + z.w <= w || z.x >= w + VIEW_W, `噴發區 ${z.x} 戰鬥區 ${w}`).toBe(true);
    }
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 5 的小頭目是溫泉河馬、火山蝸牛,關主是火龍;5-1 有熔岩與噴發的告示牌', () => {
  expect(LEVELS['w5-1'].boss!.type).toBe('hippo');
  expect(LEVELS['w5-2'].boss!.type).toBe('snail');
  expect(LEVELS['w5-3'].boss!.type).toBe('dragon');
  expect(LEVELS['w5-1'].hints!.map((h) => h.kind)).toEqual(expect.arrayContaining(['lava', 'eruption']));
  expect(LEVELS['w5-3'].scenes.map((s) => s.scene)).toEqual(['w5-s3', 'w5-s4']);
});

describe.each(['w6-1', 'w6-2', 'w6-3'] as const)('世界 6 雨林:%s', (id) => {
  const L = LEVELS[id];
  const gaps = L.water?.gaps ?? [];
  const vines = L.vines ?? [];
  const inGap = (x: number, margin = 20): boolean => gaps.some((g) => x >= g.x - margin && x <= g.x + g.w + margin);

  test('屬於世界 6,有河溝與藤蔓,平台用木頭', () => {
    expect(L.world).toBe(6);
    expect(gaps.length).toBeGreaterThan(0);
    expect(vines.length).toBeGreaterThan(0);
    expect(L.platformArt).toBe('log-platform');
    for (const s of L.scenes) expect(s.scene.startsWith('w6-')).toBe(true);
  });

  test('每條河溝都過得去:窄的(≤ 110)跳過去,寬的(≤ 300)上面掛一條藤蔓、離岸 40–100', () => {
    for (const g of gaps) {
      const over = vines.filter((v) => v.x > g.x && v.x < g.x + g.w);
      if (g.w <= 110) continue;
      expect(g.w, `河溝 ${g.x}`).toBeLessThanOrEqual(300);
      expect(over, `河溝 ${g.x}`).toHaveLength(1);
      expect(over[0].x - g.x).toBeGreaterThanOrEqual(40);
      expect(over[0].x - g.x).toBeLessThanOrEqual(100);
    }
    for (const v of vines) expect(gaps.some((g) => v.x > g.x && v.x < g.x + g.w), `藤蔓 ${v.x}`).toBe(true);
  });

  test('藤蔓附近沒有平台擋住盪過去的路', () => {
    for (const v of vines) {
      for (const r of L.terrain) expect(r.x + r.w < v.x - 170 || r.x > v.x + 170 || r.y >= 420, `藤蔓 ${v.x} 平台 ${r.x}`).toBe(true);
    }
  });

  test('檢查點(雙人時 B 在右邊 40)、地上的寶箱、地面冒出的魔物都不在河溝上', () => {
    for (const cp of L.checkpoints) expect(inGap(cp) || inGap(cp + 40), `檢查點 ${cp}`).toBe(false);
    for (const c of L.chests.filter((c) => c.bottom === GROUND_Y)) expect(inGap(c.x), `寶箱 ${c.x}`).toBe(false);
    for (const t of L.trickles) if (t.spawn.x !== undefined) expect(inGap(t.spawn.x)).toBe(false);
    for (const a of L.arenas) for (const w of a.waves) for (const s of w) if (s.x !== undefined) expect(inGap(s.x)).toBe(false);
  });

  test('戰鬥區與關主區沒有河溝', () => {
    const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
    for (const w of windows) for (const g of gaps) expect(g.x + g.w <= w || g.x >= w + VIEW_W, `河溝 ${g.x} 戰鬥區 ${w}`).toBe(true);
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 6 的小頭目是樹懶、美洲豹,關主是大猩猩;6-1 有藤蔓的告示牌', () => {
  expect(LEVELS['w6-1'].boss!.type).toBe('sloth');
  expect(LEVELS['w6-2'].boss!.type).toBe('jaguar');
  expect(LEVELS['w6-3'].boss!.type).toBe('gorilla');
  expect(LEVELS['w6-1'].hints!.map((h) => h.kind)).toContain('vine');
  expect(LEVELS['w6-3'].scenes.map((s) => s.scene)).toEqual(['w6-s3', 'w6-s4']);
});

describe.each(['w7-1', 'w7-2', 'w7-3'] as const)('世界 7 草原:%s', (id) => {
  const L = LEVELS[id];
  const zones = L.stampedes ?? [];

  test('屬於世界 7,有獸群奔跑區,平台用岩石', () => {
    expect(L.world).toBe(7);
    expect(zones.length).toBeGreaterThan(0);
    expect(L.platformArt).toBe('savanna-platform');
    for (const s of L.scenes) expect(s.scene.startsWith('w7-')).toBe(true);
  });

  test('每個奔跑區裡都有從地面跳得上去、角馬碰不到的岩石平台', () => {
    for (const z of zones) {
      const safe = L.terrain.filter((r) => r.h <= 20 && r.x >= z.x && r.x + r.w <= z.x + z.w && GROUND_Y - r.y <= 140 && r.y + r.h <= GROUND_Y - 56);
      expect(safe.length, `奔跑區 ${z.x}`).toBeGreaterThan(0);
    }
  });

  test('檢查點離奔跑區遠一點(重來時不會一出來就被撞)', () => {
    for (const z of zones) for (const cp of L.checkpoints) expect(cp + 40 < z.x - 100 || cp > z.x + z.w + 100, `奔跑區 ${z.x} 檢查點 ${cp}`).toBe(true);
  });

  test('戰鬥區與關主區不在奔跑區裡', () => {
    const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
    for (const w of windows) for (const z of zones) expect(z.x + z.w <= w || z.x >= w + VIEW_W, `奔跑區 ${z.x} 戰鬥區 ${w}`).toBe(true);
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 7 的小頭目是長頸鹿、大象,關主是獅子王;7-1 有獸群的告示牌;榮耀岩上有岩石可以躲角馬群', () => {
  expect(LEVELS['w7-1'].boss!.type).toBe('giraffe');
  expect(LEVELS['w7-2'].boss!.type).toBe('elephant');
  expect(LEVELS['w7-3'].boss!.type).toBe('lion');
  expect(LEVELS['w7-1'].hints!.map((h) => h.kind)).toContain('stampede');
  expect(LEVELS['w7-3'].scenes.map((s) => s.scene)).toEqual(['w7-s3', 'w7-s4']);
  const lock = LEVELS['w7-3'].boss!.lockScrollX;
  expect(LEVELS['w7-3'].terrain.filter((r) => r.x >= lock && r.x + r.w <= lock + VIEW_W).length).toBeGreaterThanOrEqual(2);
});

describe.each(['w8-1', 'w8-2', 'w8-3'] as const)('世界 8 高山:%s', (id) => {
  const L = LEVELS[id];
  const winds = L.winds ?? [];
  const gaps = L.water?.gaps ?? [];
  const inGap = (x: number, margin = 20): boolean => gaps.some((g) => x >= g.x - margin && x <= g.x + g.w + margin);

  test('屬於世界 8,有強風,平台用雲朵;有雲海的話畫成雲', () => {
    expect(L.world).toBe(8);
    expect(winds.length).toBeGreaterThan(0);
    expect(L.platformArt).toBe('cloud-platform');
    if (gaps.length > 0) expect(L.gapStyle).toBe('cloud');
    for (const s of L.scenes) expect(s.scene.startsWith('w8-')).toBe(true);
  });

  test('強風區離雲海遠一點(逆風跳不遠),不在戰鬥區與關主區', () => {
    const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
    for (const z of winds) {
      for (const g of gaps) expect(z.x + z.w <= g.x - 150 || z.x >= g.x + g.w + 150, `強風 ${z.x} 雲海 ${g.x}`).toBe(true);
      for (const w of windows) expect(z.x + z.w <= w || z.x >= w + VIEW_W, `強風 ${z.x} 戰鬥區 ${w}`).toBe(true);
    }
  });

  test('每片雲海都跳得過:沒有平台時寬度 ≤ 110,有雲朵平台時每一跳 ≤ 110,上方沒有擋頭的平台', () => {
    for (const g of gaps) {
      const plats = L.terrain.filter((r) => r.h <= 20 && r.x >= g.x && r.x + r.w <= g.x + g.w).sort((a, b) => a.x - b.x);
      let from = g.x;
      for (const p of plats) {
        expect(p.x - from, `雲海 ${g.x}`).toBeLessThanOrEqual(110);
        expect(GROUND_Y - p.y).toBeLessThanOrEqual(140);
        from = p.x + p.w;
      }
      expect(g.x + g.w - from, `雲海 ${g.x}`).toBeLessThanOrEqual(110);
      for (const r of L.terrain.filter((r) => r.h <= 20)) {
        const stepping = r.x >= g.x && r.x + r.w <= g.x + g.w;
        const over = r.x < g.x + g.w + 80 && r.x + r.w > g.x - 80;
        expect(stepping || !over || r.y <= 300, `雲海 ${g.x} 平台 ${r.x}`).toBe(true);
      }
    }
  });

  test('檢查點、地上的寶箱、地面冒出的魔物都不在雲海上;戰鬥區與關主區沒有雲海', () => {
    for (const cp of L.checkpoints) expect(inGap(cp) || inGap(cp + 40), `檢查點 ${cp}`).toBe(false);
    for (const c of L.chests.filter((c) => c.bottom === GROUND_Y)) expect(inGap(c.x, 30), `寶箱 ${c.x}`).toBe(false);
    for (const t of L.trickles) if (t.spawn.x !== undefined) expect(inGap(t.spawn.x)).toBe(false);
    const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
    for (const w of windows) for (const g of gaps) expect(g.x + g.w <= w || g.x >= w + VIEW_W).toBe(true);
  });

  test('關主區有兩塊雲朵平台,站上去時關主從底下經過(平台底部比關主頭頂高)', () => {
    const lock = L.boss!.lockScrollX;
    const plats = L.terrain.filter((r) => r.x >= lock && r.x + r.w <= lock + VIEW_W);
    expect(plats.length).toBeGreaterThanOrEqual(2);
    const boss = ENEMY_DEFS[L.boss!.type];
    if (!boss.flying) for (const p of plats) expect(p.y + p.h).toBeLessThanOrEqual(GROUND_Y - boss.h);
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 8 的小頭目是山羊、熊貓,關主是雷鳥;8-1 教強風、8-2 教雲海', () => {
  expect(LEVELS['w8-1'].boss!.type).toBe('goat');
  expect(LEVELS['w8-2'].boss!.type).toBe('panda');
  expect(LEVELS['w8-3'].boss!.type).toBe('thunderbird');
  expect(LEVELS['w8-1'].hints!.map((h) => h.kind)).toContain('wind');
  expect(LEVELS['w8-2'].hints!.map((h) => h.kind)).toContain('cloudGap');
  expect(LEVELS['w8-3'].scenes.map((s) => s.scene)).toEqual(['w8-s3', 'w8-s4']);
});

describe.each(['w9-1', 'w9-2', 'w9-3'] as const)('世界 9 洞窟:%s', (id) => {
  const L = LEVELS[id];
  const dark = L.darkness ?? [];
  const crystals = [...(L.crystals ?? [])].sort((a, b) => a - b);

  test('屬於世界 9,有黑暗區與發光水晶,平台用礦坑木板', () => {
    expect(L.world).toBe(9);
    expect(dark.length).toBeGreaterThan(0);
    expect(crystals.length).toBeGreaterThan(5);
    expect(L.platformArt).toBe('mine-platform');
    for (const s of L.scenes) expect(s.scene.startsWith('w9-')).toBe(true);
  });

  test('黑暗區裡一路都有發光水晶(相隔不超過 460,走著走著就看得到下一顆的光)', () => {
    for (const z of dark) {
      const inside = crystals.filter((c) => c >= z.x && c <= z.x + z.w);
      expect(inside[0] - z.x, `黑暗區 ${z.x} 第一顆`).toBeLessThanOrEqual(460);
      for (let i = 1; i < inside.length; i++) expect(inside[i] - inside[i - 1]).toBeLessThanOrEqual(460);
    }
  });

  test('關主區裡至少兩顆發光水晶', () => {
    const lock = L.boss!.lockScrollX;
    expect(crystals.filter((c) => c >= lock && c <= lock + VIEW_W).length).toBeGreaterThanOrEqual(2);
  });

  test('檢查點(雙人時 B 在右邊 40)不在淺水裡(重來時不會走得很慢)', () => {
    for (const cp of L.checkpoints) for (const s of L.water?.shallow ?? []) expect(cp + 40 < s.x - 20 || cp > s.x + s.w + 20, `檢查點 ${cp} 淺水 ${s.x}`).toBe(true);
  });

  test('淺水不在戰鬥區與關主區', () => {
    const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
    for (const w of windows) for (const s of L.water?.shallow ?? []) expect(s.x + s.w <= w || s.x >= w + VIEW_W, `淺水 ${s.x}`).toBe(true);
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 9 的小頭目是螢火蟲女王、六角恐龍,關主是巨鼴鼠;9-1 教黑暗;9-3 有地下河的淺水', () => {
  expect(LEVELS['w9-1'].boss!.type).toBe('queen');
  expect(LEVELS['w9-2'].boss!.type).toBe('axolotl');
  expect(LEVELS['w9-3'].boss!.type).toBe('mole');
  expect(LEVELS['w9-1'].hints!.map((h) => h.kind)).toContain('dark');
  expect((LEVELS['w9-3'].water?.shallow ?? []).length).toBeGreaterThan(0);
  expect(LEVELS['w9-3'].scenes.map((s) => s.scene)).toEqual(['w9-s3', 'w9-s4']);
});

describe.each(['w10-1', 'w10-2', 'w10-3'] as const)('世界 10 城堡:%s', (id) => {
  const L = LEVELS[id];
  const windows = [...L.arenas.map((a) => a.lockScrollX), L.boss!.lockScrollX];
  const outsideWindows = (x: number, w: number): boolean => windows.every((v) => x + w <= v || x >= v + VIEW_W);

  test('屬於世界 10,平台用月亮平台,有 10 顆星星', () => {
    expect(L.world).toBe(10);
    expect(L.platformArt).toBe('moon-platform');
    expect(L.stars ?? []).toHaveLength(10);
    for (const s of L.scenes) expect(s.scene.startsWith('w10-')).toBe(true);
  });

  test('借用的圖:有強風就載入風線、有冰柱就載入冰柱', () => {
    if ((L.winds ?? []).length > 0) expect(L.borrowArt).toContain('wind-streak');
    if ((L.icicles ?? []).length > 0) expect(L.borrowArt).toContain('icicle');
  });

  test('每顆星星拿得到:地上走過去碰得到,或在平台正上方(站上平台就碰得到)', () => {
    const plats = L.terrain.filter((r) => r.h <= 20);
    for (const s of L.stars ?? []) {
      const onGround = s.y >= GROUND_Y - STAND_HITBOX.h;
      const plat = plats.find((r) => s.x >= r.x && s.x <= r.x + r.w && s.y <= r.y && s.y >= r.y - STAND_HITBOX.h);
      expect(onGround || plat !== undefined, `星星 ${s.x}`).toBe(true);
      if (plat && plat.y < 300) expectReachable({ x: s.x, bottom: plat.y }, L);
      expect(s.x).toBeLessThan(L.boss!.lockScrollX);
    }
  });

  test('強風、淺水、荊棘、冰柱不在戰鬥區與關主區;冰柱、淺水不在檢查點', () => {
    for (const z of L.winds ?? []) expect(outsideWindows(z.x, z.w), `強風 ${z.x}`).toBe(true);
    for (const z of L.water?.shallow ?? []) expect(outsideWindows(z.x, z.w), `淺水 ${z.x}`).toBe(true);
    for (const t of L.thorns) expect(outsideWindows(t.x, t.w), `荊棘 ${t.x}`).toBe(true);
    for (const x of L.icicles ?? []) {
      expect(outsideWindows(x - 100, 200), `冰柱 ${x}`).toBe(true);
      for (const cp of L.checkpoints) expect(Math.abs(x - cp) > 120 && Math.abs(x - (cp + 40)) > 120, `冰柱 ${x} 檢查點 ${cp}`).toBe(true);
    }
    for (const cp of L.checkpoints) for (const s of L.water?.shallow ?? []) expect(cp + 40 < s.x - 20 || cp > s.x + s.w + 20, `檢查點 ${cp} 淺水 ${s.x}`).toBe(true);
  });

  test('城牆缺口都跳得過,強風離缺口遠一點;檢查點不在缺口上', () => {
    const gaps = L.water?.gaps ?? [];
    for (const g of gaps) {
      const plats = L.terrain.filter((r) => r.h <= 20 && r.x >= g.x && r.x + r.w <= g.x + g.w).sort((a, b) => a.x - b.x);
      let from = g.x;
      for (const p of plats) {
        expect(p.x - from, `缺口 ${g.x}`).toBeLessThanOrEqual(110);
        from = p.x + p.w;
      }
      expect(g.x + g.w - from, `缺口 ${g.x}`).toBeLessThanOrEqual(110);
      for (const z of L.winds ?? []) expect(z.x + z.w <= g.x - 150 || z.x >= g.x + g.w + 150).toBe(true);
      for (const cp of L.checkpoints) expect(cp + 40 < g.x - 20 || cp > g.x + g.w + 20).toBe(true);
      expect(outsideWindows(g.x, g.w)).toBe(true);
    }
    if (gaps.length > 0) expect(L.gapStyle).toBe('cloud');
  });

  test('黑暗的大廳裡一路都有燭台(相隔不超過 460)', () => {
    const lights = [...(L.crystals ?? [])].sort((a, b) => a - b);
    for (const z of L.darkness ?? []) {
      expect(L.lightStyle).toBe('candle');
      const inside = lights.filter((c) => c >= z.x && c <= z.x + z.w);
      expect(inside[0] - z.x).toBeLessThanOrEqual(460);
      for (let i = 1; i < inside.length; i++) expect(inside[i] - inside[i - 1]).toBeLessThanOrEqual(460);
      expect(z.x + z.w - inside[inside.length - 1]).toBeLessThanOrEqual(460);
    }
  });

  test('關主區有兩塊平台:會走的小頭目從底下經過;夢貘站著不動,平台不在牠身上(長到最大也碰不到)', () => {
    const lock = L.boss!.lockScrollX;
    const plats = L.terrain.filter((r) => r.x >= lock && r.x + r.w <= lock + VIEW_W);
    expect(plats.length).toBeGreaterThanOrEqual(2);
    const boss = ENEMY_DEFS[L.boss!.type];
    for (const p of plats) {
      if (L.boss!.type === 'tapir') expect(p.x + p.w).toBeLessThan(L.boss!.spawnX - (boss.w / 2) * 1.25 - 40);
      else expect(p.y + p.h).toBeLessThanOrEqual(GROUND_Y - boss.h);
    }
  });

  test('高處寶箱跳得上去', () => {
    for (const c of L.chests.filter((c) => c.bottom < 300)) expectReachable(c, L);
  });
});

test('世界 10:小頭目月兔、孔雀,最終魔王夢貘;10-1 有淺水、荊棘、強風;10-2 有缺口、冰柱、強風;10-3 有黑暗與冰柱', () => {
  expect(LEVELS['w10-1'].boss!.type).toBe('rabbit');
  expect(LEVELS['w10-2'].boss!.type).toBe('peacock');
  expect(LEVELS['w10-3'].boss!.type).toBe('tapir');
  const g = LEVELS['w10-1'];
  expect((g.water?.shallow ?? []).length).toBeGreaterThan(0);
  expect(g.thorns.length).toBeGreaterThan(0);
  expect((g.winds ?? []).length).toBeGreaterThan(0);
  expect(g.hints!.map((h) => h.kind)).toContain('star');
  const w = LEVELS['w10-2'];
  expect((w.water?.gaps ?? []).length).toBeGreaterThan(0);
  expect((w.icicles ?? []).length).toBeGreaterThan(0);
  expect((w.winds ?? []).length).toBeGreaterThan(0);
  const h = LEVELS['w10-3'];
  expect((h.darkness ?? []).length).toBeGreaterThan(0);
  expect((h.icicles ?? []).length).toBeGreaterThan(0);
  expect(h.scenes.map((s) => s.scene)).toEqual(['w10-s3', 'w10-s4']);
  // 王座有月光,不暗。
  for (const z of h.darkness ?? []) expect(z.x + z.w).toBeLessThanOrEqual(h.boss!.lockScrollX);
});
