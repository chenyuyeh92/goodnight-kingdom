import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 6-1「河邊雨林」(白天):第一次遇到藤蔓(告示牌教:跳起來抓住、按跳躍放手飛過河)。
 * 魔物以熬夜樹蛙、咖啡變色龍為主,後段鬧鐘鸚鵡登場;結尾打小頭目失眠樹懶。一局約 4–5 分鐘。
 */
export const RIVER_FOREST: LevelDef = {
  id: 'w6-1',
  name: '河邊雨林',
  world: 6,
  worldW: 10200,
  platformArt: 'log-platform',
  terrain: [
    // 1 雨林入口
    { x: 1400, y: 380, w: 160, h: 20 },
    // 2 第一條河
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 大樹:通往高處寶箱的木頭平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 藤蔓河
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 河的下游
    { x: 8600, y: 380, w: 180, h: 20 },
  ],
  // 河溝:窄的跳得過,寬的要抓藤蔓盪過去。
  water: {
    shallow: [],
    gaps: [
      { x: 1250, w: 90 },
      { x: 1700, w: 260 },
      { x: 5000, w: 280 },
      { x: 8250, w: 280 },
    ],
    pads: [],
  },
  vines: [
    { x: 1770, top: 150 },
    { x: 5070, top: 150 },
    { x: 8320, top: 150 },
  ],
  thorns: [],
  checkpoints: [150, 2100, 4060, 5800, 8100, 9100],
  chests: [
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 1150, kind: 'vine' },
  ],
  trickles: [
    // 1 雨林入口
    ...wave(200, [['treeFrog', 'right', 1]]),
    ...wave(450, [['treeFrog', 'right', 2]]),
    ...wave(700, [['chameleon', 'right', 1]]),
    ...wave(950, [['treeFrog', 'right', 1], ['chameleon', 'right', 1]]),
    ...wave(1250, [['treeFrog', 'left', 1]]),
    ...wave(1500, [['chameleon', 'right', 2]]),
    // 2 第一條河
    ...wave(1800, [['treeFrog', 'right', 2]]),
    ...wave(2050, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(2300, [['treeFrog', 'right', 2]]),
    ...wave(2450, [['chameleon', 'right', 1]]),
    ...wave(3450, [['treeFrog', 'right', 1]]),
    // 3 大樹
    ...wave(3650, [['pangolin', 'right', 1]]),
    ...wave(3900, [['treeFrog', 'right', 2], ['chameleon', 'left', 1]]),
    ...wave(4150, [['parrot', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(4400, [['chameleon', 'right', 2]]),
    ...wave(4650, [['pangolin', 'right', 1], ['treeFrog', 'left', 1]]),
    ...wave(4900, [['parrot', 'right', 1]]),
    ...wave(5150, [['treeFrog', 'right', 3]]),
    // 4 藤蔓河
    ...wave(5400, [['parrot', 'right', 1], ['chameleon', 'right', 1]]),
    ...wave(5650, [['treeFrog', 'right', 2]]),
    ...wave(5900, [['chameleon', 'left', 1], ['treeFrog', 'right', 1]]),
    ...wave(6150, [['parrot', 'right', 2]]),
    // 5 河的下游(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['treeFrog', 'right', 2]]),
    ...wave(7700, [['parrot', 'right', 1], ['chameleon', 'right', 1]]),
    ...wave(7850, [['pangolin', 'right', 1]]),
    ...wave(7950, [['treeFrog', 'right', 1], ['chameleon', 'left', 1]]),
    ...wave(8080, [['treeFrog', 'right', 2]]),
    ...wave(8200, [['parrot', 'right', 1], ['treeFrog', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'treeFrog', from: 'right', delayMs: 0 },
          { type: 'chameleon', from: 'right', delayMs: 600 },
          { type: 'treeFrog', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'chameleon', from: 'top', x: 3100, delayMs: 0 },
          { type: 'parrot', from: 'right', delayMs: 400 },
          { type: 'treeFrog', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'parrot', from: 'right', delayMs: 0 },
          { type: 'treeFrog', from: 'right', delayMs: 400 },
          { type: 'chameleon', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'pangolin', from: 'right', delayMs: 0 },
          { type: 'parrot', from: 'left', delayMs: 300 },
          { type: 'treeFrog', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'sloth', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w6-s1', fromScrollX: 0 }],
};
