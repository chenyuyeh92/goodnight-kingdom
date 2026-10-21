import { FOREST } from './forest';
import type { LevelDef, LevelId } from './levelDef';
import { RANGE } from './range';

export const LEVELS: Readonly<Record<LevelId, LevelDef>> = { range: RANGE, forest: FOREST };
