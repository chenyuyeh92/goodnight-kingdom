import { describe, test, expect } from 'vitest';
import { GROUND_Y, type LevelDef, type LevelId, type Rect } from '../src/levels/levelDef';
import { LEVELS } from '../src/levels';
import { MOVER_H, SPRING_H, SPRING_W } from '../src/game/gadgets';

/** 地形重排過、放了新機關的關卡(之後的世界重排完再加進來)。 */
const GADGET_LEVELS: readonly LevelId[] = ['w1-1', 'w1-2', 'forest'];

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
}

/** 站得上去的東西:平台(不含天花板)、會掉的平台、移動平台(兩端的位置都算)。 */
function plats(L: LevelDef): Plat[] {
  return [
    ...L.terrain.filter((r) => r.h <= 30).map((r) => ({ x: r.x, y: r.y, w: r.w, kind: 'terrain' as const })),
    ...(L.crumbles ?? []).map((r) => ({ x: r.x, y: r.y, w: r.w, kind: 'crumble' as const })),
    ...(L.movers ?? []).flatMap((m) => [
      { x: m.x, y: m.y, w: m.w, kind: 'mover' as const },
      { x: m.x + m.dx, y: m.y + m.dy, w: m.w, kind: 'mover' as const },
    ]),
  ];
}

function hGap(a: { x: number; w: number }, b: { x: number; w: number }): number {
  return Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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
      const ok = [...reached].some((q) => {
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

  test('每個平台都到得了(一般跳、彈跳墊、移動平台),高處寶箱也是', () => {
    const r = reachable(L);
    for (const p of plats(L)) expect(r.has(key(p)), `${p.kind} ${p.x},${p.y} 到不了`).toBe(true);
    for (const c of L.chests.filter((c) => c.bottom < GROUND_Y)) {
      const under = plats(L).find((p) => p.y === c.bottom && c.x >= p.x && c.x <= p.x + p.w);
      expect(under, `寶箱 ${c.x} 底下要有平台`).toBeDefined();
    }
  });
});

test('河溝上的移動平台:不蓋到岸上、底下沒有荷葉(從岸邊、荷葉起跳不會撞到平台底)', () => {
  for (const id of GADGET_LEVELS) {
    const L = LEVELS[id];
    for (const g of L.water?.gaps ?? []) {
      for (const m of L.movers ?? []) {
        const lo = Math.min(m.x, m.x + m.dx);
        const hi = Math.max(m.x, m.x + m.dx) + m.w;
        if (hi <= g.x || lo >= g.x + g.w) continue;
        expect(lo >= g.x && hi <= g.x + g.w, `${id} mover ${m.x} 蓋到岸上`).toBe(true);
        for (const p of L.water?.pads ?? []) expect(p.x + p.w <= lo || p.x >= hi, `${id} mover ${m.x} 底下有荷葉 ${p.x}`).toBe(true);
      }
    }
  }
});

test('有河溝的關卡:至少一段移動平台在河溝上', () => {
  for (const id of GADGET_LEVELS) {
    const L = LEVELS[id];
    const gaps = L.water?.gaps ?? [];
    if (gaps.length === 0) continue;
    const over = (L.movers ?? []).some((m) => gaps.some((g) => Math.min(m.x, m.x + m.dx) < g.x + g.w && Math.max(m.x, m.x + m.dx) + m.w > g.x));
    expect(over, id).toBe(true);
  }
});
