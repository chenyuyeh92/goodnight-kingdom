import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 4-3「極光冰川」(晚上)→ 雪怪冰洞(深夜):冰柱很多,走近就會掉下來,也有冰面。
 * 四種魔物都會出現。結尾打世界關主失眠雪怪。一局約 4–5 分鐘。
 */
export const GLACIER: LevelDef = {
  id: 'w4-3',
  name: '極光冰川',
  world: 4,
  worldW: 10200,
  platformArt: 'snow-platform',
  terrain: [
    // 1 冰川入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 冰塔
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 冰橋:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 極光下
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 冰洞入口
    { x: 8600, y: 380, w: 180, h: 20 },
  ],
  ice: [
    { x: 1000, w: 300 },
    { x: 3300, w: 400 },
    { x: 5000, w: 500 },
    { x: 7700, w: 300 },
  ],
  icicles: [700, 1250, 1900, 2620, 3550, 4300, 5200, 5800, 6480, 7350, 7900, 8400],
  thorns: [
    { x: 1350, w: 60 },
    { x: 3750, w: 60 },
    { x: 6450, w: 80 },
    { x: 8480, w: 60 },
  ],
  checkpoints: [150, 2400, 3980, 6250, 8100, 9050],
  chests: [
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 冰川入口
    ...wave(200, [['penguin', 'right', 1], ['snowman', 'right', 1]]),
    ...wave(450, [['puffin', 'right', 1]]),
    ...wave(700, [['penguin', 'right', 2]]),
    ...wave(950, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(1200, [['puffin', 'right', 2]]),
    ...wave(1450, [['walrus', 'right', 1]]),
    // 2 冰塔
    ...wave(1700, [['penguin', 'right', 2], ['snowman', 'left', 1]]),
    ...wave(1950, [['puffin', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(2200, [['snowman', 'right', 2]]),
    ...wave(2450, [['puffin', 'right', 1]]),
    ...wave(3650, [['walrus', 'right', 1], ['penguin', 'right', 1]]),
    // 3 冰橋
    ...wave(3900, [['snowman', 'right', 2], ['puffin', 'right', 1]]),
    ...wave(4150, [['penguin', 'left', 1], ['penguin', 'right', 2]]),
    ...wave(4400, [['walrus', 'right', 1], ['puffin', 'right', 1]]),
    ...wave(4650, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(4900, [['puffin', 'right', 2]]),
    ...wave(5150, [['penguin', 'right', 2], ['snowman', 'left', 1]]),
    // 4 極光下
    ...wave(5400, [['walrus', 'right', 1], ['puffin', 'right', 1]]),
    ...wave(5650, [['snowman', 'right', 2]]),
    ...wave(5900, [['penguin', 'right', 2], ['puffin', 'left', 1]]),
    ...wave(6150, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(6400, [['puffin', 'right', 2]]),
    // 5 冰洞入口(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['penguin', 'right', 1]]),
    ...wave(7600, [['walrus', 'right', 1], ['snowman', 'left', 1]]),
    ...wave(7750, [['puffin', 'right', 2]]),
    ...wave(7900, [['penguin', 'right', 2]]),
    ...wave(8000, [['snowman', 'right', 1], ['penguin', 'right', 1]]),
    ...wave(8150, [['puffin', 'right', 1], ['penguin', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'penguin', from: 'right', delayMs: 0 },
          { type: 'puffin', from: 'right', delayMs: 500 },
          { type: 'snowman', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'walrus', from: 'right', delayMs: 0 },
          { type: 'snowman', from: 'top', x: 3100, delayMs: 400 },
          { type: 'puffin', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'walrus', from: 'right', delayMs: 0 },
          { type: 'walrus', from: 'left', delayMs: 600 },
          { type: 'puffin', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'penguin', from: 'top', x: 7100, delayMs: 0 },
          { type: 'puffin', from: 'right', delayMs: 300 },
          { type: 'snowman', from: 'left', delayMs: 600 },
          { type: 'penguin', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'yeti', lockScrollX: 9240, spawnX: 10080 },
  scenes: [
    { scene: 'w4-s3', fromScrollX: 0 },
    { scene: 'w4-s4', fromScrollX: 8400 },
  ],
};
