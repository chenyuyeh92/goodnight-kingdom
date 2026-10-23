import { MAX_DT_MS } from '../config/tuning';
import type { ArenaDef, SpawnSpec } from './encounters';
import type { EnemyType } from './enemies';
import { GROUND_Y } from '../levels/levelDef';
import { SWIM_TOP } from './swim';

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

/** 戰鬥區每一波最後多四隻雜魚(兩地兩飛,從右、左、上面來)。 */
export function addArenaFodder(arenas: readonly ArenaDef[], world: number): ArenaDef[] {
  const f = WORLD_FODDER[world];
  if (!f) return arenas.map((a) => ({ ...a, waves: a.waves.map((w) => [...w]) }));
  return arenas.map((a) => ({
    ...a,
    waves: a.waves.map((wave) => {
      const last = Math.max(0, ...wave.map((s) => s.delayMs));
      const extra: SpawnSpec[] = [
        { type: f.ground, from: 'right', delayMs: last + 300 },
        { type: f.flying, from: 'left', delayMs: last + 500 },
        { type: f.ground, from: 'left', delayMs: last + 700 },
        { type: f.flying, from: 'top', delayMs: last + 900 },
      ];
      return [...wave, ...extra];
    }),
  }));
}

/** 一邊沒有空間(右邊到世界盡頭、左邊到關卡最左邊):從那邊生會被夾進畫面裡突然冒出來,改從另一邊來。 */
export function bossFodderSide(side: FodderFrom, scrollX: number, viewW: number, worldW: number, margin: number): FodderFrom {
  if (side === 'right' && scrollX + viewW + margin > worldW) return 'left';
  if (side === 'left' && scrollX - margin < 0) return 'right';
  return side;
}

/** 陸上從畫面上方外面掉下來;海底(世界 3)的水母不會往下游,從水面下出來才打得到。 */
export const TOP_SPAWN_Y = -30;
export function topSpawnY(underwater: boolean, h: number): number {
  return underwater ? SWIM_TOP + h / 2 + 10 : TOP_SPAWN_Y;
}

/** 雜魚一群一群輪流從右邊、上面、左邊、上面來(四面八方)。 */
export type FodderFrom = 'left' | 'right' | 'top';
const ROTATION: readonly FodderFrom[] = ['right', 'top', 'left', 'top'];
const GROUP = 3;
/** 畫面寬(從上面來的雜魚散開在畫面裡)。 */
const VIEW_W = 960;

/** 魔王戰叫雜魚:魔王越暴躁叫得越快;這個系統叫的最多同時 BOSS_FODDER_MAX 隻。 */
export const BOSS_FODDER_MS = { 1: 3500, 2: 3000, 3: 2500 } as const;
export const BOSS_FODDER_MAX = 9;

export interface BossFodder {
  timerMs: number;
  /** 下一群從 ROTATION 的第幾個方向來。 */
  turn: number;
}

export function initialBossFodder(): BossFodder {
  return { timerMs: 0, turn: 0 };
}

interface Timed {
  timerMs: number;
  turn: number;
}

/** 計時到了、有空位就叫一群;滿了就等(計時停在門檻,有空位馬上叫)。 */
function stepGroups<S extends Timed>(s: S, need: number, max: number, alive: number, dtMs: number): { state: S; count: number; side: FodderFrom } {
  const side = ROTATION[s.turn % ROTATION.length];
  const timerMs = Math.min(s.timerMs + Math.min(dtMs, MAX_DT_MS), need);
  const count = timerMs < need ? 0 : Math.min(GROUP, max - alive);
  if (count <= 0) return { state: { ...s, timerMs }, count: 0, side };
  return { state: { ...s, timerMs: 0, turn: (s.turn + 1) % ROTATION.length }, count, side };
}

export function stepBossFodder(
  s: BossFodder,
  i: { phase: 1 | 2 | 3; alive: number; paused: boolean; dtMs: number },
): { state: BossFodder; count: number; side: FodderFrom } {
  if (i.paused) return { state: s, count: 0, side: ROTATION[s.turn % ROTATION.length] };
  return stepGroups(s, BOSS_FODDER_MS[i.phase], BOSS_FODDER_MAX, i.alive, i.dtMs);
}

/** 路上的雜魚潮(戰鬥區、魔王區以外):每 AMBIENT_FODDER_MS 一群,同時最多 AMBIENT_FODDER_MAX 隻。 */
export const AMBIENT_FODDER_MS = 3000;
export const AMBIENT_FODDER_MAX = 8;

export type AmbientFodder = Timed;

export function initialAmbientFodder(): AmbientFodder {
  return { timerMs: 0, turn: 0 };
}

export function stepAmbientFodder(
  s: AmbientFodder,
  i: { alive: number; active: boolean; dtMs: number },
): { state: AmbientFodder; count: number; from: FodderFrom } {
  if (!i.active) return { state: s, count: 0, from: ROTATION[s.turn % ROTATION.length] };
  const r = stepGroups(s, AMBIENT_FODDER_MS, AMBIENT_FODDER_MAX, i.alive, i.dtMs);
  return { state: r.state, count: r.count, from: r.side };
}

/** 一群雜魚:從左右來的是地、飛、地(錯開出來);從上面來的是三隻會飛的,散開在畫面裡。 */
export function ambientGroup(world: number, from: FodderFrom, count: number, scrollX: number): SpawnSpec[] {
  const f = WORLD_FODDER[world];
  if (!f) return [];
  const group: SpawnSpec[] =
    from === 'top'
      ? [0.3, 0.55, 0.8].map((k, i) => ({ type: f.flying, from: 'top', x: Math.round(scrollX + VIEW_W * k), delayMs: i * 150 }))
      : [f.ground, f.flying, f.ground].map((type, i) => ({ type, from, delayMs: i * 150 }));
  return group.slice(0, count);
}
