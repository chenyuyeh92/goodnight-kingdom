import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 2-3「金字塔外」(晚上)→ 人面獅身神殿(深夜):金字塔的機關,踩到壓力板上面會掉沙磚
 * (掉下來的沙磚可以暫時當踏板),也有流沙。結尾打世界關主睡不著的人面獅身。一局約 4–5 分鐘。
 */
export const PYRAMID: LevelDef = {
  id: 'w2-3',
  name: '金字塔外',
  world: 2,
  worldW: 10200,
  terrain: [
    // 1 方尖碑大道
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 倒下的石柱
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 金字塔邊:通往高處寶箱的石階
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    // 4 機關走廊
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 神殿前
    { x: 8600, y: 380, w: 180, h: 20 },
    // 地形重排(2026-10-24):中段
    { x: 5380, y: 220, w: 140, h: 20 },
    { x: 5560, y: 250, w: 140, h: 20 },
    { x: 5760, y: 290, w: 140, h: 20 },
    { x: 2290, y: 210, w: 120, h: 20 },
    { x: 7340, y: 240, w: 140, h: 20 },
    { x: 3300, y: 250, w: 140, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 2950, y: 300, w: 120, h: 20 },
    { x: 6700, y: 380, w: 140, h: 20 },
    { x: 6900, y: 300, w: 120, h: 20 },
    { x: 3650, y: 380, w: 120, h: 20 },
    { x: 550, y: 380, w: 120, h: 20 },
  ],
  sand: [
    { x: 1100, w: 140 },
    { x: 3500, w: 160 },
    { x: 5200, w: 160 },
    { x: 8200, w: 180 },
  ],
  // 壓力板:沙磚掉在玩家前面的路上,看到影子要停一下或快跑過去。
  plates: [
    { x: 800, drops: [880, 960] },
    { x: 1900, drops: [1980, 2060, 2140] },
    { x: 4100, drops: [4180, 4260] },
    { x: 5900, drops: [5980, 6060, 6140] },
    { x: 7800, drops: [7880, 7960, 8040] },
    { x: 8900, drops: [8980, 9060] },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 4900, y: 240, w: 90, h: 20 },
    { x: 5060, y: 240, w: 90, h: 20 },
    { x: 5220, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 3150, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
    { x: 8240, y: 380, w: 100, dx: 160, dy: 0, periodMs: 3600 },
  ],
  springs: [{ x: 2250 }, { x: 7300 }],
  thorns: [
    { x: 1300, w: 60 },
    { x: 3750, w: 60 },
    { x: 6450, w: 80 },
    { x: 8480, w: 60 },
  ],
  // 檢查點都在戰鬥區鎖住的畫面(A 2600–3560、B 6600–7560)之外,也不在流沙、仙人掌與壓力板上。
  checkpoints: [150, 2400, 3980, 6300, 8100, 9050],
  chests: [
    { x: 600, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7650, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [{ x: 680, kind: 'plate' }],
  trickles: [
    // 1 方尖碑大道
    ...wave(200, [['mummyCat', 'right', 1], ['bellScarab', 'right', 1]]),
    ...wave(450, [['vulture', 'right', 1]]),
    ...wave(700, [['bellScarab', 'right', 2]]),
    ...wave(950, [['sandSnake', 'ground', 1], ['mummyCat', 'right', 1]], 1170),
    ...wave(1200, [['vulture', 'right', 2]]),
    ...wave(1450, [['tortoise', 'right', 1]]),
    // 2 倒下的石柱
    ...wave(1700, [['bellScarab', 'right', 2], ['mummyCat', 'left', 1]]),
    ...wave(1950, [['vulture', 'right', 1], ['mummyCat', 'right', 1]]),
    ...wave(2200, [['bellScarab', 'right', 3]]),
    ...wave(2450, [['vulture', 'right', 1]]),
    ...wave(3650, [['sandSnake', 'ground', 1], ['tortoise', 'right', 1]], 3580),
    // 3 金字塔邊
    ...wave(3900, [['mummyCat', 'right', 2], ['vulture', 'right', 1]]),
    ...wave(4150, [['bellScarab', 'left', 1], ['bellScarab', 'right', 2]]),
    ...wave(4400, [['tortoise', 'right', 1], ['vulture', 'right', 1]]),
    ...wave(4650, [['sandSnake', 'ground', 1], ['mummyCat', 'right', 1]], 5280),
    ...wave(4900, [['vulture', 'right', 2]]),
    ...wave(5150, [['bellScarab', 'right', 2], ['mummyCat', 'left', 1]]),
    // 4 機關走廊
    ...wave(5400, [['tortoise', 'right', 1], ['vulture', 'right', 1]]),
    ...wave(5650, [['mummyCat', 'right', 2]]),
    ...wave(5900, [['bellScarab', 'right', 2], ['vulture', 'left', 1]]),
    ...wave(6150, [['mummyCat', 'right', 1], ['bellScarab', 'right', 1]]),
    ...wave(6400, [['vulture', 'right', 2]]),
    // 5 神殿前(零星魔物在關主前一個畫面就結束)
    ...wave(7450, [['bellScarab', 'right', 1]]),
    ...wave(7600, [['tortoise', 'right', 1], ['mummyCat', 'left', 1]]),
    ...wave(7750, [['vulture', 'right', 2]]),
    ...wave(7900, [['sandSnake', 'ground', 1]], 8290),
    ...wave(8000, [['bellScarab', 'right', 3]]),
    ...wave(8150, [['mummyCat', 'right', 1], ['vulture', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'mummyCat', from: 'right', delayMs: 0 },
          { type: 'vulture', from: 'right', delayMs: 500 },
          { type: 'bellScarab', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'tortoise', from: 'right', delayMs: 0 },
          { type: 'sandSnake', from: 'ground', x: 3560, delayMs: 400 },
          { type: 'vulture', from: 'left', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'tortoise', from: 'right', delayMs: 0 },
          { type: 'tortoise', from: 'left', delayMs: 600 },
          { type: 'vulture', from: 'right', delayMs: 900 },
        ],
        [
          { type: 'mummyCat', from: 'top', x: 7100, delayMs: 0 },
          { type: 'vulture', from: 'right', delayMs: 300 },
          { type: 'bellScarab', from: 'left', delayMs: 600 },
          { type: 'mummyCat', from: 'right', delayMs: 1000 },
        ],
      ],
    },
  ],
  // 貼著世界右邊,玩家不能躲到人面獅身背後。
  boss: { type: 'sphinx', lockScrollX: 9240, spawnX: 10130 },
  scenes: [
    { scene: 'w2-s3', fromScrollX: 0 },
    { scene: 'w2-s4', fromScrollX: 8400 },
  ],
};
