import { FOREST } from './forest';
import { GRASSLAND } from './grassland';
import type { LevelDef, LevelId } from './levelDef';
import { RANGE } from './range';
import { RIVER } from './river';

export const LEVELS: Readonly<Record<LevelId, LevelDef>> = { range: RANGE, forest: FOREST, 'w1-1': GRASSLAND, 'w1-2': RIVER };
