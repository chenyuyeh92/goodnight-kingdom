import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 8-2「雲海」(黃昏):第一次遇到雲海(告示牌教:掉下去扣一顆愛心,踩著雲朵平台跳過去),也有強風。
 * 四種魔物都會出現。結尾打小頭目失眠熊貓。一局約 4–5 分鐘。
 */
export const CLOUD_SEA: LevelDef = {
  id: 'w8-2',
  name: '雲海',
  world: 8,
  worldW: 10200,
  platformArt: 'cloud-platform',
  terrain: [
    // 1 雲海邊
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 雲上的路
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 山屋:通往高處寶箱的雲朵平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 竹林
    { x: 6900, y: 380, w: 120, h: 20 },
    // 5 雲海另一邊
    { x: 8900, y: 380, w: 140, h: 20 },
    { x: 1100, y: 400, w: 100, h: 20 }, // 雲海上的雲朵平台
    { x: 8300, y: 400, w: 100, h: 20 },
    { x: 9400, y: 340, w: 120, h: 20 }, // 熊貓滾過來時站上雲朵平台躲
    { x: 9720, y: 340, w: 120, h: 20 },
    // 地形重排(2026-10-24):後段;雲海上的移動平台
    { x: 7080, y: 300, w: 100, h: 20 },
    { x: 7690, y: 250, w: 140, h: 20 },
    { x: 2590, y: 240, w: 140, h: 20 },
    { x: 5970, y: 230, w: 120, h: 20 },
    { x: 2840, y: 250, w: 140, h: 20 },
    { x: 2550, y: 380, w: 140, h: 20 },
    { x: 6350, y: 380, w: 140, h: 20 },
    { x: 6550, y: 300, w: 120, h: 20 },
    // 風區裡的上面的路(一般平台,不會掉)。
    { x: 7240, y: 240, w: 90, h: 20 },
    { x: 7390, y: 240, w: 90, h: 20 },
    { x: 7540, y: 240, w: 90, h: 20 },
  ],
  // 強風區:風一陣一陣往左吹(不在雲海旁邊)。
  winds: [
    { x: 1500, w: 700 },
    { x: 3800, w: 1100 },
    { x: 7300, w: 750 },
  ],
  // 雲海:掉下去扣一顆愛心、從邊上重新出來;寬的中間有雲朵平台可以踩。
  gapStyle: 'cloud',
  water: {
    shallow: [],
    gaps: [
      { x: 1000, w: 300 },
      { x: 3500, w: 100 },
      { x: 5100, w: 320 },
      { x: 8200, w: 300 },
    ],
    pads: [],
  },
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 6120, y: 240, w: 90, h: 20 },
    { x: 6260, y: 240, w: 90, h: 20 },
    { x: 6400, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 5140, y: 400, w: 100, dx: 140, dy: 0, periodMs: 3600 },
    { x: 3000, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2480 }, { x: 5860 }],
  thorns: [],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 5570, bottom: GROUND_Y },
    { x: 2950, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7990, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 850, kind: 'cloudGap' },
  ],
  trickles: [
    // 1 雲海邊
    ...wave(200, [['pika', 'right', 2]]),
    ...wave(450, [['coffeeCloud', 'right', 1], ['eagle', 'right', 1]]),
    ...wave(700, [['pika', 'right', 2]]),
    ...wave(950, [['eagle', 'right', 1]]),
    ...wave(1150, [['coffeeCloud', 'right', 1], ['pika', 'left', 1]]),
    ...wave(1350, [['pika', 'right', 2]]),
    ...wave(1600, [['eagle', 'right', 1], ['coffeeCloud', 'right', 1]]),
    // 2 雲上的路
    ...wave(1850, [['pika', 'right', 3]]),
    ...wave(2100, [['yak', 'right', 1]]),
    ...wave(2300, [['eagle', 'right', 2]]),
    ...wave(3450, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(3700, [['eagle', 'right', 2]]),
    // 3 山屋
    ...wave(3950, [['yak', 'right', 1]]),
    ...wave(4200, [['pika', 'right', 2], ['eagle', 'right', 1]]),
    ...wave(4450, [['coffeeCloud', 'right', 2]]),
    ...wave(4700, [['eagle', 'right', 2]]),
    ...wave(4950, [['yak', 'right', 1], ['pika', 'left', 1]]),
    ...wave(5200, [['pika', 'right', 3]]),
    // 4 竹林
    ...wave(5450, [['eagle', 'right', 1], ['coffeeCloud', 'right', 1]]),
    ...wave(5700, [['pika', 'right', 2]]),
    ...wave(5950, [['coffeeCloud', 'left', 1], ['pika', 'right', 1]]),
    ...wave(6100, [['eagle', 'right', 1]]),
    // 5 雲海另一邊(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['yak', 'right', 1], ['pika', 'left', 1]]),
    ...wave(7450, [['eagle', 'right', 2]]),
    ...wave(7650, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(7850, [['pika', 'right', 2]]),
    ...wave(7950, [['eagle', 'right', 1]]),
    ...wave(8150, [['coffeeCloud', 'right', 1], ['eagle', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'pika', from: 'right', delayMs: 0 },
          { type: 'eagle', from: 'right', delayMs: 500 },
          { type: 'coffeeCloud', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'yak', from: 'right', delayMs: 0 },
          { type: 'pika', from: 'left', delayMs: 600 },
          { type: 'eagle', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'yak', from: 'right', delayMs: 0 },
          { type: 'eagle', from: 'right', delayMs: 400 },
          { type: 'pika', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'coffeeCloud', from: 'right', delayMs: 0 },
          { type: 'eagle', from: 'left', delayMs: 300 },
          { type: 'pika', from: 'right', delayMs: 700 },
          { type: 'yak', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'panda', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w8-s2', fromScrollX: 0 }],
};
