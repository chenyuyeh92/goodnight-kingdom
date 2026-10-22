import type { LevelDef } from './levelDef';
import { FOREST } from './forest';

/** 1-1 森林入口的草原(白天)。暫時沿用森林的地圖,Task 6 換成正式內容。 */
export const GRASSLAND: LevelDef = { ...FOREST, id: 'w1-1', name: '森林入口的草原', scenes: [{ scene: 'w1-s1', fromScrollX: 0 }] };
