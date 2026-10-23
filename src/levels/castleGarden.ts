import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 10-1「城下花園」(白天):綜合考驗,噴水池的淺水、玫瑰花叢的荊棘、強風;第一次看到收集用的星星。
 * 四種魔物都會出現。結尾打小頭目失眠月兔。一局約 4–5 分鐘。
 */
export const CASTLE_GARDEN: LevelDef = {
  id: 'w10-1',
  name: '城下花園',
  world: 10,
  worldW: 10200,
  platformArt: 'moon-platform',
  borrowArt: ['wind-streak'],
  terrain: [
    // 1 花園入口
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 噴水池
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 玫瑰花圃:通往高處寶箱的平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 迷宮樹籬
    { x: 6900, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 城門前
    { x: 8900, y: 380, w: 140, h: 20 },
    // 月兔敲地的震波來時站上平台躲;放在兩邊,不擋住丟過來的麻糬。
    { x: 9280, y: 340, w: 120, h: 20 },
    { x: 10020, y: 340, w: 120, h: 20 },
    // 地形重排(2026-10-24):中段
    { x: 5380, y: 220, w: 140, h: 20 },
    { x: 5560, y: 250, w: 140, h: 20 },
    { x: 5800, y: 300, w: 120, h: 20 },
    { x: 1630, y: 240, w: 140, h: 20 },
    { x: 8750, y: 240, w: 140, h: 20 },
    { x: 2840, y: 250, w: 140, h: 20 },
    { x: 2550, y: 380, w: 140, h: 20 },
    { x: 6700, y: 300, w: 120, h: 20 },
  ],
  // 強風區:風一陣一陣往左吹。
  winds: [
    { x: 1700, w: 500 },
    { x: 4800, w: 400 },
    { x: 7900, w: 400 },
  ],
  // 噴水池:淺水走得慢。
  water: {
    shallow: [
      { x: 1100, w: 400 },
      { x: 4250, w: 400 },
      { x: 7400, w: 350 },
    ],
    gaps: [],
    pads: [],
  },
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 4240, y: 240, w: 90, h: 20 },
    { x: 4400, y: 240, w: 90, h: 20 },
    { x: 4560, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 6300, y: 380, w: 120, dx: 200, dy: 0, periodMs: 4000 },
    { x: 3000, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1520 }, { x: 8640 }],
  // 玫瑰花叢的刺。
  thorns: [
    { x: 950, w: 80 },
    { x: 3600, w: 90 },
    { x: 5300, w: 80 },
    { x: 8500, w: 80 },
  ],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 5850, bottom: GROUND_Y },
    { x: 2950, bottom: GROUND_Y },
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 8100, bottom: GROUND_Y },
  ],
  // 星星:地上走過去就拿得到的、平台上的、高處的。
  stars: [
    { x: 450, y: 440 },
    { x: 780, y: 340 },
    { x: 1680, y: 320 },
    { x: 2290, y: 340 },
    { x: 3280, y: 320 },
    { x: 4750, y: 200 },
    { x: 5690, y: 340 },
    { x: 6960, y: 340 },
    { x: 7780, y: 340 },
    { x: 8970, y: 340 },
  ],
  targets: [],
  hints: [
    { x: 350, kind: 'star' },
    { x: 1500, kind: 'wind' },
  ],
  trickles: [
    // 1 花園入口
    ...wave(200, [['pillowSoldier', 'right', 2]]),
    ...wave(450, [['teapot', 'right', 1], ['noisyStar', 'right', 1]]),
    ...wave(700, [['pillowSoldier', 'right', 2]]),
    ...wave(950, [['noisyStar', 'right', 1]]),
    ...wave(1150, [['teapot', 'right', 1], ['pillowSoldier', 'left', 1]]),
    ...wave(1350, [['pillowSoldier', 'right', 2]]),
    ...wave(1600, [['noisyStar', 'right', 1], ['teapot', 'right', 1]]),
    // 2 噴水池
    ...wave(1850, [['pillowSoldier', 'right', 3]]),
    ...wave(2100, [['clockGuard', 'right', 1]]),
    ...wave(2300, [['noisyStar', 'right', 2]]),
    ...wave(3450, [['teapot', 'right', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(3700, [['noisyStar', 'right', 2]]),
    // 3 玫瑰花圃
    ...wave(3950, [['clockGuard', 'right', 1]]),
    ...wave(4200, [['pillowSoldier', 'right', 2], ['noisyStar', 'right', 1]]),
    ...wave(4450, [['teapot', 'right', 2]]),
    ...wave(4700, [['noisyStar', 'right', 2]]),
    ...wave(4950, [['clockGuard', 'right', 1], ['pillowSoldier', 'left', 1]]),
    ...wave(5200, [['pillowSoldier', 'right', 3]]),
    // 4 迷宮樹籬
    ...wave(5450, [['noisyStar', 'right', 1], ['teapot', 'right', 1]]),
    ...wave(5700, [['pillowSoldier', 'right', 2]]),
    ...wave(5950, [['teapot', 'left', 1], ['pillowSoldier', 'right', 1]]),
    ...wave(6100, [['noisyStar', 'right', 1]]),
    // 5 城門前(零星魔物在小頭目前一個畫面就結束)
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
  boss: { type: 'rabbit', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w10-s1', fromScrollX: 0 }],
};
