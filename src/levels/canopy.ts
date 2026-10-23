import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 6-3「樹冠」(晚上)→ 叢林遺跡(深夜):樹冠之間的河溝最多,四條要盪藤蔓。
 * 四種魔物都會出現。結尾打世界關主吵鬧大猩猩。一局約 4–5 分鐘。
 */
export const CANOPY: LevelDef = {
  id: 'w6-3',
  name: '樹冠',
  world: 6,
  worldW: 10200,
  platformArt: 'log-platform',
  terrain: [
    // 1 樹冠入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 大樹枝
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2290, y: 340, w: 90, h: 20 },
    { x: 3960, y: 380, w: 120, h: 20 },
    // 3 樹屋:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 月光下
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7400, y: 340, w: 160, h: 20 },
    // 5 遺跡入口
    { x: 8500, y: 380, w: 140, h: 20 },
    // 地形重排(2026-10-24):前段(戰鬥區 A 上方的樹枝)
    { x: 7300, y: 300, w: 100, h: 20 },
    { x: 2990, y: 240, w: 100, h: 20 },
    { x: 3600, y: 250, w: 120, h: 20 },
    { x: 6510, y: 230, w: 120, h: 20 },
    { x: 8410, y: 250, w: 140, h: 20 },
    { x: 6750, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 80, h: 20 },
    { x: 1300, y: 380, w: 120, h: 20 },
    { x: 2500, y: 300, w: 120, h: 20 },
    { x: 4100, y: 300, w: 100, h: 20 },
  ],
  // 河溝:窄的跳得過,寬的要抓藤蔓盪過去。
  water: {
    shallow: [],
    gaps: [
      { x: 900, w: 280 },
      { x: 1850, w: 100 },
      { x: 4950, w: 290 },
      { x: 5900, w: 100 },
      { x: 7750, w: 280 },
      { x: 8700, w: 100 },
    ],
    pads: [],
  },
  vines: [
    { x: 970, top: 150 },
    { x: 5020, top: 150 },
    { x: 7820, top: 150 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 3150, y: 240, w: 90, h: 20 },
    { x: 3300, y: 240, w: 90, h: 20 },
    { x: 3450, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 5300, y: 380, w: 100, dx: 160, dy: 0, periodMs: 3600 },
    { x: 8250, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2880 }, { x: 6400 }],
  thorns: [],
  checkpoints: [150, 2400, 3880, 6250, 8100, 9050],
  chests: [
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 樹冠入口
    ...wave(200, [['treeFrog', 'right', 1], ['chameleon', 'right', 1]]),
    ...wave(450, [['parrot', 'right', 1]]),
    ...wave(700, [['treeFrog', 'right', 2]]),
    ...wave(950, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(1200, [['parrot', 'right', 2]]),
    ...wave(1450, [['pangolin', 'right', 1]]),
    // 2 大樹枝
    ...wave(1700, [['treeFrog', 'right', 2], ['chameleon', 'left', 1]]),
    ...wave(1950, [['parrot', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(2200, [['chameleon', 'right', 2]]),
    ...wave(2450, [['parrot', 'right', 1]]),
    ...wave(3650, [['pangolin', 'right', 1], ['treeFrog', 'right', 1]]),
    // 3 樹屋
    ...wave(3900, [['chameleon', 'right', 2], ['parrot', 'right', 1]]),
    ...wave(4150, [['treeFrog', 'left', 1], ['treeFrog', 'right', 2]]),
    ...wave(4400, [['pangolin', 'right', 1], ['parrot', 'right', 1]]),
    ...wave(4650, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(4900, [['parrot', 'right', 2]]),
    ...wave(5150, [['treeFrog', 'right', 2], ['chameleon', 'left', 1]]),
    // 4 月光下
    ...wave(5400, [['pangolin', 'right', 1], ['parrot', 'right', 1]]),
    ...wave(5650, [['chameleon', 'right', 2]]),
    ...wave(5900, [['treeFrog', 'right', 2], ['parrot', 'left', 1]]),
    ...wave(6150, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(6400, [['parrot', 'right', 2]]),
    // 5 遺跡入口(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['treeFrog', 'right', 1]]),
    ...wave(7600, [['pangolin', 'right', 1], ['chameleon', 'left', 1]]),
    ...wave(7750, [['parrot', 'right', 2]]),
    ...wave(7900, [['treeFrog', 'right', 2]]),
    ...wave(8000, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(8150, [['parrot', 'right', 1], ['treeFrog', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'treeFrog', from: 'right', delayMs: 0 },
          { type: 'parrot', from: 'right', delayMs: 500 },
          { type: 'chameleon', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'pangolin', from: 'right', delayMs: 0 },
          { type: 'chameleon', from: 'top', x: 3100, delayMs: 400 },
          { type: 'parrot', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'pangolin', from: 'right', delayMs: 0 },
          { type: 'pangolin', from: 'left', delayMs: 600 },
          { type: 'parrot', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'treeFrog', from: 'top', x: 7100, delayMs: 0 },
          { type: 'parrot', from: 'right', delayMs: 300 },
          { type: 'chameleon', from: 'left', delayMs: 600 },
          { type: 'treeFrog', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'gorilla', lockScrollX: 9240, spawnX: 10080 },
  scenes: [
    { scene: 'w6-s3', fromScrollX: 0 },
    { scene: 'w6-s4', fromScrollX: 8400 },
  ],
};
