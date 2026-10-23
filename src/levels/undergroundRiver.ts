import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 9-3「地下河」(晚上)→ 鼴鼠巢穴(深夜):整關都暗,發光水晶比較少,還有走得慢的淺水。
 * 四種魔物都會出現。結尾打世界關主失眠巨鼴鼠(頭燈照到的地方看得到)。一局約 4–5 分鐘。
 */
export const UNDERGROUND_RIVER: LevelDef = {
  id: 'w9-3',
  name: '地下河',
  world: 9,
  worldW: 10200,
  platformArt: 'mine-platform',
  terrain: [
    // 1 河岸
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 石筍
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2290, y: 340, w: 90, h: 20 },
    { x: 3960, y: 380, w: 120, h: 20 },
    // 3 礦工小屋:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 河的深處
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 鼴鼠巢穴
    { x: 8600, y: 380, w: 180, h: 20 },
    // 地形重排(2026-10-24):後段
    { x: 7680, y: 270, w: 120, h: 20 },
    { x: 8300, y: 240, w: 140, h: 20 },
    { x: 2990, y: 240, w: 100, h: 20 },
    { x: 6510, y: 230, w: 120, h: 20 },
    { x: 3460, y: 250, w: 100, h: 20 },
    { x: 2700, y: 380, w: 120, h: 20 },
    { x: 6750, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 100, h: 20 },
    { x: 4100, y: 300, w: 100, h: 20 },
    { x: 2500, y: 300, w: 120, h: 20 },
  ],
  // 黑暗區:只看得到身邊、發光水晶和會發光的魔物附近。
  darkness: [
    { x: 0, w: 10200 },
  ],
  crystals: [400, 850, 1300, 1750, 2200, 2650, 3100, 3550, 4000, 4450, 4900, 5350, 5800, 6250, 6700, 7150, 7600, 8050, 8500, 8950, 9400, 9850],
  // 地下河:淺水走得慢。
  water: {
    shallow: [
      { x: 1100, w: 400 },
      { x: 4200, w: 500 },
      { x: 5100, w: 400 },
      { x: 7600, w: 400 },
    ],
    gaps: [],
    pads: [],
  },
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 7850, y: 260, w: 90, h: 20 },
    { x: 8000, y: 260, w: 90, h: 20 },
    { x: 8150, y: 260, w: 90, h: 20 },
  ],
  movers: [
    { x: 5300, y: 380, w: 100, dx: 160, dy: 0, periodMs: 3600 },
    { x: 3300, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2880 }, { x: 6400 }],
  thorns: [],
  checkpoints: [150, 2400, 3880, 6250, 8100, 9050],
  chests: [
    { x: 5800, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 河岸
    ...wave(200, [['mushroom', 'right', 1], ['coffeeWorm', 'right', 1]]),
    ...wave(450, [['moth', 'right', 1]]),
    ...wave(700, [['mushroom', 'right', 2]]),
    ...wave(950, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(1200, [['moth', 'right', 2]]),
    ...wave(1450, [['beetle', 'right', 1]]),
    // 2 石筍
    ...wave(1700, [['mushroom', 'right', 2], ['coffeeWorm', 'left', 1]]),
    ...wave(1950, [['moth', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(2200, [['coffeeWorm', 'right', 2]]),
    ...wave(2450, [['moth', 'right', 1]]),
    ...wave(3650, [['beetle', 'right', 1], ['mushroom', 'right', 1]]),
    // 3 礦工小屋
    ...wave(3900, [['coffeeWorm', 'right', 2], ['moth', 'right', 1]]),
    ...wave(4150, [['mushroom', 'left', 1], ['mushroom', 'right', 2]]),
    ...wave(4400, [['beetle', 'right', 1], ['moth', 'right', 1]]),
    ...wave(4650, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(4900, [['moth', 'right', 2]]),
    ...wave(5150, [['mushroom', 'right', 2], ['coffeeWorm', 'left', 1]]),
    // 4 河的深處
    ...wave(5400, [['beetle', 'right', 1], ['moth', 'right', 1]]),
    ...wave(5650, [['coffeeWorm', 'right', 2]]),
    ...wave(5900, [['mushroom', 'right', 2], ['moth', 'left', 1]]),
    ...wave(6150, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(6400, [['moth', 'right', 2]]),
    // 5 鼴鼠巢穴(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['mushroom', 'right', 1]]),
    ...wave(7600, [['beetle', 'right', 1], ['coffeeWorm', 'left', 1]]),
    ...wave(7750, [['moth', 'right', 2]]),
    ...wave(7900, [['mushroom', 'right', 2]]),
    ...wave(8000, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(8150, [['moth', 'right', 1], ['mushroom', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'mushroom', from: 'right', delayMs: 0 },
          { type: 'moth', from: 'right', delayMs: 500 },
          { type: 'coffeeWorm', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'beetle', from: 'right', delayMs: 0 },
          { type: 'coffeeWorm', from: 'top', x: 3100, delayMs: 400 },
          { type: 'moth', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'beetle', from: 'right', delayMs: 0 },
          { type: 'beetle', from: 'left', delayMs: 600 },
          { type: 'moth', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'mushroom', from: 'top', x: 7100, delayMs: 0 },
          { type: 'moth', from: 'right', delayMs: 300 },
          { type: 'coffeeWorm', from: 'left', delayMs: 600 },
          { type: 'mushroom', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'mole', lockScrollX: 9240, spawnX: 9950 },
  scenes: [
    { scene: 'w9-s3', fromScrollX: 0 },
    { scene: 'w9-s4', fromScrollX: 8400 },
  ],
};
