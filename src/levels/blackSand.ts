import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 5-1「黑沙灘」(白天):第一次看到熔岩(告示牌教:跳過去或踩岩石平台),後段第一次遇到火山噴發。
 * 魔物以熬夜火蜥蜴、咖啡熔岩團子為主,後段吵鬧火山鳥登場;結尾打小頭目失眠溫泉河馬。一局約 4–5 分鐘。
 */
export const BLACK_SAND: LevelDef = {
  id: 'w5-1',
  name: '黑沙灘',
  world: 5,
  worldW: 10200,
  platformArt: 'rock-platform',
  terrain: [
    // 1 沙灘入口
    { x: 1500, y: 380, w: 160, h: 20 },
    // 2 熔岩小溪
    { x: 2170, y: 400, w: 120, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    { x: 3900, y: 380, w: 140, h: 20 },
    // 3 岩石堆:通往高處寶箱的岩石平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 360, w: 160, h: 20 },
    // 4 冒煙的沙丘
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 溫泉前
    { x: 8600, y: 380, w: 180, h: 20 },
    // 熔岩上的岩石平台
    // 地形重排(2026-10-24):前段
    { x: 1960, y: 230, w: 140, h: 20 },
    { x: 7330, y: 240, w: 140, h: 20 },
    { x: 7900, y: 250, w: 140, h: 20 },
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 2950, y: 300, w: 120, h: 20 },
    { x: 6700, y: 380, w: 140, h: 20 },
    { x: 3450, y: 380, w: 120, h: 20 },
    { x: 6000, y: 360, w: 120, h: 20 },
    { x: 8800, y: 300, w: 120, h: 20 },
    { x: 4100, y: 300, w: 100, h: 20 },
  ],
  lava: [
    { x: 1100, w: 90 },
    { x: 1900, w: 100 },
    { x: 3700, w: 100 },
    { x: 5000, w: 300 },
    { x: 6250, w: 100 },
    { x: 8350, w: 100 },
  ],
  eruptions: [
    { x: 8300, w: 600 },
  ],
  // 新機關:會掉的平台、移動平台、彈跳墊。
  crumbles: [
    { x: 2120, y: 240, w: 90, h: 20 },
    { x: 2270, y: 240, w: 90, h: 20 },
    { x: 2420, y: 240, w: 90, h: 20 },
  ],
  movers: [
    { x: 5040, y: 400, w: 100, dx: 120, dy: 0, periodMs: 3600 },
    { x: 7750, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 1400 }, { x: 7240 }],
  thorns: [],
  checkpoints: [150, 2100, 4060, 5800, 8100, 9100],
  chests: [
    { x: 5800, bottom: GROUND_Y },
    { x: 3000, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 950, kind: 'lava' },
    { x: 8200, kind: 'eruption' },
  ],
  trickles: [
    // 1 沙灘入口
    ...wave(200, [['salamander', 'right', 1]]),
    ...wave(450, [['salamander', 'right', 2]]),
    ...wave(700, [['lavaBlob', 'right', 1]]),
    ...wave(950, [['salamander', 'right', 1], ['lavaBlob', 'right', 1]]),
    ...wave(1250, [['salamander', 'left', 1]]),
    ...wave(1500, [['lavaBlob', 'right', 2]]),
    // 2 熔岩小溪
    ...wave(1800, [['salamander', 'right', 2]]),
    ...wave(2050, [['lavaBlob', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(2300, [['salamander', 'right', 2]]),
    ...wave(2450, [['lavaBlob', 'right', 1]]),
    ...wave(3450, [['salamander', 'right', 1]]),
    // 3 岩石堆
    ...wave(3650, [['armadillo', 'right', 1]]),
    ...wave(3900, [['salamander', 'right', 2], ['lavaBlob', 'left', 1]]),
    ...wave(4150, [['volcanoBird', 'right', 1], ['salamander', 'right', 1]]),
    ...wave(4400, [['lavaBlob', 'right', 2]]),
    ...wave(4650, [['armadillo', 'right', 1], ['salamander', 'left', 1]]),
    ...wave(4900, [['volcanoBird', 'right', 1]]),
    ...wave(5150, [['salamander', 'right', 3]]),
    // 4 冒煙的沙丘
    ...wave(5400, [['volcanoBird', 'right', 1], ['lavaBlob', 'right', 1]]),
    ...wave(5650, [['salamander', 'right', 2]]),
    ...wave(5900, [['lavaBlob', 'left', 1], ['salamander', 'right', 1]]),
    ...wave(6150, [['volcanoBird', 'right', 2]]),
    // 5 溫泉前(零星魔物在小頭目前一個畫面就結束)
    ...wave(7550, [['salamander', 'right', 2]]),
    ...wave(7700, [['volcanoBird', 'right', 1], ['lavaBlob', 'right', 1]]),
    ...wave(7850, [['armadillo', 'right', 1]]),
    ...wave(7950, [['salamander', 'right', 1], ['lavaBlob', 'left', 1]]),
    ...wave(8080, [['salamander', 'right', 2]]),
    ...wave(8200, [['volcanoBird', 'right', 1], ['salamander', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'salamander', from: 'right', delayMs: 0 },
          { type: 'lavaBlob', from: 'right', delayMs: 600 },
          { type: 'salamander', from: 'left', delayMs: 1200 },
        ],
        [
          { type: 'lavaBlob', from: 'top', x: 3100, delayMs: 0 },
          { type: 'volcanoBird', from: 'right', delayMs: 400 },
          { type: 'salamander', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'volcanoBird', from: 'right', delayMs: 0 },
          { type: 'salamander', from: 'right', delayMs: 400 },
          { type: 'lavaBlob', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'armadillo', from: 'right', delayMs: 0 },
          { type: 'volcanoBird', from: 'left', delayMs: 300 },
          { type: 'salamander', from: 'top', x: 7200, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'hippo', lockScrollX: 9240, spawnX: 10060 },
  scenes: [{ scene: 'w5-s1', fromScrollX: 0 }],
};
