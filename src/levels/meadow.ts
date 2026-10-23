import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 8-1「高山草甸」(白天):第一次遇到強風(告示牌教:風一陣一陣往回吹,風停的時候快往前走)。
 * 魔物以熬夜鼠兔、咖啡雲精靈為主,後段吵鬧老鷹登場;結尾打小頭目熬夜山羊。一局約 4–5 分鐘。
 */
export const MEADOW: LevelDef = {
  id: 'w8-1',
  name: '高山草甸',
  world: 8,
  worldW: 10200,
  platformArt: 'cloud-platform',
  terrain: [
    // 1 草甸入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 野花坡
    { x: 2170, y: 400, w: 120, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 140, h: 20 },
    // 3 大石頭:通往高處寶箱的雲朵平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    // 4 風口
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 山壁下
    { x: 8600, y: 380, w: 180, h: 20 },
    { x: 9400, y: 340, w: 120, h: 20 }, // 山羊衝撞時站上雲朵平台躲
    { x: 9720, y: 340, w: 120, h: 20 },
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
  // 強風區:風一陣一陣往左吹(不在雲海旁邊)。
  winds: [
    { x: 1300, w: 800 },
    { x: 3700, w: 1400 },
    { x: 7600, w: 900 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 6240, y: 240, w: 90, h: 20 },
    { x: 6400, y: 240, w: 90, h: 20 },
    { x: 6560, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 7700, y: 340, w: 120, dx: 240, dy: 0, periodMs: 4200 },
    { x: 8300, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1100 }, { x: 6000 }],
  thorns: [],
  checkpoints: [150, 2100, 4060, 5800, 8100, 9100],
  chests: [
    { x: 5720, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 1200, kind: 'wind' },
  ],
  trickles: [
    // 1 草甸入口
    ...wave(200, [['pika', 'right', 1]]),
    ...wave(450, [['pika', 'right', 2]]),
    ...wave(700, [['coffeeCloud', 'right', 1]]),
    ...wave(950, [['pika', 'right', 1], ['coffeeCloud', 'right', 1]]),
    ...wave(1250, [['pika', 'left', 1]]),
    ...wave(1500, [['coffeeCloud', 'right', 2]]),
    // 2 野花坡
    ...wave(1800, [['pika', 'right', 2]]),
    ...wave(2050, [['coffeeCloud', 'right', 1], ['pika', 'right', 1]]),
    ...wave(2300, [['pika', 'right', 2]]),
    ...wave(2450, [['coffeeCloud', 'right', 1]]),
    ...wave(3450, [['pika', 'right', 1]]),
    // 3 大石頭
    ...wave(3650, [['yak', 'right', 1]]),
    ...wave(3900, [['pika', 'right', 2], ['coffeeCloud', 'left', 1]]),
    ...wave(4150, [['eagle', 'right', 1], ['pika', 'right', 1]]),
    ...wave(4400, [['coffeeCloud', 'right', 2]]),
    ...wave(4650, [['yak', 'right', 1], ['pika', 'left', 1]]),
    ...wave(4900, [['eagle', 'right', 1]]),
    ...wave(5150, [['pika', 'right', 3]]),
    // 4 風口
    ...wave(5400, [['eagle', 'right', 1], ['coffeeCloud', 'right', 1]]),
    ...wave(5650, [['pika', 'right', 2]]),
    ...wave(5900, [['coffeeCloud', 'left', 1], ['pika', 'right', 1]]),
    ...wave(6150, [['eagle', 'right', 2]]),
    // 5 山壁下(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['pika', 'right', 2]]),
    ...wave(7700, [['eagle', 'right', 1], ['coffeeCloud', 'right', 1]]),
    ...wave(7850, [['yak', 'right', 1]]),
    ...wave(7950, [['pika', 'right', 1], ['coffeeCloud', 'left', 1]]),
    ...wave(8080, [['pika', 'right', 2]]),
    ...wave(8200, [['eagle', 'right', 1], ['pika', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'pika', from: 'right', delayMs: 0 },
          { type: 'coffeeCloud', from: 'right', delayMs: 600 },
          { type: 'pika', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'coffeeCloud', from: 'top', x: 3100, delayMs: 0 },
          { type: 'eagle', from: 'right', delayMs: 400 },
          { type: 'pika', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'eagle', from: 'right', delayMs: 0 },
          { type: 'pika', from: 'right', delayMs: 400 },
          { type: 'coffeeCloud', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'yak', from: 'right', delayMs: 0 },
          { type: 'eagle', from: 'left', delayMs: 300 },
          { type: 'pika', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'goat', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w8-s1', fromScrollX: 0 }],
};
