import { FOREST } from './forest';
import { GRASSLAND } from './grassland';
import type { LevelDef, LevelId } from './levelDef';
import { RANGE } from './range';
import { LAB } from './lab';
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
import { RIVER_FOREST } from './riverForest';
import { WATERFALL } from './waterfall';
import { CANOPY } from './canopy';
import { ACACIA } from './acacia';
import { WATERHOLE } from './waterhole';
import { PRIDE_ROCK } from './pride';
import { MEADOW } from './meadow';
import { CLOUD_SEA } from './cloudSea';
import { CLIFF_BRIDGE } from './cliffBridge';
import { MINE_ENTRANCE } from './mineEntrance';
import { CRYSTAL_CAVE } from './crystalCave';
import { UNDERGROUND_RIVER } from './undergroundRiver';
import { CASTLE_GARDEN } from './castleGarden';
import { CASTLE_WALL } from './castleWall';
import { CASTLE_HALL } from './castleHall';

export const LEVELS: Readonly<Record<LevelId, LevelDef>> = {
  range: RANGE,
  lab: LAB,
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
  'w6-1': RIVER_FOREST,
  'w6-2': WATERFALL,
  'w6-3': CANOPY,
  'w7-1': ACACIA,
  'w7-2': WATERHOLE,
  'w7-3': PRIDE_ROCK,
  'w8-1': MEADOW,
  'w8-2': CLOUD_SEA,
  'w8-3': CLIFF_BRIDGE,
  'w9-1': MINE_ENTRANCE,
  'w9-2': CRYSTAL_CAVE,
  'w9-3': UNDERGROUND_RIVER,
  'w10-1': CASTLE_GARDEN,
  'w10-2': CASTLE_WALL,
  'w10-3': CASTLE_HALL,
};
