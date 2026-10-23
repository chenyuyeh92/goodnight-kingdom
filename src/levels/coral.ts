import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 3-1「珊瑚礁淺海」(白天):第一次在水裡游。告示牌教怎麼往上游、往下潛;
 * 魔物以熬夜水母、鬧鐘小丑魚為主,後段咖啡章魚登場;結尾打小頭目失眠寄居蟹。一局約 4–5 分鐘。
 */
export const CORAL: LevelDef = {
  id: 'w3-1',
  name: '珊瑚礁淺海',
  world: 3,
  underwater: true,
  worldW: 10200,
  terrain: [
    // 1 淺灘
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 珊瑚叢:高低不同的珊瑚石
    { x: 2100, y: 360, w: 140, h: 20 },
    { x: 2300, y: 260, w: 160, h: 20 },
    { x: 3900, y: 340, w: 180, h: 20 },
    // 3 大珊瑚:寶箱放在高處,游上去拿
    { x: 4500, y: 300, w: 120, h: 20 },
    { x: 4700, y: 180, w: 160, h: 20 },
    { x: 5600, y: 320, w: 160, h: 20 },
    // 4 海草森林
    { x: 7000, y: 360, w: 180, h: 20 },
    { x: 7500, y: 240, w: 160, h: 20 },
    // 5 礁石邊
    { x: 8600, y: 340, w: 180, h: 20 },
    // 礁石變多(2026-10-24):從海底長上來的石柱、從上面垂下來的礁石,要上下穿梭
    { x: 1100, y: 300, w: 60, h: 180 },
    { x: 1800, y: 0, w: 60, h: 200 },
    { x: 2600, y: 300, w: 60, h: 180 },
    { x: 3000, y: 0, w: 60, h: 220 },
    { x: 3400, y: 280, w: 60, h: 200 },
    { x: 4300, y: 0, w: 60, h: 200 },
    { x: 5200, y: 300, w: 60, h: 180 },
    { x: 5900, y: 0, w: 60, h: 200 },
    { x: 6700, y: 300, w: 60, h: 180 },
    { x: 7250, y: 0, w: 60, h: 220 },
    { x: 8300, y: 300, w: 60, h: 180 },
    { x: 8800, y: 0, w: 60, h: 200 },
  ],
  // 海膽(碰到扣愛心)。
  thorns: [
    { x: 1250, w: 60 },
    { x: 3650, w: 60 },
    { x: 6400, w: 80 },
    { x: 8950, w: 60 },
  ],
  checkpoints: [150, 2100, 4100, 6100, 8100, 9100],
  chests: [
    { x: 900, bottom: GROUND_Y },
    { x: 4780, bottom: 180 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 330, kind: 'swim' },
    { x: 1050, kind: 'dive' },
  ],
  trickles: [
    // 1 淺灘
    ...wave(200, [['jellyfish', 'right', 1, 300]]),
    ...wave(450, [['clownfish', 'right', 2, 200]]),
    ...wave(700, [['jellyfish', 'right', 1, 380]]),
    ...wave(950, [['clownfish', 'right', 3, 160]]),
    ...wave(1250, [['jellyfish', 'right', 2, 220]]),
    ...wave(1500, [['clownfish', 'left', 2, 300]]),
    // 2 珊瑚叢
    ...wave(1800, [['jellyfish', 'right', 1, 160], ['clownfish', 'right', 1, 400]]),
    ...wave(2050, [['clownfish', 'right', 3, 180]]),
    ...wave(2300, [['jellyfish', 'right', 2, 280]]),
    ...wave(2450, [['clownfish', 'right', 2, 380]]),
    // 3 大珊瑚
    ...wave(3650, [['octopus', 'right', 1, 250]]),
    ...wave(3900, [['jellyfish', 'right', 2, 200], ['clownfish', 'left', 1, 400]]),
    ...wave(4150, [['clownfish', 'right', 3, 150]]),
    ...wave(4400, [['octopus', 'right', 1, 180], ['jellyfish', 'right', 1, 380]]),
    ...wave(4650, [['clownfish', 'right', 2, 260]]),
    ...wave(4900, [['puffer', 'right', 1, 300]]),
    ...wave(5150, [['jellyfish', 'right', 2, 160], ['clownfish', 'left', 1, 420]]),
    // 4 海草森林
    ...wave(5400, [['octopus', 'right', 1, 300], ['clownfish', 'right', 2, 150]]),
    ...wave(5650, [['jellyfish', 'right', 2, 240]]),
    ...wave(5900, [['clownfish', 'right', 3, 200]]),
    ...wave(6150, [['puffer', 'right', 1, 350]]),
    ...wave(6400, [['jellyfish', 'left', 1, 300], ['clownfish', 'right', 2, 160]]),
    // 5 礁石邊(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['octopus', 'right', 1, 220]]),
    ...wave(7700, [['clownfish', 'right', 3, 160]]),
    ...wave(7850, [['jellyfish', 'right', 2, 300]]),
    ...wave(7980, [['puffer', 'right', 1, 380]]),
    ...wave(8100, [['clownfish', 'left', 2, 240]]),
    ...wave(8220, [['octopus', 'right', 1, 160]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'clownfish', from: 'right', y: 180, delayMs: 0 },
          { type: 'clownfish', from: 'right', y: 300, delayMs: 200 },
          { type: 'jellyfish', from: 'left', y: 260, delayMs: 800 },
        ],
        [
          { type: 'octopus', from: 'right', y: 200, delayMs: 0 },
          { type: 'jellyfish', from: 'right', y: 380, delayMs: 500 },
          { type: 'clownfish', from: 'left', y: 160, delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'puffer', from: 'right', y: 300, delayMs: 0 },
          { type: 'clownfish', from: 'left', y: 180, delayMs: 400 },
          { type: 'clownfish', from: 'left', y: 400, delayMs: 600 },
        ],
        [
          { type: 'octopus', from: 'right', y: 160, delayMs: 0 },
          { type: 'octopus', from: 'left', y: 220, delayMs: 500 },
          { type: 'jellyfish', from: 'right', y: 380, delayMs: 900 },
        ],
      ],
    },
  ],
  boss: { type: 'hermitCrab', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w3-s1', fromScrollX: 0 }],
};
