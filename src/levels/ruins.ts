import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 3-3「深海遺跡」(晚上)→ 亞特蘭提斯神殿(深夜):氣泡柱把人往上送到高處的柱頂,
 * 也有水流;四種魔物都會出現。結尾打世界關主尼斯湖水怪。一局約 4–5 分鐘。
 */
export const RUINS: LevelDef = {
  id: 'w3-3',
  name: '深海遺跡',
  world: 3,
  underwater: true,
  worldW: 10200,
  terrain: [
    // 1 倒下的石柱
    { x: 1500, y: 360, w: 160, h: 20 },
    // 2 石柱林:柱頂很高,搭氣泡柱上去
    { x: 2100, y: 300, w: 140, h: 20 },
    { x: 2350, y: 140, w: 160, h: 20 },
    { x: 3900, y: 320, w: 180, h: 20 },
    // 3 神廟廣場:寶箱在柱頂
    { x: 4400, y: 340, w: 100, h: 20 },
    { x: 4700, y: 130, w: 160, h: 20 },
    { x: 5600, y: 300, w: 160, h: 20 },
    // 4 沉沒的街道
    { x: 7000, y: 340, w: 180, h: 20 },
    { x: 7500, y: 220, w: 160, h: 20 },
    // 5 神殿前
    { x: 8600, y: 340, w: 180, h: 20 },
    // 礁石變多(2026-10-24):從海底長上來的石柱、從上面垂下來的礁石,要上下穿梭
    { x: 900, y: 0, w: 60, h: 200 },
    { x: 1800, y: 300, w: 60, h: 180 },
    { x: 2700, y: 0, w: 60, h: 200 },
    { x: 3100, y: 300, w: 60, h: 180 },
    { x: 4200, y: 0, w: 60, h: 200 },
    { x: 5100, y: 300, w: 60, h: 180 },
    { x: 5400, y: 0, w: 60, h: 200 },
    { x: 6700, y: 300, w: 60, h: 180 },
    { x: 7200, y: 0, w: 60, h: 200 },
    { x: 7900, y: 300, w: 60, h: 180 },
    { x: 8750, y: 0, w: 60, h: 200 },
  ],
  currents: [
    // 氣泡柱:往上送。
    { x: 2260, y: 150, w: 70, h: 330, vx: 0, vy: -260 },
    { x: 4620, y: 140, w: 70, h: 340, vx: 0, vy: -260 },
    { x: 7420, y: 230, w: 70, h: 250, vx: 0, vy: -240 },
    // 水流。
    { x: 3300, y: 100, w: 400, h: 300, vx: -80, vy: 0 },
    { x: 6000, y: 160, w: 400, h: 320, vx: 90, vy: 0 },
    { x: 8200, y: 100, w: 320, h: 260, vx: -80, vy: 0 },
  ],
  thorns: [
    { x: 1250, w: 60 },
    { x: 3700, w: 60 },
    { x: 6450, w: 80 },
    { x: 8480, w: 60 },
  ],
  checkpoints: [150, 2400, 3980, 5900, 8100, 9050],
  chests: [
    { x: 5800, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 600, bottom: GROUND_Y },
    { x: 4780, bottom: 130 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [{ x: 2000, kind: 'current' }],
  trickles: [
    // 1 倒下的石柱
    ...wave(200, [['jellyfish', 'right', 1, 280], ['clownfish', 'right', 2, 160]]),
    ...wave(450, [['octopus', 'right', 1, 340]]),
    ...wave(700, [['clownfish', 'right', 3, 220]]),
    ...wave(950, [['puffer', 'right', 1, 300]]),
    ...wave(1200, [['jellyfish', 'right', 2, 180]]),
    ...wave(1450, [['octopus', 'right', 1, 240], ['clownfish', 'left', 1, 400]]),
    // 2 石柱林
    ...wave(1700, [['clownfish', 'right', 3, 160]]),
    ...wave(1950, [['jellyfish', 'right', 2, 260]]),
    ...wave(2200, [['octopus', 'right', 2, 200]]),
    ...wave(2450, [['puffer', 'right', 1, 360]]),
    ...wave(3450, [['clownfish', 'right', 3, 220]]),
    // 3 神廟廣場
    ...wave(3700, [['jellyfish', 'right', 2, 180], ['octopus', 'right', 1, 380]]),
    ...wave(3950, [['puffer', 'right', 1, 280]]),
    ...wave(4200, [['clownfish', 'right', 3, 150]]),
    ...wave(4450, [['octopus', 'left', 1, 300], ['jellyfish', 'right', 1, 220]]),
    ...wave(4700, [['clownfish', 'right', 3, 300]]),
    ...wave(4950, [['puffer', 'right', 1, 200], ['octopus', 'right', 1, 400]]),
    // 4 沉沒的街道
    ...wave(5200, [['jellyfish', 'right', 2, 260]]),
    ...wave(5450, [['clownfish', 'right', 3, 180]]),
    ...wave(5700, [['octopus', 'right', 2, 240]]),
    ...wave(5950, [['puffer', 'right', 1, 380], ['clownfish', 'left', 2, 160]]),
    ...wave(6200, [['jellyfish', 'right', 2, 300]]),
    // 5 神殿前(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['puffer', 'right', 1, 300]]),
    ...wave(7600, [['clownfish', 'right', 3, 160]]),
    ...wave(7750, [['octopus', 'right', 1, 380], ['jellyfish', 'left', 1, 240]]),
    ...wave(7900, [['clownfish', 'right', 3, 260]]),
    ...wave(8050, [['octopus', 'right', 1, 180]]),
    ...wave(8170, [['jellyfish', 'right', 2, 300]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'puffer', from: 'right', y: 300, delayMs: 0 },
          { type: 'clownfish', from: 'left', y: 160, delayMs: 400 },
          { type: 'clownfish', from: 'left', y: 400, delayMs: 600 },
        ],
        [
          { type: 'octopus', from: 'right', y: 180, delayMs: 0 },
          { type: 'octopus', from: 'right', y: 400, delayMs: 300 },
          { type: 'jellyfish', from: 'left', y: 260, delayMs: 800 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'puffer', from: 'right', y: 200, delayMs: 0 },
          { type: 'puffer', from: 'left', y: 380, delayMs: 500 },
          { type: 'clownfish', from: 'right', y: 300, delayMs: 900 },
        ],
        [
          { type: 'octopus', from: 'right', y: 160, delayMs: 0 },
          { type: 'clownfish', from: 'left', y: 220, delayMs: 300 },
          { type: 'clownfish', from: 'left', y: 340, delayMs: 450 },
          { type: 'jellyfish', from: 'right', y: 400, delayMs: 900 },
        ],
      ],
    },
  ],
  boss: { type: 'nessie', lockScrollX: 9240, spawnX: 10090 },
  scenes: [
    { scene: 'w3-s3', fromScrollX: 0 },
    { scene: 'w3-s4', fromScrollX: 8400 },
  ],
};
