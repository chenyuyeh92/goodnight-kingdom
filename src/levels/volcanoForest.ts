import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 5-2「火山森林」(黃昏):熔岩比較多,有要踩岩石平台才過得去的寬熔岩,兩個噴發區。
 * 四種魔物都會出現。結尾打小頭目熬夜火山蝸牛。一局約 4–5 分鐘。
 */
export const VOLCANO_FOREST: LevelDef = {
  id: 'w5-2',
  name: { zh: '火山森林', en: 'Volcano Forest' },
  world: 5,
  worldW: 10200,
  platformArt: 'rock-platform',
  terrain: [
    // 1 森林入口
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 焦黑的樹林
    { x: 2240, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 老樹:通往高處寶箱的岩石平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 熔岩裂縫
    { x: 6900, y: 380, w: 120, h: 20 },
    // 5 森林出口
    { x: 8900, y: 380, w: 140, h: 20 },
    // 熔岩上的岩石平台
    { x: 5260, y: 400, w: 110, h: 20 },
    { x: 8455, y: 400, w: 100, h: 20 },
    // 地形重排(2026-10-24):後段
    { x: 7080, y: 300, w: 100, h: 20 },
    { x: 7830, y: 250, w: 140, h: 20 },
    { x: 7230, y: 260, w: 100, h: 20 },
    { x: 2110, y: 230, w: 140, h: 20 },
    { x: 5960, y: 230, w: 120, h: 20 },
    { x: 2840, y: 250, w: 140, h: 20 },
    { x: 6350, y: 380, w: 140, h: 20 },
    { x: 3700, y: 380, w: 120, h: 20 },
    { x: 8720, y: 300, w: 120, h: 20 },
    { x: 560, y: 260, w: 100, h: 20 },
  ],
  lava: [
    { x: 450, w: 100 },
    { x: 1050, w: 330 },
    { x: 3500, w: 110 },
    { x: 4200, w: 100 },
    { x: 5150, w: 330 },
    { x: 7250, w: 100 },
    { x: 8350, w: 310 },
  ],
  eruptions: [
    { x: 4300, w: 700 },
    { x: 8100, w: 800 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 7460, y: 240, w: 90, h: 20 },
    { x: 7590, y: 240, w: 90, h: 20 },
    { x: 7720, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 1090, y: 400, w: 100, dx: 150, dy: 0, periodMs: 3600 },
    { x: 3000, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2000 }, { x: 5850 }],
  thorns: [],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 9400, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到)
    { x: 5570, bottom: GROUND_Y },
    { x: 2950, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7990, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 森林入口
    ...wave(200, [['salamander', 'right', 2]]),
    ...wave(450, [['lavaBlob', 'right', 1], ['volcanoBird', 'right', 1]]),
    ...wave(700, [['salamander', 'right', 2]]),
    ...wave(950, [['volcanoBird', 'right', 1]]),
    ...wave(1150, [['lavaBlob', 'right', 1], ['salamander', 'left', 1]]),
    ...wave(1350, [['salamander', 'right', 2]]),
    ...wave(1600, [['volcanoBird', 'right', 1], ['lavaBlob', 'right', 1]]),
    // 2 焦黑的樹林
    ...wave(1850, [['salamander', 'right', 3]]),
    ...wave(2100, [['armadillo', 'right', 1]]),
    ...wave(2300, [['volcanoBird', 'right', 2]]),
    ...wave(3450, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(3700, [['volcanoBird', 'right', 2]]),
    // 3 老樹
    ...wave(3950, [['armadillo', 'right', 1]]),
    ...wave(4200, [['salamander', 'right', 2], ['volcanoBird', 'right', 1]]),
    ...wave(4450, [['lavaBlob', 'right', 2]]),
    ...wave(4700, [['volcanoBird', 'right', 2]]),
    ...wave(4950, [['armadillo', 'right', 1], ['salamander', 'left', 1]]),
    ...wave(5200, [['salamander', 'right', 3]]),
    // 4 熔岩裂縫
    ...wave(5450, [['volcanoBird', 'right', 1], ['lavaBlob', 'right', 1]]),
    ...wave(5700, [['salamander', 'right', 2]]),
    ...wave(5950, [['lavaBlob', 'left', 1], ['salamander', 'right', 1]]),
    ...wave(6100, [['volcanoBird', 'right', 1]]),
    // 5 森林出口(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['armadillo', 'right', 1], ['salamander', 'left', 1]]),
    ...wave(7450, [['volcanoBird', 'right', 2]]),
    ...wave(7650, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(7850, [['salamander', 'right', 2]]),
    ...wave(7950, [['volcanoBird', 'right', 1]]),
    ...wave(8150, [['lavaBlob', 'right', 1], ['volcanoBird', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'salamander', from: 'right', delayMs: 0 },
          { type: 'volcanoBird', from: 'right', delayMs: 500 },
          { type: 'lavaBlob', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'armadillo', from: 'right', delayMs: 0 },
          { type: 'salamander', from: 'left', delayMs: 600 },
          { type: 'volcanoBird', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'armadillo', from: 'right', delayMs: 0 },
          { type: 'volcanoBird', from: 'right', delayMs: 400 },
          { type: 'salamander', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'lavaBlob', from: 'right', delayMs: 0 },
          { type: 'volcanoBird', from: 'left', delayMs: 300 },
          { type: 'salamander', from: 'right', delayMs: 700 },
          { type: 'armadillo', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'snail', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w5-s2', fromScrollX: 0 }],
};
