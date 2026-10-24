import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 5-3「熔岩河」(晚上)→ 火山口(深夜):熔岩最多、噴發區最多。
 * 四種魔物都會出現。結尾打世界關主熬夜火龍。一局約 4–5 分鐘。
 */
export const LAVA_RIVER: LevelDef = {
  id: 'w5-3',
  name: '熔岩河',
  world: 5,
  worldW: 10200,
  platformArt: 'rock-platform',
  terrain: [
    // 1 河岸
    // 2 冒泡的熔岩
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2230, y: 340, w: 140, h: 20 },
    { x: 3960, y: 380, w: 120, h: 20 },
    // 3 石橋:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 火山腳下
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 熔岩上的岩石平台
    { x: 1160, y: 400, w: 110, h: 20 },
    { x: 8410, y: 400, w: 100, h: 20 },
    // 地形重排(2026-10-24):前段
    { x: 910, y: 240, w: 140, h: 20 },
    { x: 1110, y: 230, w: 120, h: 20 },
    { x: 1290, y: 240, w: 100, h: 20 },
    { x: 1880, y: 230, w: 120, h: 20 },
    { x: 6220, y: 230, w: 140, h: 20 },
    { x: 7080, y: 250, w: 140, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 2950, y: 300, w: 120, h: 20 },
    { x: 6700, y: 380, w: 140, h: 20 },
    { x: 3450, y: 380, w: 120, h: 20 },
    { x: 4100, y: 260, w: 100, h: 20 },
    { x: 9120, y: 380, w: 100, h: 20 },
  ],
  lava: [
    { x: 350, w: 100 },
    { x: 1050, w: 330 },
    { x: 1850, w: 100 },
    { x: 3700, w: 110 },
    { x: 4200, w: 100 },
    { x: 5150, w: 330 },
    { x: 5900, w: 100 },
    { x: 7850, w: 100 },
    { x: 8300, w: 320 },
    { x: 8800, w: 100 },
  ],
  eruptions: [
    { x: 1300, w: 900 },
    { x: 4250, w: 850 },
    { x: 8300, w: 550 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 2060, y: 240, w: 90, h: 20 },
    { x: 2210, y: 240, w: 90, h: 20 },
    { x: 2360, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 5190, y: 400, w: 100, dx: 150, dy: 0, periodMs: 3600 },
    { x: 7250, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 800 }, { x: 6100 }],
  thorns: [],
  checkpoints: [150, 2400, 3880, 6250, 8100, 9050],
  chests: [
    { x: 9400, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到)
    { x: 5800, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 河岸
    ...wave(200, [['salamander', 'right', 1], ['lavaBlob', 'right', 1]]),
    ...wave(450, [['volcanoBird', 'right', 1]]),
    ...wave(700, [['salamander', 'right', 2]]),
    ...wave(950, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(1200, [['volcanoBird', 'right', 2]]),
    ...wave(1450, [['armadillo', 'right', 1]]),
    // 2 冒泡的熔岩
    ...wave(1700, [['salamander', 'right', 2], ['lavaBlob', 'left', 1]]),
    ...wave(1950, [['volcanoBird', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(2200, [['lavaBlob', 'right', 2]]),
    ...wave(2450, [['volcanoBird', 'right', 1]]),
    ...wave(3650, [['armadillo', 'right', 1], ['salamander', 'right', 1]]),
    // 3 石橋
    ...wave(3900, [['lavaBlob', 'right', 2], ['volcanoBird', 'right', 1]]),
    ...wave(4150, [['salamander', 'left', 1], ['salamander', 'right', 2]]),
    ...wave(4400, [['armadillo', 'right', 1], ['volcanoBird', 'right', 1]]),
    ...wave(4650, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(4900, [['volcanoBird', 'right', 2]]),
    ...wave(5150, [['salamander', 'right', 2], ['lavaBlob', 'left', 1]]),
    // 4 火山腳下
    ...wave(5400, [['armadillo', 'right', 1], ['volcanoBird', 'right', 1]]),
    ...wave(5650, [['lavaBlob', 'right', 2]]),
    ...wave(5900, [['salamander', 'right', 2], ['volcanoBird', 'left', 1]]),
    ...wave(6150, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(6400, [['volcanoBird', 'right', 2]]),
    // 5 火山口入口(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['salamander', 'right', 1]]),
    ...wave(7600, [['armadillo', 'right', 1], ['lavaBlob', 'left', 1]]),
    ...wave(7750, [['volcanoBird', 'right', 2]]),
    ...wave(7900, [['salamander', 'right', 2]]),
    ...wave(8000, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(8150, [['volcanoBird', 'right', 1], ['salamander', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'salamander', from: 'right', delayMs: 0 },
          { type: 'volcanoBird', from: 'right', delayMs: 500 },
          { type: 'lavaBlob', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'armadillo', from: 'right', delayMs: 0 },
          { type: 'lavaBlob', from: 'top', x: 3100, delayMs: 400 },
          { type: 'volcanoBird', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'armadillo', from: 'right', delayMs: 0 },
          { type: 'armadillo', from: 'left', delayMs: 600 },
          { type: 'volcanoBird', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'salamander', from: 'top', x: 7100, delayMs: 0 },
          { type: 'volcanoBird', from: 'right', delayMs: 300 },
          { type: 'lavaBlob', from: 'left', delayMs: 600 },
          { type: 'salamander', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'dragon', lockScrollX: 9240, spawnX: 10080 },
  scenes: [
    { scene: 'w5-s3', fromScrollX: 0 },
    { scene: 'w5-s4', fromScrollX: 8400 },
  ],
};
