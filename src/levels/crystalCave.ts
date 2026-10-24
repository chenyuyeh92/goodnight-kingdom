import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 9-2「水晶洞」(黃昏):整關都暗,路上的發光水晶比較多。
 * 四種魔物都會出現。結尾打小頭目失眠六角恐龍。一局約 4–5 分鐘。
 */
export const CRYSTAL_CAVE: LevelDef = {
  id: 'w9-2',
  name: { zh: '水晶洞', en: 'Crystal Cave' },
  world: 9,
  worldW: 10200,
  platformArt: 'mine-platform',
  terrain: [
    // 1 水晶洞口
    { x: 600, y: 380, w: 260, h: 20 },
    { x: 1000, y: 340, w: 120, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 紫水晶
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 鐘乳石:通往高處寶箱的礦坑木板
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 晶簇
    { x: 6900, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 地底湖
    { x: 8900, y: 380, w: 140, h: 20 },
    // 地形重排(2026-10-24):前段
    { x: 1930, y: 240, w: 140, h: 20 },
    { x: 2580, y: 250, w: 120, h: 20 },
    { x: 5970, y: 230, w: 120, h: 20 },
    { x: 2840, y: 250, w: 140, h: 20 },
    { x: 4200, y: 380, w: 120, h: 20 },
    { x: 6700, y: 300, w: 120, h: 20 },
    { x: 1400, y: 380, w: 120, h: 20 },
    { x: 7100, y: 300, w: 100, h: 20 },
    { x: 8000, y: 300, w: 120, h: 20 },
  ],
  // 黑暗區:只看得到身邊、發光水晶和會發光的魔物附近。
  darkness: [
    { x: 0, w: 10200 },
  ],
  crystals: [300, 620, 940, 1260, 1580, 1900, 2220, 2540, 2860, 3180, 3500, 3820, 4140, 4460, 4780, 5100, 5420, 5740, 6060, 6380, 6700, 7020, 7340, 7660, 7980, 8300, 8620, 8940, 9260, 9580, 9900],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 2130, y: 240, w: 90, h: 20 },
    { x: 2280, y: 240, w: 90, h: 20 },
    { x: 2430, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 6300, y: 380, w: 120, dx: 200, dy: 0, periodMs: 4000 },
    { x: 3000, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1820 }, { x: 5860 }],
  thorns: [],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 9320, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到;在發光水晶旁邊看得到)
    { x: 5570, bottom: GROUND_Y },
    { x: 2950, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7990, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 水晶洞口
    ...wave(200, [['mushroom', 'right', 2]]),
    ...wave(450, [['coffeeWorm', 'right', 1], ['moth', 'right', 1]]),
    ...wave(700, [['mushroom', 'right', 2]]),
    ...wave(950, [['moth', 'right', 1]]),
    ...wave(1150, [['coffeeWorm', 'right', 1], ['mushroom', 'left', 1]]),
    ...wave(1350, [['mushroom', 'right', 2]]),
    ...wave(1600, [['moth', 'right', 1], ['coffeeWorm', 'right', 1]]),
    // 2 紫水晶
    ...wave(1850, [['mushroom', 'right', 3]]),
    ...wave(2100, [['beetle', 'right', 1]]),
    ...wave(2300, [['moth', 'right', 2]]),
    ...wave(3450, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(3700, [['moth', 'right', 2]]),
    // 3 鐘乳石
    ...wave(3950, [['beetle', 'right', 1]]),
    ...wave(4200, [['mushroom', 'right', 2], ['moth', 'right', 1]]),
    ...wave(4450, [['coffeeWorm', 'right', 2]]),
    ...wave(4700, [['moth', 'right', 2]]),
    ...wave(4950, [['beetle', 'right', 1], ['mushroom', 'left', 1]]),
    ...wave(5200, [['mushroom', 'right', 3]]),
    // 4 晶簇
    ...wave(5450, [['moth', 'right', 1], ['coffeeWorm', 'right', 1]]),
    ...wave(5700, [['mushroom', 'right', 2]]),
    ...wave(5950, [['coffeeWorm', 'left', 1], ['mushroom', 'right', 1]]),
    ...wave(6100, [['moth', 'right', 1]]),
    // 5 地底湖(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['beetle', 'right', 1], ['mushroom', 'left', 1]]),
    ...wave(7450, [['moth', 'right', 2]]),
    ...wave(7650, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(7850, [['mushroom', 'right', 2]]),
    ...wave(7950, [['moth', 'right', 1]]),
    ...wave(8150, [['coffeeWorm', 'right', 1], ['moth', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'mushroom', from: 'right', delayMs: 0 },
          { type: 'moth', from: 'right', delayMs: 500 },
          { type: 'coffeeWorm', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'beetle', from: 'right', delayMs: 0 },
          { type: 'mushroom', from: 'left', delayMs: 600 },
          { type: 'moth', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'beetle', from: 'right', delayMs: 0 },
          { type: 'moth', from: 'right', delayMs: 400 },
          { type: 'mushroom', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'coffeeWorm', from: 'right', delayMs: 0 },
          { type: 'moth', from: 'left', delayMs: 300 },
          { type: 'mushroom', from: 'right', delayMs: 700 },
          { type: 'beetle', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'axolotl', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w9-s2', fromScrollX: 0 }],
};
