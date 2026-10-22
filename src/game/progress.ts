import type { LevelId } from '../levels/levelDef';

/** 世界 1 的三個小關,依序解鎖。1-3 沿用原本的 forest(網址 ?level=forest)。 */
export const WORLD1: readonly LevelId[] = ['w1-1', 'w1-2', 'forest'];

export type ClearedTimes = Partial<Record<LevelId, number>>;

export function levelNumber(id: LevelId): string {
  const i = WORLD1.indexOf(id);
  return i < 0 ? '練習' : `1-${i + 1}`;
}

export function isUnlocked(id: LevelId, cleared: ClearedTimes): boolean {
  const i = WORLD1.indexOf(id);
  if (i <= 0) return true;
  return cleared[WORLD1[i - 1]] !== undefined;
}

export function nextLevel(id: LevelId): LevelId | null {
  const i = WORLD1.indexOf(id);
  return i >= 0 && i < WORLD1.length - 1 ? WORLD1[i + 1] : null;
}
