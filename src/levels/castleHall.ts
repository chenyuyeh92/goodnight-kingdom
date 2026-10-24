import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 10-3「城堡大廳」(晚上)→ 月光王座(深夜):綜合考驗,熄了燈的大廳(黑暗,燭台照亮四周)、會掉下來的冰柱。
 * 四種魔物都會出現。結尾打最終魔王偷走睡意的夢貘,打倒就是破關。一局約 4–5 分鐘。
 */
export const CASTLE_HALL: LevelDef = {
  id: 'w10-3',
  name: { zh: '城堡大廳', en: 'Castle Hall' },
  world: 10,
  worldW: 10200,
  platformArt: 'moon-platform',
  borrowArt: ['icicle'],
  terrain: [
    // 1 大廳入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 長廊
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2290, y: 340, w: 90, h: 20 },
    { x: 3960, y: 380, w: 100, h: 20 },
    // 3 樓梯:寶箱在高處
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 畫廊
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 月光王座
    { x: 8600, y: 380, w: 180, h: 20 },
    { x: 9400, y: 340, w: 120, h: 20 }, // 低的惡夢雲飄過來時站上平台躲
    { x: 9620, y: 340, w: 120, h: 20 },
    // 地形重排(2026-10-24):後段
    { x: 7680, y: 270, w: 120, h: 20 },
    { x: 8300, y: 240, w: 140, h: 20 },
    { x: 2990, y: 240, w: 100, h: 20 },
    { x: 6570, y: 230, w: 120, h: 20 },
    { x: 3460, y: 250, w: 100, h: 20 },
    { x: 2590, y: 380, w: 120, h: 20 },
    { x: 6850, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 100, h: 20 },
    { x: 4100, y: 300, w: 100, h: 20 },
    { x: 2500, y: 300, w: 120, h: 20 },
  ],
  // 熄了燈的大廳:只看得到身邊、燭台和會發光的魔物附近;王座有月光,不暗。
  darkness: [
    { x: 1200, w: 7000 },
  ],
  crystals: [1400, 1850, 2300, 2750, 3200, 3650, 4100, 4550, 5000, 5450, 5900, 6350, 6800, 7250, 7700, 8150],
  lightStyle: 'candle',
  icicles: [900, 3700, 5100, 8550],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 7850, y: 260, w: 90, h: 20 },
    { x: 8000, y: 260, w: 90, h: 20 },
    { x: 8150, y: 260, w: 90, h: 20 },
  ],
  movers: [
    { x: 5300, y: 360, w: 100, dx: 160, dy: 0, periodMs: 3600 },
    { x: 3300, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2880 }, { x: 6460 }],
  thorns: [],
  checkpoints: [150, 2400, 3880, 6250, 8100, 9050],
  chests: [
    { x: 9400, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到)
    { x: 5800, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  stars: [
    { x: 500, y: 440 },
    { x: 1580, y: 340 },
    { x: 2335, y: 300 },
    { x: 3990, y: 340 },
    { x: 4750, y: 200 },
    { x: 5680, y: 320 },
    { x: 7090, y: 340 },
    { x: 7580, y: 300 },
    { x: 8690, y: 340 },
    { x: 9000, y: 440 },
  ],
  targets: [],
  hints: [
    { x: 1050, kind: 'darkHall' },
  ],
  trickles: [
    // 1 大廳入口
    ...wave(200, [['pillowSoldier', 'right', 1], ['teapot', 'right', 1]]),
    ...wave(450, [['noisyStar', 'right', 1]]),
    ...wave(700, [['pillowSoldier', 'right', 2]]),
    ...wave(950, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(1200, [['noisyStar', 'right', 2]]),
    ...wave(1450, [['clockGuard', 'right', 1]]),
    // 2 長廊
    ...wave(1700, [['pillowSoldier', 'right', 2], ['teapot', 'left', 1]]),
    ...wave(1950, [['noisyStar', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(2200, [['teapot', 'right', 2]]),
    ...wave(2450, [['noisyStar', 'right', 1]]),
    ...wave(3650, [['clockGuard', 'right', 1], ['pillowSoldier', 'right', 1]]),
    // 3 樓梯
    ...wave(3900, [['teapot', 'right', 2], ['noisyStar', 'right', 1]]),
    ...wave(4150, [['pillowSoldier', 'left', 1], ['pillowSoldier', 'right', 2]]),
    ...wave(4400, [['clockGuard', 'right', 1], ['noisyStar', 'right', 1]]),
    ...wave(4650, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(4900, [['noisyStar', 'right', 2]]),
    ...wave(5150, [['pillowSoldier', 'right', 2], ['teapot', 'left', 1]]),
    // 4 畫廊
    ...wave(5400, [['clockGuard', 'right', 1], ['noisyStar', 'right', 1]]),
    ...wave(5650, [['teapot', 'right', 2]]),
    ...wave(5900, [['pillowSoldier', 'right', 2], ['noisyStar', 'left', 1]]),
    ...wave(6150, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(6400, [['noisyStar', 'right', 2]]),
    // 5 月光王座(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['pillowSoldier', 'right', 1]]),
    ...wave(7600, [['clockGuard', 'right', 1], ['teapot', 'left', 1]]),
    ...wave(7750, [['noisyStar', 'right', 2]]),
    ...wave(7900, [['pillowSoldier', 'right', 2]]),
    ...wave(8000, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(8150, [['noisyStar', 'right', 1], ['pillowSoldier', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'pillowSoldier', from: 'right', delayMs: 0 },
          { type: 'noisyStar', from: 'right', delayMs: 500 },
          { type: 'teapot', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'clockGuard', from: 'right', delayMs: 0 },
          { type: 'teapot', from: 'top', x: 3100, delayMs: 400 },
          { type: 'noisyStar', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'clockGuard', from: 'right', delayMs: 0 },
          { type: 'clockGuard', from: 'left', delayMs: 600 },
          { type: 'noisyStar', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'pillowSoldier', from: 'top', x: 7100, delayMs: 0 },
          { type: 'noisyStar', from: 'right', delayMs: 300 },
          { type: 'teapot', from: 'left', delayMs: 600 },
          { type: 'pillowSoldier', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'tapir', lockScrollX: 9240, spawnX: 9950 },
  scenes: [
    { scene: 'w10-s3', fromScrollX: 0 },
    { scene: 'w10-s4', fromScrollX: 8400 },
  ],
};
