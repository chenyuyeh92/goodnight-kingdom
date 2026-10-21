import { MAX_DT_MS } from '../config/tuning';
import type { EnemyType } from './enemies';

export type SpawnFrom = 'left' | 'right' | 'top' | 'ground';

export interface SpawnSpec {
  type: EnemyType;
  from: SpawnFrom;
  /** top/ground 用的世界座標 x。 */
  x?: number;
  delayMs: number;
}

export interface ArenaDef {
  lockScrollX: number;
  waves: readonly (readonly SpawnSpec[])[];
}

export interface TrickleDef {
  triggerScrollX: number;
  spawn: SpawnSpec;
}

export interface ActiveArena {
  lockX: number;
  wave: number;
  waveTimerMs: number;
  pending: SpawnSpec[];
}

export interface EncounterState {
  nextArena: number;
  active: ActiveArena | null;
  tricklesFired: number;
}

export interface EncounterStep {
  state: EncounterState;
  spawns: { spec: SpawnSpec; arena: boolean }[];
  lockScrollX: number | null;
}

/** startScrollX:從檢查點重來時鏡頭的起點,已經走過的零星魔物不再出現。 */
export function initialEncounters(startScrollX = 0, trickles: readonly TrickleDef[] = []): EncounterState {
  const passed = trickles.filter((t) => t.triggerScrollX < startScrollX).length;
  return { nextArena: 0, active: null, tricklesFired: passed };
}

/** 零星魔物依鏡頭位置出現;戰鬥區鎖住鏡頭,一波波生成,全部清完才解鎖。 */
export function stepEncounters(
  s: EncounterState,
  arenas: readonly ArenaDef[],
  trickles: readonly TrickleDef[],
  input: { scrollX: number; arenaEnemiesAlive: number; dtMs: number },
): EncounterStep {
  const spawns: EncounterStep['spawns'] = [];

  const sorted = [...trickles].sort((a, b) => a.triggerScrollX - b.triggerScrollX);
  let tricklesFired = s.tricklesFired;
  while (tricklesFired < sorted.length && sorted[tricklesFired].triggerScrollX <= input.scrollX) {
    spawns.push({ spec: sorted[tricklesFired].spawn, arena: false });
    tricklesFired++;
  }

  let nextArena = s.nextArena;
  let active = s.active ? { ...s.active, pending: [...s.active.pending] } : null;
  let justStarted = false;
  if (!active && nextArena < arenas.length && input.scrollX >= arenas[nextArena].lockScrollX) {
    const def = arenas[nextArena];
    active = { lockX: Math.max(def.lockScrollX, input.scrollX), wave: 0, waveTimerMs: 0, pending: [...def.waves[0]] };
    justStarted = true;
  }

  if (active) {
    // 只在本格開始時就沒有待生成的魔物,才判定清完,避免最後一隻剛生成就解鎖。
    const pendingWasEmpty = active.pending.length === 0;
    if (!justStarted) active.waveTimerMs += Math.min(input.dtMs, MAX_DT_MS);
    const due = active.pending.filter((p) => p.delayMs <= active!.waveTimerMs);
    active.pending = active.pending.filter((p) => p.delayMs > active!.waveTimerMs);
    for (const spec of due) spawns.push({ spec, arena: true });

    if (pendingWasEmpty && input.arenaEnemiesAlive === 0) {
      const waves = arenas[nextArena].waves;
      if (active.wave + 1 < waves.length) {
        active = { ...active, wave: active.wave + 1, waveTimerMs: 0, pending: [...waves[active.wave + 1]] };
      } else {
        active = null;
        nextArena++;
      }
    }
  }

  return { state: { nextArena, active, tricklesFired }, spawns, lockScrollX: active?.lockX ?? null };
}
