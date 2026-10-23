import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 4-2「結冰的湖」(黃昏):大片很滑的冰面,要算好什麼時候放開;雪堆平台上比較好站穩。
 * 海鸚從天上俯衝,海象用冰盾擋子彈。結尾打小頭目熬夜獨角鯨。一局約 4–5 分鐘。
 */
export const FROZEN_LAKE: LevelDef = {
  id: 'w4-2',
  name: '結冰的湖',
  world: 4,
  worldW: 10200,
  platformArt: 'snow-platform',
  terrain: [
    // 1 湖岸
    { x: 600, y: 380, w: 260, h: 20 },
    { x: 1000, y: 300, w: 120, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 湖面
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 冰上小屋:通往高處寶箱的雪堆
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 冰裂縫
    { x: 6940, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 湖的另一岸
    { x: 8900, y: 380, w: 140, h: 20 },
    // 地形重排(2026-10-24):前段
    { x: 1920, y: 230, w: 140, h: 20 },
    { x: 5960, y: 230, w: 120, h: 20 },
    { x: 8300, y: 250, w: 140, h: 20 },
    { x: 6350, y: 380, w: 140, h: 20 },
    { x: 6550, y: 300, w: 120, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 3000, y: 300, w: 120, h: 20 },
    { x: 1300, y: 380, w: 120, h: 20 },
    { x: 7200, y: 380, w: 120, h: 20 },
  ],
  ice: [
    { x: 400, w: 250 },
    { x: 1200, w: 350 },
    { x: 2300, w: 600 },
    { x: 3300, w: 500 },
    { x: 4900, w: 600 },
    { x: 6100, w: 700 },
    { x: 7400, w: 400 },
    { x: 8300, w: 600 },
  ],
  icicles: [2600, 5200, 8600],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 2110, y: 240, w: 90, h: 20 },
    { x: 2250, y: 240, w: 90, h: 20 },
    { x: 2390, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 3450, y: 380, w: 120, dx: 250, dy: 0, periodMs: 4200 },
    { x: 8140, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1830 }, { x: 5850 }],
  thorns: [
    { x: 1000, w: 60 },
    { x: 3900, w: 60 },
    { x: 6850, w: 60 },
    { x: 8050, w: 60 },
  ],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 5950, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 湖岸
    ...wave(200, [['penguin', 'right', 2]]),
    ...wave(450, [['snowman', 'right', 1], ['puffin', 'right', 1]]),
    ...wave(700, [['penguin', 'right', 2]]),
    ...wave(950, [['puffin', 'right', 1]]),
    ...wave(1150, [['snowman', 'right', 1], ['penguin', 'left', 1]]),
    ...wave(1350, [['penguin', 'right', 2]]),
    ...wave(1600, [['puffin', 'right', 1], ['snowman', 'right', 1]]),
    // 2 湖面
    ...wave(1850, [['penguin', 'right', 3]]),
    ...wave(2100, [['walrus', 'right', 1]]),
    ...wave(2300, [['puffin', 'right', 2]]),
    ...wave(3450, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(3700, [['puffin', 'right', 2]]),
    // 3 冰上小屋
    ...wave(3950, [['walrus', 'right', 1]]),
    ...wave(4200, [['penguin', 'right', 2], ['puffin', 'right', 1]]),
    ...wave(4450, [['snowman', 'right', 2]]),
    ...wave(4700, [['puffin', 'right', 2]]),
    ...wave(4950, [['walrus', 'right', 1], ['penguin', 'left', 1]]),
    ...wave(5200, [['penguin', 'right', 3]]),
    // 4 冰裂縫
    ...wave(5450, [['puffin', 'right', 1], ['snowman', 'right', 1]]),
    ...wave(5700, [['penguin', 'right', 2]]),
    ...wave(5950, [['snowman', 'left', 1], ['penguin', 'right', 1]]),
    ...wave(6100, [['puffin', 'right', 1]]),
    // 5 湖的另一岸(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['walrus', 'right', 1], ['penguin', 'left', 1]]),
    ...wave(7450, [['puffin', 'right', 2]]),
    ...wave(7650, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(7850, [['penguin', 'right', 2]]),
    ...wave(7950, [['puffin', 'right', 1]]),
    ...wave(8150, [['snowman', 'right', 1], ['puffin', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'penguin', from: 'right', delayMs: 0 },
          { type: 'puffin', from: 'right', delayMs: 500 },
          { type: 'snowman', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'walrus', from: 'right', delayMs: 0 },
          { type: 'penguin', from: 'left', delayMs: 600 },
          { type: 'puffin', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'walrus', from: 'right', delayMs: 0 },
          { type: 'puffin', from: 'right', delayMs: 400 },
          { type: 'penguin', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'snowman', from: 'right', delayMs: 0 },
          { type: 'puffin', from: 'left', delayMs: 300 },
          { type: 'penguin', from: 'right', delayMs: 700 },
          { type: 'walrus', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'narwhal', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w4-s2', fromScrollX: 0 }],
};
