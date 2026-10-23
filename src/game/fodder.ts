import { MAX_DT_MS } from '../config/tuning';
import type { ArenaDef, SpawnSpec } from './encounters';
import type { EnemyType } from './enemies';
import { GROUND_Y } from '../levels/levelDef';

/** 每個世界一兩下就打倒的雜魚(一地一飛;世界 3 在水裡都是游的)。 */
export const WORLD_FODDER: Readonly<Record<number, { ground: EnemyType; flying: EnemyType }>> = {
  1: { ground: 'alarmBug', flying: 'nightBat' },
  2: { ground: 'bellScarab', flying: 'vulture' },
  3: { ground: 'clownfish', flying: 'jellyfish' },
  4: { ground: 'penguin', flying: 'puffin' },
  5: { ground: 'salamander', flying: 'volcanoBird' },
  6: { ground: 'treeFrog', flying: 'parrot' },
  7: { ground: 'meerkat', flying: 'hornbill' },
  8: { ground: 'pika', flying: 'eagle' },
  9: { ground: 'coffeeWorm', flying: 'moth' },
  10: { ground: 'pillowSoldier', flying: 'noisyStar' },
};

export function isFodder(world: number, type: EnemyType): boolean {
  const f = WORLD_FODDER[world];
  return !!f && (f.ground === type || f.flying === type);
}

/** 零星的雜魚變成一群:多兩隻跟班,晚一點出來,位置錯開。 */
const ECHO_DELAYS = [250, 500] as const;
const ECHO_DY = [40, -40] as const;
const ECHO_DX = [40, 80] as const;

/** 會飛、會游的跟班最低到這裡(身體中心),不會生在地底下。 */
export const FODDER_MAX_Y = GROUND_Y - 40;

export function fodderEchoes(spec: SpawnSpec): SpawnSpec[] {
  return ECHO_DELAYS.map((delayMs, i) => ({
    ...spec,
    delayMs,
    ...(spec.y !== undefined ? { y: Math.min(FODDER_MAX_Y, spec.y + ECHO_DY[i]) } : {}),
    ...(spec.x !== undefined ? { x: spec.x + ECHO_DX[i] } : {}),
  }));
}

/** 戰鬥區每一波最後多一地一飛兩隻雜魚。 */
export function addArenaFodder(arenas: readonly ArenaDef[], world: number): ArenaDef[] {
  const f = WORLD_FODDER[world];
  if (!f) return arenas.map((a) => ({ ...a, waves: a.waves.map((w) => [...w]) }));
  return arenas.map((a) => ({
    ...a,
    waves: a.waves.map((wave) => {
      const last = Math.max(0, ...wave.map((s) => s.delayMs));
      return [...wave, { type: f.ground, from: 'right' as const, delayMs: last + 300 }, { type: f.flying, from: 'left' as const, delayMs: last + 600 }];
    }),
  }));
}

/** 魔王區右邊到世界盡頭了(從右邊生會被夾進畫面裡,突然冒出來):改從左邊來。 */
export function bossFodderSide(side: 'left' | 'right', scrollX: number, viewW: number, worldW: number, margin: number): 'left' | 'right' {
  return side === 'right' && scrollX + viewW + margin > worldW ? 'left' : side;
}

/** 魔王戰叫雜魚:魔王越暴躁叫得越快;這個系統叫的最多同時 BOSS_FODDER_MAX 隻。 */
export const BOSS_FODDER_MS = { 1: 6000, 2: 5000, 3: 4000 } as const;
export const BOSS_FODDER_MAX = 6;
const GROUP = 3;

export interface BossFodder {
  timerMs: number;
  side: 'left' | 'right';
}

export function initialBossFodder(): BossFodder {
  return { timerMs: 0, side: 'right' };
}

export function stepBossFodder(
  s: BossFodder,
  i: { phase: 1 | 2 | 3; alive: number; paused: boolean; dtMs: number },
): { state: BossFodder; count: number; side: 'left' | 'right' } {
  if (i.paused) return { state: s, count: 0, side: s.side };
  const need = BOSS_FODDER_MS[i.phase];
  const timerMs = Math.min(s.timerMs + Math.min(i.dtMs, MAX_DT_MS), need);
  if (timerMs < need) return { state: { ...s, timerMs }, count: 0, side: s.side };
  const count = Math.min(GROUP, BOSS_FODDER_MAX - i.alive);
  // 滿了就等(計時停在門檻,有空位馬上叫)。
  if (count <= 0) return { state: { ...s, timerMs }, count: 0, side: s.side };
  return { state: { timerMs: 0, side: s.side === 'left' ? 'right' : 'left' }, count, side: s.side };
}
