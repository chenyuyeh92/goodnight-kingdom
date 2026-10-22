import type { ArenaDef, TrickleDef } from '../game/encounters';
import type { ScenePlan } from '../art/scenes';

export type LevelId = 'range' | 'forest' | 'w1-1' | 'w1-2';

const LEVEL_IDS: readonly LevelId[] = ['range', 'forest', 'w1-1', 'w1-2'];

/** 左上角座標與寬高。 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelDef {
  id: LevelId;
  name: string;
  worldW: number;
  /** 平台與天花板;地面由場景依 worldW 自動加上。 */
  terrain: readonly Rect[];
  /** 荊棘:x 起點與寬度,貼在地面上。 */
  thorns: readonly { x: number; w: number }[];
  checkpoints: readonly number[];
  /** 寶箱:底部中央座標。 */
  chests: readonly { x: number; bottom: number }[];
  /** 練習靶:底部中央座標(只有靶場有)。 */
  targets: readonly { x: number; bottom: number }[];
  trickles: readonly TrickleDef[];
  arenas: readonly ArenaDef[];
  boss: { lockScrollX: number; spawnX: number } | null;
  /** 背景場景:第一個從頭開始,之後依鏡頭位置淡入。 */
  scenes: readonly ScenePlan[];
}

export const WORLD_H = 540;
export const GROUND_Y = 480;

export function isLevelId(v: unknown): v is LevelId {
  return typeof v === 'string' && (LEVEL_IDS as readonly string[]).includes(v);
}

/** 網址參數;沒有或認不得時進 1-3 失眠森林(測試與舊連結沿用)。 */
export function parseLevelId(v: string | null): LevelId {
  return isLevelId(v) ? v : 'forest';
}
