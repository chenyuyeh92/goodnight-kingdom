import { FOREST } from './forest';
import { GRASSLAND } from './grassland';
import type { LevelDef, LevelId } from './levelDef';
import { RANGE } from './range';
import { RIVER } from './river';
import { OASIS } from './oasis';
import { DUNES } from './dunes';
import { PYRAMID } from './pyramid';
import { CORAL } from './coral';
import { SHIPWRECK } from './shipwreck';
import { RUINS } from './ruins';

export const LEVELS: Readonly<Record<LevelId, LevelDef>> = { range: RANGE, forest: FOREST, 'w1-1': GRASSLAND, 'w1-2': RIVER, 'w2-1': OASIS, 'w2-2': DUNES, 'w2-3': PYRAMID, 'w3-1': CORAL, 'w3-2': SHIPWRECK, 'w3-3': RUINS };
