import type { SpriteKey } from './sprites';

/**
 * 場景:一組三層背景(遠景、中景、近景)。
 * 世界 1:草原白天、河邊黃昏、深林晚上、貓頭鷹大樹深夜。
 * 世界 2:綠洲白天、沙丘商隊路黃昏、金字塔外晚上、人面獅身神殿深夜。
 * 世界 3:珊瑚礁淺海白天、沉船拱門黃昏、深海遺跡晚上、亞特蘭提斯神殿深夜。
 * 世界 4:雪原白天、結冰的湖黃昏、極光冰川晚上、雪怪冰洞深夜。
 * 世界 5:黑沙灘白天、火山森林黃昏、熔岩河晚上、火山口深夜。
 * 世界 6:河邊雨林白天、瀑布黃昏、樹冠晚上、叢林遺跡深夜。
 * 世界 7:金合歡草原白天、水塘黃昏、星空草原晚上、榮耀岩深夜。
 * 世界 8:高山草甸白天、雲海黃昏、吊橋山崖晚上、雷雲山頂深夜。
 */
export type SceneId = 'w1-s1' | 'w1-s2' | 'w1-s3' | 'w1-s4' | 'w2-s1' | 'w2-s2' | 'w2-s3' | 'w2-s4' | 'w3-s1' | 'w3-s2' | 'w3-s3' | 'w3-s4' | 'w4-s1' | 'w4-s2' | 'w4-s3' | 'w4-s4' | 'w5-s1' | 'w5-s2' | 'w5-s3' | 'w5-s4' | 'w6-s1' | 'w6-s2' | 'w6-s3' | 'w6-s4' | 'w7-s1' | 'w7-s2' | 'w7-s3' | 'w7-s4' | 'w8-s1' | 'w8-s2' | 'w8-s3' | 'w8-s4';

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
  'w4-s1': ['w4-s1-far', 'w4-s1-mid', 'w4-s1-near'],
  'w4-s2': ['w4-s2-far', 'w4-s2-mid', 'w4-s2-near'],
  'w4-s3': ['w4-s3-far', 'w4-s3-mid', 'w4-s3-near'],
  'w4-s4': ['w4-s4-far', 'w4-s4-mid', 'w4-s4-near'],
  'w5-s1': ['w5-s1-far', 'w5-s1-mid', 'w5-s1-near'],
  'w5-s2': ['w5-s2-far', 'w5-s2-mid', 'w5-s2-near'],
  'w5-s3': ['w5-s3-far', 'w5-s3-mid', 'w5-s3-near'],
  'w5-s4': ['w5-s4-far', 'w5-s4-mid', 'w5-s4-near'],
  'w6-s1': ['w6-s1-far', 'w6-s1-mid', 'w6-s1-near'],
  'w6-s2': ['w6-s2-far', 'w6-s2-mid', 'w6-s2-near'],
  'w6-s3': ['w6-s3-far', 'w6-s3-mid', 'w6-s3-near'],
  'w6-s4': ['w6-s4-far', 'w6-s4-mid', 'w6-s4-near'],
  'w7-s1': ['w7-s1-far', 'w7-s1-mid', 'w7-s1-near'],
  'w7-s2': ['w7-s2-far', 'w7-s2-mid', 'w7-s2-near'],
  'w7-s3': ['w7-s3-far', 'w7-s3-mid', 'w7-s3-near'],
  'w7-s4': ['w7-s4-far', 'w7-s4-mid', 'w7-s4-near'],
  'w8-s1': ['w8-s1-far', 'w8-s1-mid', 'w8-s1-near'],
  'w8-s2': ['w8-s2-far', 'w8-s2-mid', 'w8-s2-near'],
  'w8-s3': ['w8-s3-far', 'w8-s3-mid', 'w8-s3-near'],
  'w8-s4': ['w8-s4-far', 'w8-s4-mid', 'w8-s4-near'],
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
  'w4-s1': 'day',
  'w4-s2': 'dusk',
  'w4-s3': 'night',
  'w4-s4': 'night',
  'w5-s1': 'day',
  'w5-s2': 'dusk',
  'w5-s3': 'night',
  'w5-s4': 'night',
  'w6-s1': 'day',
  'w6-s2': 'dusk',
  'w6-s3': 'night',
  'w6-s4': 'night',
  'w7-s1': 'day',
  'w7-s2': 'dusk',
  'w7-s3': 'night',
  'w7-s4': 'night',
  'w8-s1': 'day',
  'w8-s2': 'dusk',
  'w8-s3': 'night',
  'w8-s4': 'night',
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
  // 雪地:白天亮白藍、黃昏粉紫、夜晚與冰洞深藍。
  'w4-s1': { ground: 0xc8d8f0, rim: 0xffffff, platform: 0xe0ecff },
  'w4-s2': { ground: 0xa890c0, rim: 0xffe0f0, platform: 0xd0c0e8 },
  'w4-s3': { ground: 0x3a4a8a, rim: 0xc0f0ff, platform: 0x8aa0d8 },
  'w4-s4': { ground: 0x2a2f60, rim: 0xa8e0ff, platform: 0x6a7ab8 },
  // 火山:黑沙灘白天深灰、黃昏暗紅、晚上與火山口深紫,邊緣都是熔岩橘。
  'w5-s1': { ground: 0x3a3440, rim: 0xf0a060, platform: 0x6a5a5a },
  'w5-s2': { ground: 0x4a3040, rim: 0xff9a6a, platform: 0x7a4a4a },
  'w5-s3': { ground: 0x2a1a2a, rim: 0xff7a40, platform: 0x5a3a4a },
  'w5-s4': { ground: 0x241626, rim: 0xff6a3a, platform: 0x4a2a3a },
  // 雨林:白天深綠、黃昏苔綠、晚上與遺跡深藍綠。
  'w6-s1': { ground: 0x4a6a3a, rim: 0x9fd86a, platform: 0x8a6a40 },
  'w6-s2': { ground: 0x5a5a3a, rim: 0xe0c070, platform: 0x7a5a3a },
  'w6-s3': { ground: 0x223a3a, rim: 0x7fd0a0, platform: 0x4a5a40 },
  'w6-s4': { ground: 0x1e2a30, rim: 0x8fc0a0, platform: 0x3a4a40 },
  // 草原:白天黃褐、黃昏橘紅土、晚上與榮耀岩深紫褐。
  'w7-s1': { ground: 0xb8904a, rim: 0xf0d080, platform: 0x8a6a4a },
  'w7-s2': { ground: 0x9a5a3a, rim: 0xf0a060, platform: 0x7a4a3a },
  'w7-s3': { ground: 0x3a2a4a, rim: 0xc0a0e0, platform: 0x5a4a6a },
  'w7-s4': { ground: 0x2a2236, rim: 0xd0a070, platform: 0x4a3a4a },
  // 高山:白天草綠、黃昏雲海粉紫、晚上山崖與雷雲深藍灰。
  'w8-s1': { ground: 0x6a8a5a, rim: 0xd0f0a0, platform: 0xf4f4fa },
  'w8-s2': { ground: 0x8a7a9a, rim: 0xffd8e8, platform: 0xf0e8f4 },
  'w8-s3': { ground: 0x3a3e5a, rim: 0xb0c0f0, platform: 0xc8d0e8 },
  'w8-s4': { ground: 0x2a2a44, rim: 0xffe070, platform: 0xb0b8d0 },
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
