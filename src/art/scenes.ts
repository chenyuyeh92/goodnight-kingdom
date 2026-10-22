import type { SpriteKey } from './sprites';

/**
 * 場景:一組三層背景(遠景、中景、近景)。
 * 世界 1:草原白天、河邊黃昏、深林晚上、貓頭鷹大樹深夜。
 * 世界 2:綠洲白天、沙丘商隊路黃昏、金字塔外晚上、人面獅身神殿深夜。
 * 世界 3:珊瑚礁淺海白天、沉船拱門黃昏、深海遺跡晚上、亞特蘭提斯神殿深夜。
 */
export type SceneId = 'w1-s1' | 'w1-s2' | 'w1-s3' | 'w1-s4' | 'w2-s1' | 'w2-s2' | 'w2-s3' | 'w2-s4' | 'w3-s1' | 'w3-s2' | 'w3-s3' | 'w3-s4';

export const SCENE_LAYERS: Record<SceneId, readonly [SpriteKey, SpriteKey, SpriteKey]> = {
  'w1-s1': ['w1-s1-far', 'w1-s1-mid', 'w1-s1-near'],
  'w1-s2': ['w1-s2-far', 'w1-s2-mid', 'w1-s2-near'],
  'w1-s3': ['bg-far', 'bg-mid', 'bg-near'],
  'w1-s4': ['w1-s4-far', 'w1-s4-mid', 'w1-s4-near'],
  'w2-s1': ['w2-s1-far', 'w2-s1-mid', 'w2-s1-near'],
  'w2-s2': ['w2-s2-far', 'w2-s2-mid', 'w2-s2-near'],
  'w2-s3': ['w2-s3-far', 'w2-s3-mid', 'w2-s3-near'],
  'w2-s4': ['w2-s4-far', 'w2-s4-mid', 'w2-s4-near'],
  'w3-s1': ['w3-s1-far', 'w3-s1-mid', 'w3-s1-near'],
  'w3-s2': ['w3-s2-far', 'w3-s2-mid', 'w3-s2-near'],
  'w3-s3': ['w3-s3-far', 'w3-s3-mid', 'w3-s3-near'],
  'w3-s4': ['w3-s4-far', 'w3-s4-mid', 'w3-s4-near'],
};

/** 場景的時段,決定配樂。 */
export const SCENE_TIME: Record<SceneId, 'day' | 'dusk' | 'night'> = {
  'w1-s1': 'day',
  'w1-s2': 'dusk',
  'w1-s3': 'night',
  'w1-s4': 'night',
  'w2-s1': 'day',
  'w2-s2': 'dusk',
  'w2-s3': 'night',
  'w2-s4': 'night',
  'w3-s1': 'day',
  'w3-s2': 'dusk',
  'w3-s3': 'night',
  'w3-s4': 'night',
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
  // 沙漠:白天淺沙、黃昏橘紫沙、夜晚藍紫沙與石磚。
  'w2-s1': { ground: 0xc98f5a, rim: 0xf6d6a0, platform: 0xa0703f },
  'w2-s2': { ground: 0x8a5a6a, rim: 0xf0a878, platform: 0x7a4f5a },
  'w2-s3': { ground: 0x4a4a8a, rim: 0xe8d4a0, platform: 0x6a5a9a },
  'w2-s4': { ground: 0x3a3570, rim: 0xc8b8f0, platform: 0x5a4f8f },
  // 海底:沙色海床、珊瑚紅岩石,越晚越深藍。
  'w3-s1': { ground: 0x6a8fa0, rim: 0xf0e0b0, platform: 0xd07a70 },
  'w3-s2': { ground: 0x5a5f8a, rim: 0xf0b890, platform: 0x8a6a5a },
  'w3-s3': { ground: 0x2f3a6a, rim: 0x7fd0e0, platform: 0x4a5a8f },
  'w3-s4': { ground: 0x26285a, rim: 0x9fe0f0, platform: 0x4a4a8a },
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
