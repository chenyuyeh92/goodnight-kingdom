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
import { SNOWFIELD } from './snowfield';
import { FROZEN_LAKE } from './frozenLake';
import { GLACIER } from './glacier';
import { BLACK_SAND } from './blackSand';
import { VOLCANO_FOREST } from './volcanoForest';
import { LAVA_RIVER } from './lavaRiver';

export const LEVELS: Readonly<Record<LevelId, LevelDef>> = {
  range: RANGE,
  forest: FOREST,
  'w1-1': GRASSLAND,
  'w1-2': RIVER,
  'w2-1': OASIS,
  'w2-2': DUNES,
  'w2-3': PYRAMID,
  'w3-1': CORAL,
  'w3-2': SHIPWRECK,
  'w3-3': RUINS,
  'w4-1': SNOWFIELD,
  'w4-2': FROZEN_LAKE,
  'w4-3': GLACIER,
  'w5-1': BLACK_SAND,
  'w5-2': VOLCANO_FOREST,
  'w5-3': LAVA_RIVER,
};
