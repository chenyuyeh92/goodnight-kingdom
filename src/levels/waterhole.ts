import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 7-2「水塘」(黃昏):獸群奔跑區比較長,三個。
 * 四種魔物都會出現。結尾打小頭目熬夜大象。一局約 4–5 分鐘。
 */
export const WATERHOLE: LevelDef = {
  id: 'w7-2',
  name: '水塘',
  world: 7,
  worldW: 10200,
  platformArt: 'savanna-platform',
  terrain: [
    // 1 水塘邊
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 乾掉的河床
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 岩石堆:通往高處寶箱的岩石平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 角馬遷徙的路
    { x: 6900, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 水塘另一邊
    { x: 8900, y: 380, w: 140, h: 20 },
    { x: 7450, y: 390, w: 120, h: 20 },
    // 地形重排(2026-10-24):前段
    { x: 1990, y: 240, w: 140, h: 20 },
    { x: 2640, y: 250, w: 120, h: 20 },
    { x: 5970, y: 230, w: 120, h: 20 },
    { x: 2840, y: 250, w: 140, h: 20 },
    { x: 4200, y: 380, w: 120, h: 20 },
    { x: 6700, y: 300, w: 120, h: 20 },
    { x: 1400, y: 380, w: 120, h: 20 },
    { x: 7100, y: 300, w: 100, h: 20 },
    { x: 8000, y: 300, w: 120, h: 20 },
  ],
  // 獸群奔跑區:裡面都有岩石平台可以站。
  stampedes: [
    { x: 600, w: 1300 },
    { x: 4300, w: 1500 },
    { x: 7250, w: 520 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 2190, y: 240, w: 90, h: 20 },
    { x: 2340, y: 240, w: 90, h: 20 },
    { x: 2490, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 6300, y: 380, w: 120, dx: 200, dy: 0, periodMs: 4000 },
    { x: 3000, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1880 }, { x: 5860 }],
  thorns: [],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 5950, bottom: GROUND_Y },
    { x: 2950, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 水塘邊
    ...wave(200, [['meerkat', 'right', 2]]),
    ...wave(450, [['warthog', 'right', 1], ['hornbill', 'right', 1]]),
    ...wave(700, [['meerkat', 'right', 2]]),
    ...wave(950, [['hornbill', 'right', 1]]),
    ...wave(1150, [['warthog', 'right', 1], ['meerkat', 'left', 1]]),
    ...wave(1350, [['meerkat', 'right', 2]]),
    ...wave(1600, [['hornbill', 'right', 1], ['warthog', 'right', 1]]),
    // 2 乾掉的河床
    ...wave(1850, [['meerkat', 'right', 3]]),
    ...wave(2100, [['rhino', 'right', 1]]),
    ...wave(2300, [['hornbill', 'right', 2]]),
    ...wave(3450, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(3700, [['hornbill', 'right', 2]]),
    // 3 岩石堆
    ...wave(3950, [['rhino', 'right', 1]]),
    ...wave(4200, [['meerkat', 'right', 2], ['hornbill', 'right', 1]]),
    ...wave(4450, [['warthog', 'right', 2]]),
    ...wave(4700, [['hornbill', 'right', 2]]),
    ...wave(4950, [['rhino', 'right', 1], ['meerkat', 'left', 1]]),
    ...wave(5200, [['meerkat', 'right', 3]]),
    // 4 角馬遷徙的路
    ...wave(5450, [['hornbill', 'right', 1], ['warthog', 'right', 1]]),
    ...wave(5700, [['meerkat', 'right', 2]]),
    ...wave(5950, [['warthog', 'left', 1], ['meerkat', 'right', 1]]),
    ...wave(6100, [['hornbill', 'right', 1]]),
    // 5 水塘另一邊(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['rhino', 'right', 1], ['meerkat', 'left', 1]]),
    ...wave(7450, [['hornbill', 'right', 2]]),
    ...wave(7650, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(7850, [['meerkat', 'right', 2]]),
    ...wave(7950, [['hornbill', 'right', 1]]),
    ...wave(8150, [['warthog', 'right', 1], ['hornbill', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'meerkat', from: 'right', delayMs: 0 },
          { type: 'hornbill', from: 'right', delayMs: 500 },
          { type: 'warthog', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'rhino', from: 'right', delayMs: 0 },
          { type: 'meerkat', from: 'left', delayMs: 600 },
          { type: 'hornbill', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'rhino', from: 'right', delayMs: 0 },
          { type: 'hornbill', from: 'right', delayMs: 400 },
          { type: 'meerkat', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'warthog', from: 'right', delayMs: 0 },
          { type: 'hornbill', from: 'left', delayMs: 300 },
          { type: 'meerkat', from: 'right', delayMs: 700 },
          { type: 'rhino', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'elephant', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w7-s2', fromScrollX: 0 }],
};
