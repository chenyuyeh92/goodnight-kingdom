import type { LevelId } from '../levels/levelDef';

/** 世界 1 的三個小關。1-3 沿用原本的 forest(網址 ?level=forest)。 */
export const WORLD1: readonly LevelId[] = ['w1-1', 'w1-2', 'forest'];
export const WORLD2: readonly LevelId[] = ['w2-1', 'w2-2', 'w2-3'];
export const WORLD3: readonly LevelId[] = ['w3-1', 'w3-2', 'w3-3'];
export const WORLD4: readonly LevelId[] = ['w4-1', 'w4-2', 'w4-3'];
export const WORLD5: readonly LevelId[] = ['w5-1', 'w5-2', 'w5-3'];
export const WORLD6: readonly LevelId[] = ['w6-1', 'w6-2', 'w6-3'];
export const WORLD7: readonly LevelId[] = ['w7-1', 'w7-2', 'w7-3'];

/** 各世界的小關,全部依序解鎖(世界 2 第一關要先通過 1-3)。 */
export const WORLDS: readonly (readonly LevelId[])[] = [WORLD1, WORLD2, WORLD3, WORLD4, WORLD5, WORLD6, WORLD7];
export const WORLD_NAMES: readonly string[] = ['失眠森林', '沙漠金字塔王國', '亞特蘭提斯海底王國', '冰雪極地', '火山島', '熱帶雨林', '非洲大草原'];

const ORDER: readonly LevelId[] = WORLDS.flat();

export type ClearedTimes = Partial<Record<LevelId, number>>;

/** 關卡在第幾個世界(1 起算);練習關回傳 null。 */
export function worldOf(id: LevelId): number | null {
  const w = WORLDS.findIndex((levels) => levels.includes(id));
  return w < 0 ? null : w + 1;
}

export function levelNumber(id: LevelId): string {
  const w = worldOf(id);
  return w === null ? '練習' : `${w}-${WORLDS[w - 1].indexOf(id) + 1}`;
}

/** 前一關(跨世界);第一關或練習關回傳 null。 */
export function previousLevel(id: LevelId): LevelId | null {
  const i = ORDER.indexOf(id);
  return i > 0 ? ORDER[i - 1] : null;
}

export function isUnlocked(id: LevelId, cleared: ClearedTimes): boolean {
  if (!ORDER.includes(id)) return true;
  const prev = previousLevel(id);
  return prev === null || cleared[prev] !== undefined;
}

/** 下一關(1-3 通關後接 2-1);最後一關與練習關回傳 null。 */
export function nextLevel(id: LevelId): LevelId | null {
  const i = ORDER.indexOf(id);
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null;
}

export function isStoryLevel(id: LevelId): boolean {
  return ORDER.includes(id);
}
