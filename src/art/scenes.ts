import type { SpriteKey } from './sprites';

/** 場景:一組三層背景(遠景、中景、近景)。世界 1:草原白天、河邊黃昏、深林晚上、貓頭鷹大樹深夜。 */
export type SceneId = 'w1-s1' | 'w1-s2' | 'w1-s3' | 'w1-s4';

export const SCENE_LAYERS: Record<SceneId, readonly [SpriteKey, SpriteKey, SpriteKey]> = {
  'w1-s1': ['w1-s1-far', 'w1-s1-mid', 'w1-s1-near'],
  'w1-s2': ['w1-s2-far', 'w1-s2-mid', 'w1-s2-near'],
  'w1-s3': ['bg-far', 'bg-mid', 'bg-near'],
  'w1-s4': ['w1-s4-far', 'w1-s4-mid', 'w1-s4-near'],
};

/** 地面與平台的配色,配合場景的時段(白天草地、黃昏泥土、夜晚深紫)。 */
export interface TerrainPalette {
  ground: number;
  rim: number;
  platform: number;
}

export const SCENE_PALETTE: Record<SceneId, TerrainPalette> = {
  'w1-s1': { ground: 0x5b7f3e, rim: 0xa6d36b, platform: 0x8a6440 },
  'w1-s2': { ground: 0x5e4a5c, rim: 0xe6a07a, platform: 0x7a5640 },
  'w1-s3': { ground: 0x2b2a6b, rim: 0x9d8fe0, platform: 0x5a4a8f },
  'w1-s4': { ground: 0x23224f, rim: 0x7fb4ff, platform: 0x4a3f7f },
};

/** 三層的捲動速度(相對鏡頭)。 */
export const LAYER_FACTORS = [0.1, 0.35, 0.7] as const;

export interface ScenePlan {
  scene: SceneId;
  /** 鏡頭走到這裡開始淡入這個場景。 */
  fromScrollX: number;
}

/** 換場淡入花的鏡頭距離。 */
export const SCENE_FADE = 600;

export interface Blend {
  from: SceneId;
  to: SceneId | null;
  /** 下一個場景的淡入程度 0–1。 */
  t: number;
}

/** 依鏡頭位置決定畫哪個場景;換場時依距離淡入(位置決定,不靠時間,重來也一致)。 */
export function sceneBlend(plan: readonly ScenePlan[], scrollX: number): Blend {
  let current = plan[0].scene;
  for (let i = 1; i < plan.length; i++) {
    const p = plan[i];
    if (scrollX >= p.fromScrollX + SCENE_FADE) {
      current = p.scene;
      continue;
    }
    if (scrollX >= p.fromScrollX) return { from: current, to: p.scene, t: (scrollX - p.fromScrollX) / SCENE_FADE };
    break;
  }
  return { from: current, to: null, t: 0 };
}

/** 一層要排幾張圖才蓋得滿畫面(捲動時多一張)。 */
export function tileCount(w: number, viewW = 960): number {
  return Math.ceil(viewW / w) + 1;
}

export function sceneKeys(scenes: readonly SceneId[]): SpriteKey[] {
  return scenes.flatMap((s) => [...SCENE_LAYERS[s]]);
}
