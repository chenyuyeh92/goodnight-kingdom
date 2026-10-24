import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 2-1「綠洲」(白天):沙漠的第一關。綠洲的淺水走得慢,路上有幾小段流沙(告示牌教怎麼過)。
 * 魔物以叮噹聖甲蟲、木乃伊貓為主,後段禿鷹登場;結尾打小頭目失眠駱駝。一局約 4–5 分鐘。
 */
export const OASIS: LevelDef = {
  id: 'w2-1',
  name: '綠洲',
  world: 2,
  worldW: 10200,
  terrain: [
    // 1 綠洲入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 棕櫚樹林
    { x: 2170, y: 400, w: 120, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 帳篷市集:通往高處寶箱的階梯
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 水池邊
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 綠洲出口
    { x: 8600, y: 380, w: 180, h: 20 },
    // 小頭目區的踏板
    { x: 9500, y: 360, w: 140, h: 20 },
    { x: 9860, y: 360, w: 140, h: 20 },
    // 地形重排(2026-10-24):前段:彈跳墊上綠洲的棕櫚高台,接會掉的平台
    { x: 1060, y: 240, w: 140, h: 20 },
    { x: 1760, y: 240, w: 140, h: 20 },
    { x: 1960, y: 280, w: 120, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 3050, y: 300, w: 140, h: 20 },
    { x: 3350, y: 380, w: 140, h: 20 },
    { x: 5320, y: 240, w: 140, h: 20 },
    { x: 6750, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 100, h: 20 },
  ],
  water: {
    shallow: [
      { x: 1800, w: 250 },
      { x: 5900, w: 400 },
      { x: 7700, w: 300 },
    ],
    gaps: [],
    pads: [],
  },
  sand: [
    { x: 1100, w: 120 },
    { x: 3400, w: 160 },
    { x: 5200, w: 140 },
    { x: 8200, w: 160 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 1900, y: 240, w: 90, h: 20 },
    { x: 2060, y: 240, w: 90, h: 20 },
    { x: 2220, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 5150, y: 380, w: 120, dx: 0, dy: -140, periodMs: 4000 },
    { x: 7800, y: 340, w: 120, dx: 160, dy: 0, periodMs: 3800 },
  ],
  springs: [{ x: 1000 }, { x: 7390 }],
  thorns: [
    { x: 1300, w: 60 },
    { x: 3700, w: 60 },
    { x: 6400, w: 80 },
    { x: 8900, w: 60 },
  ],
  // 檢查點都在戰鬥區鎖住的畫面(A 2600–3560、B 6600–7560)之外,也不在流沙與仙人掌上。
  checkpoints: [150, 2100, 4100, 6100, 8100, 9100],
  chests: [
    { x: 9400, bottom: GROUND_Y }, // 魔王區的武器寶箱(每次打魔王都拿得到)
    { x: 5800, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [{ x: 980, kind: 'quicksand' }],
  trickles: [
    // 1 綠洲入口
    ...wave(200, [['bellScarab', 'right', 1]]),
    ...wave(450, [['bellScarab', 'right', 2]]),
    ...wave(700, [['mummyCat', 'right', 1]]),
    ...wave(950, [['bellScarab', 'right', 1], ['mummyCat', 'right', 1]]),
    ...wave(1250, [['bellScarab', 'left', 1]]),
    ...wave(1500, [['mummyCat', 'right', 2]]),
    // 2 棕櫚樹林
    ...wave(1800, [['bellScarab', 'right', 2]]),
    ...wave(2050, [['mummyCat', 'right', 1], ['bellScarab', 'right', 1]]),
    ...wave(2300, [['bellScarab', 'right', 2]]),
    ...wave(2450, [['mummyCat', 'right', 1]]),
    ...wave(3650, [['mummyCat', 'right', 2]]),
    // 3 帳篷市集
    ...wave(3900, [['tortoise', 'right', 1]]),
    ...wave(4150, [['bellScarab', 'right', 2], ['mummyCat', 'left', 1]]),
    ...wave(4400, [['sandSnake', 'ground', 1], ['bellScarab', 'right', 1]], 5270),
    ...wave(4650, [['mummyCat', 'right', 2]]),
    ...wave(4900, [['tortoise', 'right', 1], ['bellScarab', 'left', 1]]),
    ...wave(5150, [['vulture', 'right', 1]]),
    ...wave(5400, [['bellScarab', 'right', 3]]),
    // 4 水池邊
    ...wave(5650, [['vulture', 'right', 1], ['mummyCat', 'right', 1]]),
    ...wave(5900, [['bellScarab', 'right', 2]]),
    ...wave(6150, [['mummyCat', 'left', 1], ['bellScarab', 'right', 1]]),
    ...wave(6400, [['vulture', 'right', 2]]),
    // 5 綠洲出口(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['bellScarab', 'right', 2]]),
    ...wave(7700, [['vulture', 'right', 1], ['mummyCat', 'right', 1]]),
    ...wave(7850, [['sandSnake', 'ground', 1]], 8280),
    ...wave(7950, [['tortoise', 'right', 1], ['bellScarab', 'left', 1]]),
    ...wave(8080, [['mummyCat', 'right', 2]]),
    ...wave(8200, [['vulture', 'right', 1], ['bellScarab', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'bellScarab', from: 'right', delayMs: 0 },
          { type: 'mummyCat', from: 'right', delayMs: 600 },
          { type: 'bellScarab', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'mummyCat', from: 'top', x: 3100, delayMs: 0 },
          { type: 'sandSnake', from: 'ground', x: 3480, delayMs: 400 },
          { type: 'bellScarab', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'vulture', from: 'right', delayMs: 0 },
          { type: 'bellScarab', from: 'right', delayMs: 400 },
          { type: 'mummyCat', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'tortoise', from: 'right', delayMs: 0 },
          { type: 'vulture', from: 'left', delayMs: 300 },
          { type: 'mummyCat', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'camel', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w2-s1', fromScrollX: 0 }],
};
