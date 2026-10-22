import type { LevelDef } from './levelDef';
import { FOREST } from './forest';

/** 1-2 河邊(黃昏)。暫時沿用森林的地圖,Task 7 換成正式內容。 */
export const RIVER: LevelDef = { ...FOREST, id: 'w1-2', name: '河邊', scenes: [{ scene: 'w1-s2', fromScrollX: 0 }] };
