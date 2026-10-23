import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 3-2「沉船拱門」(黃昏):水流會把人推著走(順流游得快、逆流游得慢),
 * 小丑魚成群游過來,咖啡章魚躲在沉船邊噴墨汁,河豚膨脹擋子彈。結尾打小頭目熬夜電鰻。一局約 4–5 分鐘。
 */
export const SHIPWRECK: LevelDef = {
  id: 'w3-2',
  name: '沉船拱門',
  world: 3,
  underwater: true,
  worldW: 10200,
  terrain: [
    // 1 沉船外圍:船板
    { x: 700, y: 360, w: 180, h: 20 },
    { x: 1500, y: 280, w: 160, h: 20 },
    // 2 船身裡
    { x: 2100, y: 340, w: 200, h: 20 },
    { x: 3200, y: 300, w: 160, h: 20 },
    // 3 桅桿:寶箱放在桅桿頂
    { x: 4400, y: 360, w: 100, h: 20 },
    { x: 4600, y: 160, w: 140, h: 20 },
    { x: 5600, y: 300, w: 180, h: 20 },
    // 4 寶藏艙
    { x: 6900, y: 340, w: 160, h: 20 },
    { x: 7700, y: 260, w: 160, h: 20 },
    // 5 拱門出口
    { x: 9000, y: 340, w: 160, h: 20 },
    // 礁石變多(2026-10-24):從海底長上來的石柱、從上面垂下來的礁石,要上下穿梭
    { x: 600, y: 0, w: 60, h: 200 },
    { x: 1850, y: 300, w: 60, h: 180 },
    { x: 2350, y: 0, w: 60, h: 200 },
    { x: 3000, y: 300, w: 60, h: 180 },
    { x: 3600, y: 0, w: 60, h: 200 },
    { x: 4250, y: 300, w: 60, h: 180 },
    { x: 4900, y: 0, w: 60, h: 200 },
    { x: 5800, y: 300, w: 60, h: 180 },
    { x: 6700, y: 0, w: 60, h: 200 },
    { x: 7300, y: 300, w: 60, h: 180 },
    { x: 8000, y: 0, w: 60, h: 200 },
    { x: 8700, y: 300, w: 60, h: 180 },
  ],
  currents: [
    // 順流:往右推,游得比較快。
    { x: 1000, y: 120, w: 400, h: 360, vx: 90, vy: 0 },
    // 逆流:往左推,靠近海床比較好游。
    { x: 2500, y: 100, w: 300, h: 300, vx: -80, vy: 0 },
    { x: 5000, y: 100, w: 400, h: 260, vx: -90, vy: 0 },
    { x: 6200, y: 140, w: 360, h: 340, vx: 100, vy: 0 },
    { x: 8200, y: 100, w: 400, h: 280, vx: -80, vy: 0 },
  ],
  thorns: [
    { x: 1700, w: 60 },
    { x: 3500, w: 60 },
    { x: 5450, w: 80 },
    { x: 8050, w: 60 },
  ],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 5750, bottom: GROUND_Y },
    { x: 2950, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4670, bottom: 160 },
    { x: 7990, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [{ x: 900, kind: 'current' }],
  trickles: [
    // 1 沉船外圍
    ...wave(200, [['clownfish', 'right', 3, 200]]),
    ...wave(450, [['jellyfish', 'right', 1, 300]]),
    ...wave(700, [['octopus', 'right', 1, 220]]),
    ...wave(950, [['clownfish', 'right', 2, 380], ['jellyfish', 'left', 1, 200]]),
    ...wave(1200, [['clownfish', 'right', 3, 150]]),
    ...wave(1450, [['octopus', 'right', 1, 300]]),
    ...wave(1650, [['jellyfish', 'right', 2, 200]]),
    // 2 船身裡
    ...wave(1900, [['puffer', 'right', 1, 300]]),
    ...wave(2100, [['clownfish', 'right', 3, 160]]),
    ...wave(2300, [['octopus', 'right', 1, 400], ['jellyfish', 'right', 1, 220]]),
    ...wave(3450, [['clownfish', 'right', 3, 240]]),
    ...wave(3700, [['jellyfish', 'right', 2, 160]]),
    // 3 桅桿
    ...wave(3950, [['puffer', 'right', 1, 260]]),
    ...wave(4200, [['clownfish', 'right', 3, 180], ['octopus', 'right', 1, 380]]),
    ...wave(4450, [['jellyfish', 'right', 2, 300]]),
    ...wave(4700, [['clownfish', 'left', 2, 220]]),
    ...wave(4950, [['octopus', 'right', 2, 180]]),
    ...wave(5200, [['puffer', 'right', 1, 380]]),
    // 4 寶藏艙
    ...wave(5450, [['clownfish', 'right', 3, 150], ['jellyfish', 'right', 1, 380]]),
    ...wave(5700, [['octopus', 'right', 1, 240]]),
    ...wave(5950, [['clownfish', 'right', 3, 300]]),
    ...wave(6100, [['jellyfish', 'left', 1, 200]]),
    // 5 拱門出口(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['puffer', 'right', 1, 280]]),
    ...wave(7450, [['clownfish', 'right', 3, 160]]),
    ...wave(7650, [['octopus', 'right', 1, 380], ['jellyfish', 'left', 1, 240]]),
    ...wave(7850, [['clownfish', 'right', 2, 260]]),
    ...wave(7950, [['jellyfish', 'right', 2, 180]]),
    ...wave(8150, [['octopus', 'right', 1, 300]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'clownfish', from: 'right', y: 160, delayMs: 0 },
          { type: 'clownfish', from: 'right', y: 260, delayMs: 150 },
          { type: 'clownfish', from: 'right', y: 360, delayMs: 300 },
          { type: 'octopus', from: 'left', y: 220, delayMs: 900 },
        ],
        [
          { type: 'puffer', from: 'right', y: 300, delayMs: 0 },
          { type: 'jellyfish', from: 'left', y: 180, delayMs: 500 },
          { type: 'octopus', from: 'right', y: 400, delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'puffer', from: 'right', y: 220, delayMs: 0 },
          { type: 'clownfish', from: 'left', y: 380, delayMs: 400 },
          { type: 'clownfish', from: 'left', y: 160, delayMs: 600 },
        ],
        [
          { type: 'octopus', from: 'right', y: 180, delayMs: 0 },
          { type: 'puffer', from: 'left', y: 340, delayMs: 500 },
          { type: 'jellyfish', from: 'right', y: 260, delayMs: 900 },
        ],
      ],
    },
  ],
  boss: { type: 'eel', lockScrollX: 9240, spawnX: 9900 },
  scenes: [{ scene: 'w3-s2', fromScrollX: 0 }],
};
