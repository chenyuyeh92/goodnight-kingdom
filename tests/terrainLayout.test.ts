import { describe, test, expect } from 'vitest';
import { GROUND_Y, type LevelDef, type LevelId, type Rect } from '../src/levels/levelDef';
import { LEVELS } from '../src/levels';
import { MOVER_H, SPRING_H, SPRING_W } from '../src/game/gadgets';

/** 地形重排過、放了新機關的關卡(之後的世界重排完再加進來)。 */
const GADGET_LEVELS: readonly LevelId[] = ['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w4-1', 'w4-2', 'w4-3', 'w5-1', 'w5-2', 'w5-3'];
/** 世界 3 在水裡:不放新機關,礁石變多。 */
const REEF_LEVELS: readonly LevelId[] = ['w3-1', 'w3-2', 'w3-3'];

/** 危險的地面:河溝與熔岩(上面的移動平台不蓋到岸邊、底下沒有踏腳的)。 */
function hazards(L: LevelDef): { x: number; w: number }[] {
  return [...(L.water?.gaps ?? []), ...(L.lava ?? [])];
}

/** 一般跳最高約 145:平台之間往上 ≤ 140、水平空隙 ≤ 200;樓梯每階 40–120;彈跳墊往上 ≤ 270。 */
const RISE = 140;
const STAIR_RISE = 120;
const SPRING_RISE = 270;
const GAP = 200;

interface Plat {
  x: number;
  y: number;
  w: number;
  kind: 'terrain' | 'crumble' | 'mover';
  /** 移動平台的第幾個(兩端是同一個)。 */
  mover?: number;
}

/** 站得上去的東西:平台(不含天花板)、會掉的平台、移動平台(兩端的位置都算)。 */
function plats(L: LevelDef): Plat[] {
  return [
    ...L.terrain.filter((r) => r.h <= 30).map((r) => ({ x: r.x, y: r.y, w: r.w, kind: 'terrain' as const })),
    ...(L.crumbles ?? []).map((r) => ({ x: r.x, y: r.y, w: r.w, kind: 'crumble' as const })),
    ...(L.movers ?? []).flatMap((m, i) => [
      { x: m.x, y: m.y, w: m.w, kind: 'mover' as const, mover: i },
      { x: m.x + m.dx, y: m.y + m.dy, w: m.w, kind: 'mover' as const, mover: i },
    ]),
  ];
}

function hGap(a: { x: number; w: number }, b: { x: number; w: number }): number {
  return Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * 跳過寬 w 的東西,頭上要留多高:撞到頭就停止往上、開始往下掉,
 * 在空中的時間(×空中速度 200)要夠飛過 w + 身體寬 28 + 多留 10。
 */
function clearanceToJump(w: number): number {
  for (let c = 60; c <= 260; c++) {
    const h = Math.min(c - 48, 145);
    const d = 670 * 670 - 4 * 775 * h;
    if (d < 0) continue;
    const up = (670 - Math.sqrt(d)) / 1550;
    if ((up + Math.sqrt((2 * h) / 1550)) * 200 >= w + 28 + 10) return c;
  }
  return 999;
}

const key = (p: Plat): string => `${p.kind}:${p.x},${p.y},${p.w}`;

/** 從地面出發,一般跳、彈跳墊、移動平台能到的平台(回傳 key)。 */
function reachable(L: LevelDef): Set<string> {
  const all = plats(L);
  const springs = (L.springs ?? []).map((s) => ({ x: s.x - SPRING_W / 2, w: SPRING_W, y: (s.y ?? GROUND_Y) - SPRING_H }));
  const gaps = L.water?.gaps ?? [];
  const ground: Plat = { x: 0, y: GROUND_Y, w: L.worldW, kind: 'terrain' };
  const reached = new Set<Plat>([ground]);
  const riseFrom = (from: Plat, to: Plat): number => {
    // 彈跳墊放在 from 上面(墊子底部 = from 的頂端),而且離目標不遠。
    const spring = springs.some((s) => Math.abs(s.y + SPRING_H - from.y) <= 2 && s.x + s.w > from.x && s.x < from.x + from.w && hGap(s, to) <= GAP);
    return spring ? SPRING_RISE : RISE;
  };
  for (let changed = true; changed; ) {
    changed = false;
    for (const p of all) {
      if (reached.has(p)) continue;
      // 移動平台:站上一端就會被載到另一端。
      const partner = p.kind === 'mover' ? all.find((o) => o !== p && o.kind === 'mover' && o.mover === p.mover && reached.has(o)) : undefined;
      const ok = !!partner || [...reached].some((q) => {
        if (q === ground) {
          // 從地面:平台底下或旁邊 GAP 以內要有地(不全是河溝)。
          const lo = p.x - GAP;
          const hi = p.x + p.w + GAP;
          const allGap = gaps.some((g) => g.x <= lo && g.x + g.w >= hi);
          return !allGap && GROUND_Y - p.y <= riseFrom(ground, p);
        }
        return hGap(q, p) <= GAP && q.y - p.y <= riseFrom(q, p);
      });
      if (ok) {
        reached.add(p);
        changed = true;
      }
    }
  }
  return new Set([...reached].map(key));
}

describe.each(GADGET_LEVELS)('地形重排與新機關:%s', (id) => {
  const L = LEVELS[id];
  const lock = L.boss!.lockScrollX;

  test('平台變多,有移動平台 ×2、彈跳墊 ×2、會掉的平台一串(3 塊以上)', () => {
    expect(plats(L).filter((p) => p.kind !== 'mover').length + (L.movers?.length ?? 0)).toBeGreaterThanOrEqual(26);
    expect(L.movers?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(L.springs?.length ?? 0).toBeGreaterThanOrEqual(2);
    const cr = [...(L.crumbles ?? [])].sort((a, b) => a.x - b.x);
    const chain = cr.some((_, i) => i + 2 < cr.length && hGap(cr[i], cr[i + 1]) <= GAP && hGap(cr[i + 1], cr[i + 2]) <= GAP);
    expect(chain).toBe(true);
  });

  test('有一段往上爬的樓梯(3 階以上)', () => {
    const t = L.terrain.filter((r) => r.h <= 30).sort((a, b) => a.x - b.x);
    let best = 1;
    let run = 1;
    for (let i = 1; i < t.length; i++) {
      const rise = t[i - 1].y - t[i].y;
      run = hGap(t[i - 1], t[i]) <= GAP && rise >= 40 && rise <= STAIR_RISE ? run + 1 : 1;
      best = Math.max(best, run);
    }
    expect(best).toBeGreaterThanOrEqual(3);
  });

  test('有「上面的路」:至少 5 個高處(頂端 ≤ 280)的平台', () => {
    expect(plats(L).filter((p) => p.y <= 280).length).toBeGreaterThanOrEqual(5);
  });

  test('機關都在關主區之前', () => {
    for (const m of L.movers ?? []) expect(Math.max(m.x, m.x + m.dx) + m.w, `mover ${m.x}`).toBeLessThan(lock);
    for (const s of L.springs ?? []) expect(s.x + SPRING_W / 2, `spring ${s.x}`).toBeLessThan(lock);
    for (const c of L.crumbles ?? []) expect(c.x + c.w, `crumble ${c.x}`).toBeLessThan(lock);
  });

  test('機關不和地形重疊;移動平台整條路上沒有東西;彈跳墊不在荊棘或檢查點上', () => {
    const solid = L.terrain;
    for (const m of L.movers ?? []) {
      const sweep = { x: Math.min(m.x, m.x + m.dx), y: Math.min(m.y, m.y + m.dy) - 60, w: m.w + Math.abs(m.dx), h: MOVER_H + Math.abs(m.dy) + 60 };
      for (const r of [...solid, ...(L.crumbles ?? [])]) expect(overlaps(sweep, r), `mover ${m.x} 碰到 ${r.x},${r.y}`).toBe(false);
    }
    for (const c of L.crumbles ?? []) for (const r of solid) expect(overlaps(c, r), `crumble ${c.x}`).toBe(false);
    for (const s of L.springs ?? []) {
      for (const t of L.thorns) expect(s.x + SPRING_W / 2 < t.x - 20 || s.x - SPRING_W / 2 > t.x + t.w + 20, `spring ${s.x} 荊棘`).toBe(true);
      for (const cp of L.checkpoints) expect(Math.abs(s.x - cp) > 80 && Math.abs(s.x - cp - 40) > 80, `spring ${s.x} 檢查點`).toBe(true);
      if (s.y !== undefined) expect(L.terrain.some((r) => r.y === s.y && s.x >= r.x && s.x <= r.x + r.w), `spring ${s.x} 要放在平台上`).toBe(true);
      for (const g of L.water?.gaps ?? []) expect(s.x + SPRING_W / 2 < g.x || s.x - SPRING_W / 2 > g.x + g.w, `spring ${s.x} 河溝`).toBe(true);
    }
  });

  test('彈跳墊不在流沙、熔岩、冰上,也不在壓力板與掉沙磚的地方', () => {
    const spans = [...(L.sand ?? []), ...(L.lava ?? []), ...(L.ice ?? [])];
    const spots = (L.plates ?? []).flatMap((p) => [p.x, ...p.drops]);
    for (const sp of L.springs ?? []) {
      for (const z of spans) expect(sp.x + SPRING_W / 2 < z.x || sp.x - SPRING_W / 2 > z.x + z.w, `spring ${sp.x} 在 ${z.x}`).toBe(true);
      for (const x of spots) expect(Math.abs(sp.x - x), `spring ${sp.x} 壓力板 ${x}`).toBeGreaterThan(60);
    }
  });

  test('新的平台與機關不接住冰柱、沙磚(離掉落點 ≥ 50)', () => {
    const drops = [...(L.icicles ?? []), ...(L.plates ?? []).flatMap((p) => p.drops)];
    const things = [
      ...(L.crumbles ?? []).map((c) => ({ x: c.x, w: c.w })),
      ...(L.movers ?? []).map((m) => ({ x: Math.min(m.x, m.x + m.dx), w: m.w + Math.abs(m.dx) })),
      ...(L.springs ?? []).map((sp) => ({ x: sp.x - SPRING_W / 2, w: SPRING_W })),
    ];
    for (const t of things) for (const d of drops) expect(d < t.x - 50 || d > t.x + t.w + 50, `${t.x} 接住 ${d}`).toBe(true);
  });

  /** 會擋頭的東西:平台(不含天花板)、會掉的平台、移動平台整條路線。 */
  const overheads = (): (Rect & { what: string })[] => [
    ...L.terrain.filter((r) => r.h <= 30).map((r) => ({ ...r, what: `平台 ${r.x},${r.y}` })),
    ...(L.crumbles ?? []).map((r) => ({ ...r, what: `會掉的平台 ${r.x}` })),
    ...(L.movers ?? []).map((m) => ({ x: Math.min(m.x, m.x + m.dx), y: Math.min(m.y, m.y + m.dy), w: m.w + Math.abs(m.dx), h: MOVER_H + Math.abs(m.dy), what: `移動平台 ${m.x}` })),
  ];
  /** 地面上要跳過去的東西:荊棘、熔岩、河溝。 */
  const jumpOver = (): { x: number; w: number }[] => [...L.thorns, ...(L.lava ?? []), ...(L.water?.gaps ?? [])];
  /** 跳過這片危險最長的一跳:中間有踩的岩石、荷葉就分段;有移動平台載過去時算一跳 110。 */
  const widestJump = (z: { x: number; w: number }): number => {
    if ((L.movers ?? []).some((m) => isCrossing({ x: Math.min(m.x, m.x + m.dx), y: m.y, w: m.w + Math.abs(m.dx), h: MOVER_H }, z))) return 110;
    const steps = [...L.terrain, ...(L.water?.pads ?? []).map((p) => ({ ...p, h: 10 }))]
      .filter((r) => r.x >= z.x && r.x + r.w <= z.x + z.w && r.y >= 380)
      .sort((a, b) => a.x - b.x);
    let from = z.x;
    let widest = 0;
    for (const r of steps) {
      widest = Math.max(widest, r.x - from);
      from = r.x + r.w;
    }
    return Math.max(widest, z.x + z.w - from);
  };
  /** 熔岩、河溝裡踩的岩石、荷葉,和過河、過熔岩的移動平台(本身就是過去的路)。 */
  const isCrossing = (o: Rect, z: { x: number; w: number }): boolean => o.x >= z.x && o.x + o.w <= z.x + z.w && o.y + o.h >= 380;

  test('要跳過的荊棘、熔岩、河溝上方(前後 30)沒有擋頭的東西(撞到頭還跳得過去的高度)', () => {
    for (const z of jumpOver()) {
      for (const o of overheads()) {
        if (isCrossing(o, z)) continue;
        const over = o.x < z.x + z.w + 30 && o.x + o.w > z.x - 30;
        expect(!over || GROUND_Y - (o.y + o.h) >= clearanceToJump(widestJump(z)), `${o.what} 擋住跳過 ${z.x}`).toBe(true);
      }
    }
  });

  test('彈跳墊正上方(左右 60、往上 300)沒有東西(彈起來不會撞頭)', () => {
    for (const sp of L.springs ?? []) {
      const top = (sp.y ?? GROUND_Y) - SPRING_H;
      for (const o of overheads()) {
        const over = o.x < sp.x + 60 && o.x + o.w > sp.x - 60;
        const above = o.y + o.h <= top && o.y + o.h > top - 300;
        expect(over && above, `彈跳墊 ${sp.x} 上方有 ${o.what}`).toBe(false);
      }
    }
  });

  test('檢查點與地上的寶箱上方沒有矮平台(重來後第一下跳不會撞頭,寶箱看得到)', () => {
    for (const o of overheads()) {
      for (const cp of L.checkpoints) expect(o.x < cp + 60 && o.x + o.w > cp - 20 && o.y + o.h > GROUND_Y - 150, `檢查點 ${cp} 上方有 ${o.what}`).toBe(false);
      for (const c of L.chests.filter((c) => c.bottom === GROUND_Y)) expect(o.x < c.x + 30 && o.x + o.w > c.x - 30 && o.y + o.h > GROUND_Y - 120, `寶箱 ${c.x} 上方有 ${o.what}`).toBe(false);
    }
  });

  test('會掉的平台不在熔岩、河溝上(掉下來回到地面,不會掉進去)', () => {
    for (const c of L.crumbles ?? []) for (const z of [...(L.lava ?? []), ...(L.water?.gaps ?? [])]) expect(c.x + c.w <= z.x || c.x >= z.x + z.w, `會掉的平台 ${c.x} 在 ${z.x} 上`).toBe(true);
  });

  test('平台都不接住冰柱與沙磚(冰柱寬 24,離掉落點 ≥ 30)', () => {
    const drops = [...(L.icicles ?? []), ...(L.plates ?? []).flatMap((p) => p.drops)];
    for (const o of overheads()) for (const d of drops) expect(d < o.x - 30 || d > o.x + o.w + 30, `${o.what} 接住 ${d}`).toBe(true);
  });

  test('移動平台不比走路快(最快 ≤ 220 px/s);不跨過戰鬥區鎖住畫面的邊', () => {
    const windows = [...L.arenas.map((a) => a.lockScrollX), lock];
    for (const m of L.movers ?? []) {
      expect((Math.PI * Math.max(Math.abs(m.dx), Math.abs(m.dy)) * 1000) / m.periodMs, `移動平台 ${m.x}`).toBeLessThanOrEqual(220);
      const lo = Math.min(m.x, m.x + m.dx);
      const hi = Math.max(m.x, m.x + m.dx) + m.w;
      for (const w of windows) for (const edge of [w, w + 960]) expect(lo < edge && hi > edge, `移動平台 ${m.x} 跨過 ${edge}`).toBe(false);
    }
  });

  test('每個平台都到得了(一般跳、彈跳墊、移動平台),高處寶箱也是', () => {
    const r = reachable(L);
    for (const p of plats(L)) expect(r.has(key(p)), `${p.kind} ${p.x},${p.y} 到不了`).toBe(true);
    for (const c of L.chests.filter((c) => c.bottom < GROUND_Y)) {
      const under = plats(L).find((p) => p.y === c.bottom && c.x >= p.x && c.x <= p.x + p.w);
      expect(under, `寶箱 ${c.x} 底下要有平台`).toBeDefined();
    }
  });
});

test('河溝、熔岩上的移動平台:不蓋到岸上、底下沒有荷葉或岩石(起跳不會撞到平台底)', () => {
  for (const id of GADGET_LEVELS) {
    const L = LEVELS[id];
    for (const g of hazards(L)) {
      for (const m of L.movers ?? []) {
        const lo = Math.min(m.x, m.x + m.dx);
        const hi = Math.max(m.x, m.x + m.dx) + m.w;
        if (hi <= g.x || lo >= g.x + g.w) continue;
        expect(lo >= g.x && hi <= g.x + g.w, `${id} mover ${m.x} 蓋到岸上`).toBe(true);
        for (const p of L.water?.pads ?? []) expect(p.x + p.w <= lo || p.x >= hi, `${id} mover ${m.x} 底下有荷葉 ${p.x}`).toBe(true);
        for (const r of L.terrain.filter((r) => r.y > m.y && r.x < g.x + g.w && r.x + r.w > g.x)) expect(r.x + r.w <= lo || r.x >= hi, `${id} mover ${m.x} 底下有岩石 ${r.x}`).toBe(true);
      }
    }
  }
});

test('有河溝或熔岩的關卡:至少一段移動平台在河溝或熔岩上', () => {
  for (const id of GADGET_LEVELS) {
    const L = LEVELS[id];
    const gaps = hazards(L);
    if (gaps.length === 0) continue;
    const over = (L.movers ?? []).some((m) => gaps.some((g) => Math.min(m.x, m.x + m.dx) < g.x + g.w && Math.max(m.x, m.x + m.dx) + m.w > g.x));
    expect(over, id).toBe(true);
  }
});

describe.each(REEF_LEVELS)('海底礁石變多:%s', (id) => {
  const L = LEVELS[id];
  test('礁石至少 20 塊(原本 10),不放新機關', () => {
    expect(L.terrain.length).toBeGreaterThanOrEqual(20);
    expect(L.movers ?? []).toHaveLength(0);
    expect(L.springs ?? []).toHaveLength(0);
    expect(L.crumbles ?? []).toHaveLength(0);
  });

  test('每個位置上下都留 70 以上的通道(游得過去)', () => {
    for (let x = 0; x < L.boss!.lockScrollX; x += 10) {
      const blocks = L.terrain.filter((r) => x >= r.x && x <= r.x + r.w).map((r) => [r.y, r.y + r.h] as const).sort((a, b) => a[0] - b[0]);
      let top = 0;
      let best = 0;
      for (const [a, b] of blocks) {
        best = Math.max(best, a - top);
        top = Math.max(top, b);
      }
      best = Math.max(best, GROUND_Y - top);
      expect(best, `x ${x}`).toBeGreaterThanOrEqual(70);
    }
  });

  test('礁石不擋住水流、氣泡柱,不壓到寶箱與檢查點', () => {
    for (const r of L.terrain) {
      for (const c of L.currents ?? []) expect(overlaps(r, c), `礁石 ${r.x},${r.y} 擋住水流 ${c.x}`).toBe(false);
      for (const cp of L.checkpoints) expect(r.x > cp + 80 || r.x + r.w < cp - 20 || r.y + r.h < GROUND_Y - 80, `礁石 ${r.x} 檢查點 ${cp}`).toBe(true);
      for (const ch of L.chests) expect(overlaps(r, { x: ch.x - 25, y: ch.bottom - 40, w: 50, h: 40 }), `礁石 ${r.x} 寶箱 ${ch.x}`).toBe(false);
    }
  });
});
