import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 8-3「吊橋山崖」(晚上)→ 雷雲山頂(深夜):雲海和強風都有。
 * 四種魔物都會出現。結尾打世界關主熬夜雷鳥(在天上飛,往上射或站上雲朵平台射)。一局約 4–5 分鐘。
 */
export const CLIFF_BRIDGE: LevelDef = {
  id: 'w8-3',
  name: '吊橋山崖',
  world: 8,
  worldW: 10200,
  platformArt: 'cloud-platform',
  terrain: [
    // 1 山崖入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 吊橋
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2290, y: 340, w: 90, h: 20 },
    { x: 3960, y: 380, w: 120, h: 20 },
    // 3 岩洞:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 星空下
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 雷雲山頂
    { x: 8600, y: 380, w: 180, h: 20 },
    { x: 1000, y: 400, w: 100, h: 20 }, // 雲海上的雲朵平台
    { x: 8290, y: 400, w: 100, h: 20 },
    { x: 9400, y: 340, w: 120, h: 20 }, // 往上射雷鳥時可以站上去
    { x: 9720, y: 340, w: 120, h: 20 },
    // 地形重排(2026-10-24):後段;雲海上的移動平台
    { x: 7680, y: 270, w: 120, h: 20 },
    { x: 2990, y: 240, w: 100, h: 20 },
    { x: 5930, y: 230, w: 120, h: 20 },
    { x: 3460, y: 250, w: 100, h: 20 },
    { x: 6750, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 100, h: 20 },
    { x: 4100, y: 300, w: 100, h: 20 },
    { x: 2500, y: 300, w: 120, h: 20 },
  ],
  // 強風區:風一陣一陣往左吹(不在雲海旁邊)。
  winds: [
    { x: 2050, w: 500 },
    { x: 3700, w: 1100 },
    { x: 6100, w: 450 },
    { x: 7600, w: 450 },
  ],
  // 雲海:掉下去扣一顆愛心、從邊上重新出來;寬的中間有雲朵平台可以踩。
  gapStyle: 'cloud',
  water: {
    shallow: [],
    gaps: [
      { x: 900, w: 300 },
      { x: 1800, w: 100 },
      { x: 4950, w: 320 },
      { x: 5850, w: 100 },
      { x: 8200, w: 280 },
    ],
    pads: [],
  },
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 7120, y: 260, w: 80, h: 20 },
    { x: 7240, y: 260, w: 80, h: 20 },
    { x: 7360, y: 260, w: 80, h: 20 },
  ],
  movers: [
    { x: 4990, y: 400, w: 100, dx: 140, dy: 0, periodMs: 3600 },
    { x: 3300, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2880 }, { x: 5820 }],
  thorns: [],
  checkpoints: [150, 2400, 3880, 6250, 8100, 9050],
  chests: [
    { x: 6000, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 山崖入口
    ...wave(200, [['pika', 'right', 1], ['coffeeCloud', 'right', 1]]),
    ...wave(450, [['eagle', 'right', 1]]),
    ...wave(700, [['pika', 'right', 2]]),
    ...wave(950, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(1200, [['eagle', 'right', 2]]),
    ...wave(1450, [['yak', 'right', 1]]),
    // 2 吊橋
    ...wave(1700, [['pika', 'right', 2], ['coffeeCloud', 'left', 1]]),
    ...wave(1950, [['eagle', 'right', 1], ['pika', 'right', 1]]),
    ...wave(2200, [['coffeeCloud', 'right', 2]]),
    ...wave(2450, [['eagle', 'right', 1]]),
    ...wave(3650, [['yak', 'right', 1], ['pika', 'right', 1]]),
    // 3 岩洞
    ...wave(3900, [['coffeeCloud', 'right', 2], ['eagle', 'right', 1]]),
    ...wave(4150, [['pika', 'left', 1], ['pika', 'right', 2]]),
    ...wave(4400, [['yak', 'right', 1], ['eagle', 'right', 1]]),
    ...wave(4650, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(4900, [['eagle', 'right', 2]]),
    ...wave(5150, [['pika', 'right', 2], ['coffeeCloud', 'left', 1]]),
    // 4 星空下
    ...wave(5400, [['yak', 'right', 1], ['eagle', 'right', 1]]),
    ...wave(5650, [['coffeeCloud', 'right', 2]]),
    ...wave(5900, [['pika', 'right', 2], ['eagle', 'left', 1]]),
    ...wave(6150, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(6400, [['eagle', 'right', 2]]),
    // 5 雷雲山頂(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['pika', 'right', 1]]),
    ...wave(7600, [['yak', 'right', 1], ['coffeeCloud', 'left', 1]]),
    ...wave(7750, [['eagle', 'right', 2]]),
    ...wave(7900, [['pika', 'right', 2]]),
    ...wave(8000, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(8150, [['eagle', 'right', 1], ['pika', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'pika', from: 'right', delayMs: 0 },
          { type: 'eagle', from: 'right', delayMs: 500 },
          { type: 'coffeeCloud', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'yak', from: 'right', delayMs: 0 },
          { type: 'coffeeCloud', from: 'top', x: 3100, delayMs: 400 },
          { type: 'eagle', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'yak', from: 'right', delayMs: 0 },
          { type: 'yak', from: 'left', delayMs: 600 },
          { type: 'eagle', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'pika', from: 'top', x: 7100, delayMs: 0 },
          { type: 'eagle', from: 'right', delayMs: 300 },
          { type: 'coffeeCloud', from: 'left', delayMs: 600 },
          { type: 'pika', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'thunderbird', lockScrollX: 9240, spawnX: 10000 },
  scenes: [
    { scene: 'w8-s3', fromScrollX: 0 },
    { scene: 'w8-s4', fromScrollX: 8400 },
  ],
};
