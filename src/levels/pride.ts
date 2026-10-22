import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 7-3「星空草原」(晚上)→ 榮耀岩(深夜):獸群奔跑區最多。
 * 四種魔物都會出現。結尾打世界關主失眠獅子王(他也會叫角馬群,場上有兩塊岩石可以站)。一局約 4–5 分鐘。
 */
export const PRIDE_ROCK: LevelDef = {
  id: 'w7-3',
  name: '星空草原',
  world: 7,
  worldW: 10200,
  platformArt: 'savanna-platform',
  terrain: [
    // 1 星空下
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 猴麵包樹
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 岩石堆:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 銀河下
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 榮耀岩前
    { x: 8600, y: 380, w: 180, h: 20 },
    { x: 9450, y: 390, w: 120, h: 20 }, // 榮耀岩:獅子王叫角馬群時可以站上去
    { x: 9760, y: 390, w: 120, h: 20 },
  ],
  // 獸群奔跑區:裡面都有岩石平台可以站。
  stampedes: [
    { x: 700, w: 1500 },
    { x: 4150, w: 1950 },
    { x: 8250, w: 690 },
  ],
  thorns: [],
  checkpoints: [150, 2400, 3980, 6250, 8100, 9050],
  chests: [
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 星空下
    ...wave(200, [['meerkat', 'right', 1], ['warthog', 'right', 1]]),
    ...wave(450, [['hornbill', 'right', 1]]),
    ...wave(700, [['meerkat', 'right', 2]]),
    ...wave(950, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(1200, [['hornbill', 'right', 2]]),
    ...wave(1450, [['rhino', 'right', 1]]),
    // 2 猴麵包樹
    ...wave(1700, [['meerkat', 'right', 2], ['warthog', 'left', 1]]),
    ...wave(1950, [['hornbill', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(2200, [['warthog', 'right', 2]]),
    ...wave(2450, [['hornbill', 'right', 1]]),
    ...wave(3650, [['rhino', 'right', 1], ['meerkat', 'right', 1]]),
    // 3 岩石堆
    ...wave(3900, [['warthog', 'right', 2], ['hornbill', 'right', 1]]),
    ...wave(4150, [['meerkat', 'left', 1], ['meerkat', 'right', 2]]),
    ...wave(4400, [['rhino', 'right', 1], ['hornbill', 'right', 1]]),
    ...wave(4650, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(4900, [['hornbill', 'right', 2]]),
    ...wave(5150, [['meerkat', 'right', 2], ['warthog', 'left', 1]]),
    // 4 銀河下
    ...wave(5400, [['rhino', 'right', 1], ['hornbill', 'right', 1]]),
    ...wave(5650, [['warthog', 'right', 2]]),
    ...wave(5900, [['meerkat', 'right', 2], ['hornbill', 'left', 1]]),
    ...wave(6150, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(6400, [['hornbill', 'right', 2]]),
    // 5 榮耀岩前(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['meerkat', 'right', 1]]),
    ...wave(7600, [['rhino', 'right', 1], ['warthog', 'left', 1]]),
    ...wave(7750, [['hornbill', 'right', 2]]),
    ...wave(7900, [['meerkat', 'right', 2]]),
    ...wave(8000, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(8150, [['hornbill', 'right', 1], ['meerkat', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'meerkat', from: 'right', delayMs: 0 },
          { type: 'hornbill', from: 'right', delayMs: 500 },
          { type: 'warthog', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'rhino', from: 'right', delayMs: 0 },
          { type: 'warthog', from: 'top', x: 3100, delayMs: 400 },
          { type: 'hornbill', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'rhino', from: 'right', delayMs: 0 },
          { type: 'rhino', from: 'left', delayMs: 600 },
          { type: 'hornbill', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'meerkat', from: 'top', x: 7100, delayMs: 0 },
          { type: 'hornbill', from: 'right', delayMs: 300 },
          { type: 'warthog', from: 'left', delayMs: 600 },
          { type: 'meerkat', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'lion', lockScrollX: 9240, spawnX: 10080 },
  scenes: [
    { scene: 'w7-s3', fromScrollX: 0 },
    { scene: 'w7-s4', fromScrollX: 8400 },
  ],
};
