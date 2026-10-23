import type { LevelDef } from './levelDef';

/** 機關測試場(只給自動測試用,不在選關裡):移動平台(左右、上下)、彈跳墊、會掉的平台。 */
export const LAB: LevelDef = {
  id: 'lab',
  name: '機關測試場',
  world: 1,
  worldW: 3000,
  terrain: [],
  movers: [
    { x: 400, y: 380, w: 140, dx: 300, dy: 0, periodMs: 4000 },
    { x: 1100, y: 400, w: 140, dx: 0, dy: -160, periodMs: 4000 },
  ],
  springs: [{ x: 1600 }],
  crumbles: [{ x: 2000, y: 400, w: 100, h: 20 }],
  thorns: [],
  checkpoints: [150],
  chests: [],
  targets: [],
  trickles: [],
  arenas: [],
  boss: null,
  scenes: [{ scene: 'w1-s3', fromScrollX: 0 }],
};
