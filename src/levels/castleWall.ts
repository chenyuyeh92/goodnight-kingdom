import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 10-2「城牆」(黃昏):綜合考驗,城牆之間的缺口(雲海)、會掉下來的冰柱、強風。
 * 四種魔物都會出現。結尾打小頭目熬夜孔雀。一局約 4–5 分鐘。
 */
export const CASTLE_WALL: LevelDef = {
  id: 'w10-2',
  name: '城牆',
  world: 10,
  worldW: 10200,
  platformArt: 'moon-platform',
  borrowArt: ['wind-streak', 'icicle'],
  terrain: [
    // 1 城牆入口
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 城垛
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 瞭望塔:通往高處寶箱的平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5580, y: 380, w: 180, h: 20 },
    // 4 吊橋
    { x: 6900, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 塔樓
    { x: 8900, y: 380, w: 140, h: 20 },
    { x: 1100, y: 400, w: 100, h: 20 }, // 缺口上的平台
    { x: 5210, y: 400, w: 100, h: 20 },
    { x: 9400, y: 340, w: 120, h: 20 }, // 低的羽毛飛鏢來時站上平台躲
    { x: 9720, y: 340, w: 120, h: 20 },
    // 地形重排(2026-10-24):後段;雲海上的移動平台
    { x: 2710, y: 240, w: 140, h: 20 },
    { x: 6410, y: 240, w: 120, h: 20 },
    { x: 7030, y: 250, w: 120, h: 20 },
    { x: 4060, y: 250, w: 100, h: 20 },
    { x: 1450, y: 380, w: 120, h: 20 },
    { x: 2950, y: 300, w: 120, h: 20 },
  ],
  // 強風區:風一陣一陣往左吹(不在缺口旁邊)。
  winds: [
    { x: 1500, w: 700 },
    { x: 3800, w: 1100 },
    { x: 7300, w: 750 },
  ],
  // 城牆之間的缺口:掉下去扣一顆愛心、從邊上重新出來;寬的中間有平台可以踩。
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
  // 城牆上掛著的冰柱,走近就掉下來。
  icicles: [1850, 3750, 4300, 5800, 7600, 8700],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 6580, y: 240, w: 90, h: 20 },
    { x: 6730, y: 240, w: 90, h: 20 },
    { x: 6880, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 8240, y: 400, w: 100, dx: 120, dy: 0, periodMs: 3600 },
    { x: 3900, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 2600 }, { x: 6300 }],
  thorns: [],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 9400, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到)
    { x: 5880, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7990, bottom: GROUND_Y },
  ],
  stars: [
    { x: 780, y: 340 },
    { x: 1150, y: 360 },
    { x: 1680, y: 320 },
    { x: 2290, y: 340 },
    { x: 3280, y: 320 },
    { x: 4750, y: 200 },
    { x: 5260, y: 360 },
    { x: 5690, y: 340 },
    { x: 7780, y: 340 },
    { x: 8130, y: 440 },
  ],
  targets: [],
  hints: [
    { x: 850, kind: 'cloudGap' },
    { x: 1650, kind: 'icicle' },
  ],
  trickles: [
    // 1 城牆入口
    ...wave(200, [['pillowSoldier', 'right', 2]]),
    ...wave(450, [['teapot', 'right', 1], ['noisyStar', 'right', 1]]),
    ...wave(700, [['pillowSoldier', 'right', 2]]),
    ...wave(950, [['noisyStar', 'right', 1]]),
    ...wave(1150, [['teapot', 'right', 1], ['pillowSoldier', 'left', 1]]),
    ...wave(1350, [['pillowSoldier', 'right', 2]]),
    ...wave(1600, [['noisyStar', 'right', 1], ['teapot', 'right', 1]]),
    // 2 城垛
    ...wave(1850, [['pillowSoldier', 'right', 3]]),
    ...wave(2100, [['clockGuard', 'right', 1]]),
    ...wave(2300, [['noisyStar', 'right', 2]]),
    ...wave(3450, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(3700, [['noisyStar', 'right', 2]]),
    // 3 瞭望塔
    ...wave(3950, [['clockGuard', 'right', 1]]),
    ...wave(4200, [['pillowSoldier', 'right', 2], ['noisyStar', 'right', 1]]),
    ...wave(4450, [['teapot', 'right', 2]]),
    ...wave(4700, [['noisyStar', 'right', 2]]),
    ...wave(4950, [['clockGuard', 'right', 1], ['pillowSoldier', 'left', 1]]),
    ...wave(5200, [['pillowSoldier', 'right', 3]]),
    // 4 吊橋
    ...wave(5450, [['noisyStar', 'right', 1], ['teapot', 'right', 1]]),
    ...wave(5700, [['pillowSoldier', 'right', 2]]),
    ...wave(5950, [['teapot', 'left', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(6100, [['noisyStar', 'right', 1]]),
    // 5 塔樓(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['clockGuard', 'right', 1], ['pillowSoldier', 'left', 1]]),
    ...wave(7450, [['noisyStar', 'right', 2]]),
    ...wave(7650, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(7850, [['pillowSoldier', 'right', 2]]),
    ...wave(7950, [['noisyStar', 'right', 1]]),
    ...wave(8150, [['teapot', 'right', 1], ['noisyStar', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'pillowSoldier', from: 'right', delayMs: 0 },
          { type: 'noisyStar', from: 'right', delayMs: 500 },
          { type: 'teapot', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'clockGuard', from: 'right', delayMs: 0 },
          { type: 'pillowSoldier', from: 'left', delayMs: 600 },
          { type: 'noisyStar', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'clockGuard', from: 'right', delayMs: 0 },
          { type: 'noisyStar', from: 'right', delayMs: 400 },
          { type: 'pillowSoldier', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'teapot', from: 'right', delayMs: 0 },
          { type: 'noisyStar', from: 'left', delayMs: 300 },
          { type: 'pillowSoldier', from: 'right', delayMs: 700 },
          { type: 'clockGuard', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'peacock', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w10-s2', fromScrollX: 0 }],
};
