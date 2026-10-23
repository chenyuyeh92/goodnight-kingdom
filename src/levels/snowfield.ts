import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 4-1「雪原」(白天):第一次踩到很滑的冰面(告示牌教),也有幾根會掉下來的冰柱。
 * 魔物以熬夜企鵝、咖啡雪人精靈為主,後段吵鬧海鸚登場;結尾打小頭目失眠北極熊。一局約 4–5 分鐘。
 */
export const SNOWFIELD: LevelDef = {
  id: 'w4-1',
  name: '雪原',
  world: 4,
  worldW: 10200,
  platformArt: 'snow-platform',
  terrain: [
    // 1 雪原入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 雪丘
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 雪屋:通往高處寶箱的雪堆
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 冰凍小溪
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 雪原盡頭
    { x: 8600, y: 380, w: 180, h: 20 },
    // 地形重排(2026-10-24):後段:戰鬥區 B 之後爬上雪堆,會掉的冰塊
    { x: 7680, y: 270, w: 120, h: 20 },
    { x: 8360, y: 240, w: 140, h: 20 },
    { x: 2060, y: 230, w: 120, h: 20 },
    { x: 5540, y: 220, w: 140, h: 20 },
    { x: 5100, y: 250, w: 140, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 6700, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 120, h: 20 },
    { x: 1300, y: 300, w: 120, h: 20 },
    { x: 4100, y: 300, w: 100, h: 20 },
  ],
  ice: [
    { x: 1050, w: 300 },
    { x: 3300, w: 350 },
    { x: 5900, w: 450 },
    { x: 7700, w: 350 },
  ],
  icicles: [1800, 4250, 6500, 8300],
  // 冰刺(碰到扣愛心)。
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 7850, y: 260, w: 90, h: 20 },
    { x: 8000, y: 260, w: 90, h: 20 },
    { x: 8140, y: 260, w: 90, h: 20 },
  ],
  movers: [
    { x: 3250, y: 380, w: 120, dx: 250, dy: 0, periodMs: 4200 },
    { x: 4950, y: 400, w: 120, dx: 0, dy: -160, periodMs: 4000 },
  ],
  springs: [{ x: 2000 }, { x: 5500 }],
  thorns: [
    { x: 1400, w: 60 },
    { x: 3750, w: 60 },
    { x: 6450, w: 80 },
    { x: 8900, w: 60 },
  ],
  checkpoints: [150, 2100, 4060, 5800, 8100, 9100],
  chests: [
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 900, kind: 'ice' },
    { x: 1650, kind: 'icicle' },
  ],
  trickles: [
    // 1 雪原入口
    ...wave(200, [['penguin', 'right', 1]]),
    ...wave(450, [['penguin', 'right', 2]]),
    ...wave(700, [['snowman', 'right', 1]]),
    ...wave(950, [['penguin', 'right', 1], ['snowman', 'right', 1]]),
    ...wave(1250, [['penguin', 'left', 1]]),
    ...wave(1500, [['snowman', 'right', 2]]),
    // 2 雪丘
    ...wave(1800, [['penguin', 'right', 2]]),
    ...wave(2050, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(2300, [['penguin', 'right', 2]]),
    ...wave(2450, [['snowman', 'right', 1]]),
    ...wave(3450, [['penguin', 'right', 1]]),
    // 3 雪屋
    ...wave(3650, [['walrus', 'right', 1]]),
    ...wave(3900, [['penguin', 'right', 2], ['snowman', 'left', 1]]),
    ...wave(4150, [['puffin', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(4400, [['snowman', 'right', 2]]),
    ...wave(4650, [['walrus', 'right', 1], ['penguin', 'left', 1]]),
    ...wave(4900, [['puffin', 'right', 1]]),
    ...wave(5150, [['penguin', 'right', 3]]),
    // 4 冰凍小溪
    ...wave(5400, [['puffin', 'right', 1], ['snowman', 'right', 1]]),
    ...wave(5650, [['penguin', 'right', 2]]),
    ...wave(5900, [['snowman', 'left', 1], ['penguin', 'right', 1]]),
    ...wave(6150, [['puffin', 'right', 2]]),
    // 5 雪原盡頭(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['penguin', 'right', 2]]),
    ...wave(7700, [['puffin', 'right', 1], ['snowman', 'right', 1]]),
    ...wave(7850, [['walrus', 'right', 1]]),
    ...wave(7950, [['penguin', 'right', 1], ['snowman', 'left', 1]]),
    ...wave(8080, [['penguin', 'right', 2]]),
    ...wave(8200, [['puffin', 'right', 1], ['penguin', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'penguin', from: 'right', delayMs: 0 },
          { type: 'snowman', from: 'right', delayMs: 600 },
          { type: 'penguin', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'snowman', from: 'top', x: 3100, delayMs: 0 },
          { type: 'puffin', from: 'right', delayMs: 400 },
          { type: 'penguin', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'puffin', from: 'right', delayMs: 0 },
          { type: 'penguin', from: 'right', delayMs: 400 },
          { type: 'snowman', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'walrus', from: 'right', delayMs: 0 },
          { type: 'puffin', from: 'left', delayMs: 300 },
          { type: 'penguin', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'polarBear', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w4-s1', fromScrollX: 0 }],
};
