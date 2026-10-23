import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 2-2「沙丘商隊路」(黃昏):流沙很多,咖啡沙蛇從流沙裡冒出來吐咖啡,
 * 禿鷹從天上俯衝,失眠沙漠陸龜用殼擋子彈。結尾打小頭目熬夜耳廓狐。一局約 4–5 分鐘。
 */
export const DUNES: LevelDef = {
  id: 'w2-2',
  name: '沙丘商隊路',
  world: 2,
  worldW: 10200,
  terrain: [
    // 1 商隊出發
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 大沙丘
    { x: 2230, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 駱駝休息站:通往高處寶箱的階梯
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 流沙谷:踏板讓人跳過長的流沙
    { x: 6900, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 夕陽下的沙路
    { x: 8900, y: 380, w: 140, h: 20 },
    // 小頭目區的踏板
    { x: 9500, y: 360, w: 140, h: 20 },
    { x: 9860, y: 360, w: 140, h: 20 },
    // 地形重排(2026-10-24):中段:高處寶箱之後的會掉平台跨過流沙
    { x: 1110, y: 240, w: 140, h: 20 },
    { x: 1310, y: 260, w: 120, h: 20 },
    { x: 5380, y: 220, w: 140, h: 20 },
    { x: 5560, y: 260, w: 140, h: 20 },
    { x: 5800, y: 300, w: 120, h: 20 },
    { x: 8310, y: 240, w: 140, h: 20 },
    { x: 6560, y: 260, w: 140, h: 20 },
    { x: 2550, y: 380, w: 140, h: 20 },
    { x: 2750, y: 300, w: 140, h: 20 },
    { x: 3000, y: 380, w: 140, h: 20 },
  ],
  sand: [
    { x: 500, w: 140 },
    { x: 1200, w: 160 },
    { x: 1900, w: 200 },
    { x: 2800, w: 180 },
    { x: 3600, w: 160 },
    { x: 4200, w: 140 },
    { x: 5000, w: 200 },
    { x: 6500, w: 180 },
    { x: 6880, w: 160 },
    { x: 7400, w: 200 },
    { x: 8300, w: 180 },
    { x: 8700, w: 160 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 4900, y: 240, w: 90, h: 20 },
    { x: 5060, y: 240, w: 90, h: 20 },
    { x: 5220, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 1880, y: 380, w: 100, dx: 140, dy: 0, periodMs: 3600 },
    { x: 6400, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1000 }, { x: 8200 }],
  thorns: [
    { x: 1450, w: 60 },
    { x: 3400, w: 60 },
    { x: 5400, w: 80 },
    { x: 8050, w: 60 },
  ],
  // 檢查點都在戰鬥區鎖住的畫面(A 2400–3360、B 6200–7160)之外,也不在流沙與仙人掌上。
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 5550, bottom: GROUND_Y },
    { x: 2750, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7990, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 商隊出發
    ...wave(200, [['bellScarab', 'right', 2]]),
    ...wave(450, [['sandSnake', 'ground', 1], ['mummyCat', 'right', 1]], 1280),
    ...wave(750, [['vulture', 'right', 1]]),
    ...wave(950, [['bellScarab', 'right', 2]]),
    ...wave(1150, [['sandSnake', 'ground', 1]], 1990),
    ...wave(1350, [['mummyCat', 'right', 2]]),
    ...wave(1600, [['vulture', 'right', 1], ['bellScarab', 'left', 1]]),
    // 2 大沙丘
    ...wave(1850, [['bellScarab', 'right', 3]]),
    ...wave(2100, [['mummyCat', 'right', 1], ['vulture', 'right', 1]]),
    ...wave(2300, [['bellScarab', 'right', 2]]),
    ...wave(3450, [['sandSnake', 'ground', 1], ['bellScarab', 'right', 1]], 3680),
    ...wave(3700, [['vulture', 'right', 2]]),
    // 3 駱駝休息站
    ...wave(3950, [['tortoise', 'right', 1]]),
    ...wave(4200, [['mummyCat', 'right', 2], ['vulture', 'right', 1]]),
    ...wave(4450, [['sandSnake', 'ground', 1], ['bellScarab', 'right', 1]], 5100),
    ...wave(4700, [['vulture', 'right', 2]]),
    ...wave(4950, [['tortoise', 'right', 1], ['mummyCat', 'left', 1]]),
    ...wave(5200, [['bellScarab', 'right', 3]]),
    // 4 流沙谷
    ...wave(5450, [['vulture', 'right', 1], ['sandSnake', 'ground', 1]], 6590),
    ...wave(5700, [['mummyCat', 'right', 2]]),
    ...wave(5950, [['bellScarab', 'left', 1], ['bellScarab', 'right', 1]]),
    ...wave(6100, [['vulture', 'right', 1]]),
    // 5 夕陽下的沙路(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['sandSnake', 'ground', 1], ['mummyCat', 'right', 1]], 7500),
    ...wave(7450, [['vulture', 'right', 2]]),
    ...wave(7650, [['tortoise', 'right', 1], ['bellScarab', 'left', 1]]),
    ...wave(7850, [['sandSnake', 'ground', 1]], 8390),
    ...wave(7950, [['bellScarab', 'right', 3]]),
    ...wave(8150, [['mummyCat', 'right', 1], ['vulture', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'bellScarab', from: 'right', delayMs: 0 },
          { type: 'vulture', from: 'right', delayMs: 500 },
          { type: 'mummyCat', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'sandSnake', from: 'ground', x: 2890, delayMs: 0 },
          { type: 'tortoise', from: 'right', delayMs: 600 },
          { type: 'vulture', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'tortoise', from: 'right', delayMs: 0 },
          { type: 'vulture', from: 'right', delayMs: 400 },
          { type: 'bellScarab', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'sandSnake', from: 'ground', x: 6590, delayMs: 0 },
          { type: 'vulture', from: 'left', delayMs: 300 },
          { type: 'mummyCat', from: 'right', delayMs: 700 },
          { type: 'tortoise', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'fennec', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w2-s2', fromScrollX: 0 }],
};
