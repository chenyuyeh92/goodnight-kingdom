import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 9-1「礦坑入口」(白天):前半段還有外面的光,走進礦坑後半段就變暗(告示牌教:只看得到身邊和發光水晶附近)。
 * 魔物以熬夜蘑菇精靈、咖啡蚯蚓為主,後段吵鬧發光蛾登場;結尾打小頭目熬夜螢火蟲女王。一局約 4–5 分鐘。
 */
export const MINE_ENTRANCE: LevelDef = {
  id: 'w9-1',
  name: { zh: '礦坑入口', en: 'Mine Entrance' },
  world: 9,
  worldW: 10200,
  platformArt: 'mine-platform',
  terrain: [
    // 1 山腳
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 礦車軌道
    { x: 2170, y: 400, w: 120, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 140, h: 20 },
    // 3 礦坑口:通往高處寶箱的礦坑木板
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    // 4 礦坑裡
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 螢光洞
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
  // 黑暗區:只看得到身邊、發光水晶和會發光的魔物附近。
  darkness: [
    { x: 4900, w: 5300 },
  ],
  crystals: [5100, 5480, 5860, 6240, 6620, 7000, 7380, 7760, 8140, 8520, 8900, 9280, 9660, 10040],
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
    { x: 9340, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到;在發光水晶旁邊看得到)
    { x: 5720, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 4750, kind: 'dark' },
  ],
  trickles: [
    // 1 山腳
    ...wave(200, [['mushroom', 'right', 1]]),
    ...wave(450, [['mushroom', 'right', 2]]),
    ...wave(700, [['coffeeWorm', 'right', 1]]),
    ...wave(950, [['mushroom', 'right', 1], ['coffeeWorm', 'right', 1]]),
    ...wave(1250, [['mushroom', 'left', 1]]),
    ...wave(1500, [['coffeeWorm', 'right', 2]]),
    // 2 礦車軌道
    ...wave(1800, [['mushroom', 'right', 2]]),
    ...wave(2050, [['coffeeWorm', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(2300, [['mushroom', 'right', 2]]),
    ...wave(2450, [['coffeeWorm', 'right', 1]]),
    ...wave(3450, [['mushroom', 'right', 1]]),
    // 3 礦坑口
    ...wave(3650, [['beetle', 'right', 1]]),
    ...wave(3900, [['mushroom', 'right', 2], ['coffeeWorm', 'left', 1]]),
    ...wave(4150, [['moth', 'right', 1], ['mushroom', 'right', 1]]),
    ...wave(4400, [['coffeeWorm', 'right', 2]]),
    ...wave(4650, [['beetle', 'right', 1], ['mushroom', 'left', 1]]),
    ...wave(4900, [['moth', 'right', 1]]),
    ...wave(5150, [['mushroom', 'right', 3]]),
    // 4 礦坑裡
    ...wave(5400, [['moth', 'right', 1], ['coffeeWorm', 'right', 1]]),
    ...wave(5650, [['mushroom', 'right', 2]]),
    ...wave(5900, [['coffeeWorm', 'left', 1], ['mushroom', 'right', 1]]),
    ...wave(6150, [['moth', 'right', 2]]),
    // 5 螢光洞(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['mushroom', 'right', 2]]),
    ...wave(7700, [['moth', 'right', 1], ['coffeeWorm', 'right', 1]]),
    ...wave(7850, [['beetle', 'right', 1]]),
    ...wave(7950, [['mushroom', 'right', 1], ['coffeeWorm', 'left', 1]]),
    ...wave(8080, [['mushroom', 'right', 2]]),
    ...wave(8200, [['moth', 'right', 1], ['mushroom', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'mushroom', from: 'right', delayMs: 0 },
          { type: 'coffeeWorm', from: 'right', delayMs: 600 },
          { type: 'mushroom', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'coffeeWorm', from: 'top', x: 3100, delayMs: 0 },
          { type: 'moth', from: 'right', delayMs: 400 },
          { type: 'mushroom', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'moth', from: 'right', delayMs: 0 },
          { type: 'mushroom', from: 'right', delayMs: 400 },
          { type: 'coffeeWorm', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'beetle', from: 'right', delayMs: 0 },
          { type: 'moth', from: 'left', delayMs: 300 },
          { type: 'mushroom', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'queen', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w9-s1', fromScrollX: 0 }],
};
