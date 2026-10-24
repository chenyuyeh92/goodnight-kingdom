import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 7-1「金合歡草原」(白天):第一次遇到獸群奔跑(告示牌教:看到沙塵和「!」就準備,一組一組跳過或站到岩石上)。
 * 魔物以熬夜狐獴、咖啡疣豬為主,後段吵鬧犀鳥登場;結尾打小頭目失眠長頸鹿。一局約 4–5 分鐘。
 */
export const ACACIA: LevelDef = {
  id: 'w7-1',
  name: '金合歡草原',
  world: 7,
  worldW: 10200,
  platformArt: 'savanna-platform',
  terrain: [
    // 1 草原入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 金合歡樹下
    { x: 2170, y: 400, w: 120, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 140, h: 20 },
    // 3 大岩石:通往高處寶箱的岩石平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    // 4 白蟻丘
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 長頸鹿的樹林
    { x: 8600, y: 380, w: 180, h: 20 },
    // 地形重排(2026-10-24):中段
    { x: 5380, y: 220, w: 140, h: 20 },
    { x: 5560, y: 250, w: 140, h: 20 },
    { x: 5760, y: 290, w: 140, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 3050, y: 300, w: 140, h: 20 },
    { x: 3350, y: 380, w: 140, h: 20 },
    { x: 6750, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 100, h: 20 },
    { x: 1210, y: 240, w: 140, h: 20 },
    { x: 6110, y: 230, w: 120, h: 20 },
    { x: 8460, y: 250, w: 140, h: 20 },
  ],
  // 獸群奔跑區:裡面都有岩石平台可以站。
  stampedes: [
    { x: 1300, w: 600 },
    { x: 4300, w: 1300 },
    { x: 8300, w: 650 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 4900, y: 240, w: 90, h: 20 },
    { x: 5060, y: 240, w: 90, h: 20 },
    { x: 5220, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 7700, y: 340, w: 120, dx: 240, dy: 0, periodMs: 4200 },
    { x: 8300, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1100 }, { x: 6000 }],
  thorns: [],
  checkpoints: [150, 2100, 4060, 5800, 8100, 9100],
  chests: [
    { x: 9400, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到)
    { x: 5720, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 1200, kind: 'stampede' },
  ],
  trickles: [
    // 1 草原入口
    ...wave(200, [['meerkat', 'right', 1]]),
    ...wave(450, [['meerkat', 'right', 2]]),
    ...wave(700, [['warthog', 'right', 1]]),
    ...wave(950, [['meerkat', 'right', 1], ['warthog', 'right', 1]]),
    ...wave(1250, [['meerkat', 'left', 1]]),
    ...wave(1500, [['warthog', 'right', 2]]),
    // 2 金合歡樹下
    ...wave(1800, [['meerkat', 'right', 2]]),
    ...wave(2050, [['warthog', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(2300, [['meerkat', 'right', 2]]),
    ...wave(2450, [['warthog', 'right', 1]]),
    ...wave(3450, [['meerkat', 'right', 1]]),
    // 3 大岩石
    ...wave(3650, [['rhino', 'right', 1]]),
    ...wave(3900, [['meerkat', 'right', 2], ['warthog', 'left', 1]]),
    ...wave(4150, [['hornbill', 'right', 1], ['meerkat', 'right', 1]]),
    ...wave(4400, [['warthog', 'right', 2]]),
    ...wave(4650, [['rhino', 'right', 1], ['meerkat', 'left', 1]]),
    ...wave(4900, [['hornbill', 'right', 1]]),
    ...wave(5150, [['meerkat', 'right', 3]]),
    // 4 白蟻丘
    ...wave(5400, [['hornbill', 'right', 1], ['warthog', 'right', 1]]),
    ...wave(5650, [['meerkat', 'right', 2]]),
    ...wave(5900, [['warthog', 'left', 1], ['meerkat', 'right', 1]]),
    ...wave(6150, [['hornbill', 'right', 2]]),
    // 5 長頸鹿的樹林(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['meerkat', 'right', 2]]),
    ...wave(7700, [['hornbill', 'right', 1], ['warthog', 'right', 1]]),
    ...wave(7850, [['rhino', 'right', 1]]),
    ...wave(7950, [['meerkat', 'right', 1], ['warthog', 'left', 1]]),
    ...wave(8080, [['meerkat', 'right', 2]]),
    ...wave(8200, [['hornbill', 'right', 1], ['meerkat', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'meerkat', from: 'right', delayMs: 0 },
          { type: 'warthog', from: 'right', delayMs: 600 },
          { type: 'meerkat', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'warthog', from: 'top', x: 3100, delayMs: 0 },
          { type: 'hornbill', from: 'right', delayMs: 400 },
          { type: 'meerkat', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'hornbill', from: 'right', delayMs: 0 },
          { type: 'meerkat', from: 'right', delayMs: 400 },
          { type: 'warthog', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'rhino', from: 'right', delayMs: 0 },
          { type: 'hornbill', from: 'left', delayMs: 300 },
          { type: 'meerkat', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'giraffe', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w7-s1', fromScrollX: 0 }],
};
