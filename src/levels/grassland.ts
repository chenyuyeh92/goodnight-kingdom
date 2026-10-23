import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 1-1「森林入口的草原」(白天):教學關。前段路邊有告示牌教操作,
 * 魔物以鬧鐘蟲、咖啡豆為主,後段蝙蝠登場;結尾打小頭目大鬧鐘蟲。一局約 4–5 分鐘。
 */
export const GRASSLAND: LevelDef = {
  id: 'w1-1',
  name: '森林入口的草原',
  world: 1,
  worldW: 10200,
  terrain: [
    // 1 草原小路(教學)
    { x: 1500, y: 380, w: 160, h: 20 },
    { x: 1800, y: 400, w: 120, h: 20 },
    { x: 1960, y: 330, w: 120, h: 20 },
    // 2 小山丘
    { x: 2100, y: 400, w: 140, h: 20 },
    { x: 2300, y: 340, w: 160, h: 20 },
    // 戰鬥區 A 裡的平台
    { x: 2750, y: 380, w: 140, h: 20 },
    { x: 3050, y: 300, w: 140, h: 20 },
    { x: 3350, y: 380, w: 140, h: 20 },
    { x: 3900, y: 380, w: 180, h: 20 },
    // 3 柵欄邊:通往高處寶箱的階梯,接著是「上面的路」(會掉的平台、荊棘上方)
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5380, y: 220, w: 140, h: 20 },
    { x: 5600, y: 250, w: 140, h: 20 },
    { x: 5800, y: 260, w: 140, h: 20 },
    // 彈跳墊上方的高台
    { x: 6060, y: 230, w: 140, h: 20 },
    // 4 花田
    { x: 7000, y: 380, w: 180, h: 20 },
    { x: 7500, y: 340, w: 160, h: 20 },
    // 5 森林邊緣:上下移動的平台通往高台
    { x: 8460, y: 250, w: 140, h: 20 },
    { x: 8600, y: 380, w: 180, h: 20 },
    // 小頭目區的踏板
    { x: 9500, y: 380, w: 140, h: 20 },
    { x: 9860, y: 380, w: 140, h: 20 },
  ],
  // 會掉的平台:高處寶箱之後的上面的路(底下是荊棘)。
  crumbles: [
    { x: 4900, y: 240, w: 90, h: 20 },
    { x: 5060, y: 240, w: 90, h: 20 },
    { x: 5220, y: 240, w: 90, h: 20 },
  ],
  movers: [
    // 花田:左右來回(底下是寶箱)。
    { x: 7700, y: 360, w: 120, dx: 300, dy: 0, periodMs: 4200 },
    // 森林邊緣:上下來回,到高台。
    { x: 8300, y: 400, w: 120, dx: 0, dy: -150, periodMs: 4000 },
  ],
  springs: [{ x: 5560 }, { x: 6000 }],
  thorns: [
    { x: 1150, w: 60 },
    { x: 3700, w: 60 },
    { x: 5300, w: 80 },
    { x: 7200, w: 60 },
    { x: 8800, w: 60 },
  ],
  // 檢查點都在戰鬥區鎖住的畫面(A 2600–3560、B 6600–7560)之外。
  checkpoints: [150, 2100, 4100, 6100, 8100, 9100],
  chests: [
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  hints: [
    { x: 330, kind: 'move' },
    { x: 660, kind: 'chest' },
    { x: 1000, kind: 'jump' },
    { x: 1420, kind: 'melee' },
    { x: 5900, kind: 'aimUp' },
    { x: 6300, kind: 'crouch' },
  ],
  trickles: [
    // 1 草原小路:慢慢來
    ...wave(200, [['alarmBug', 'right', 1]]),
    ...wave(500, [['alarmBug', 'right', 2]]),
    ...wave(800, [['coffeeBean', 'right', 1]]),
    ...wave(1100, [['alarmBug', 'right', 2]]),
    ...wave(1400, [['coffeeBean', 'right', 1], ['alarmBug', 'right', 1]]),
    ...wave(1550, [['coffeeBean', 'right', 1]]),
    ...wave(1700, [['alarmBug', 'right', 3]]),
    // 2 小山丘
    ...wave(2000, [['coffeeBean', 'right', 2]]),
    ...wave(2300, [['alarmBug', 'right', 2], ['alarmBug', 'left', 1]]),
    ...wave(2450, [['coffeeBean', 'right', 2]]),
    ...wave(3300, [['alarmBug', 'right', 2]]),
    ...wave(3650, [['coffeeBean', 'ground', 1], ['alarmBug', 'right', 2]], 4300),
    ...wave(3900, [['alarmBug', 'right', 3]]),
    // 3 柵欄邊
    ...wave(4150, [['coffeeBean', 'right', 2]]),
    ...wave(4400, [['alarmBug', 'right', 2], ['coffeeBean', 'right', 1]]),
    ...wave(4650, [['alarmBug', 'left', 2]]),
    ...wave(4900, [['coffeeBean', 'right', 1], ['alarmBug', 'right', 2]]),
    ...wave(5150, [['alarmBug', 'right', 3]]),
    ...wave(5400, [['nightBat', 'right', 1]]),
    // 4 花田:蝙蝠登場
    ...wave(5550, [['alarmBug', 'left', 1], ['coffeeBean', 'right', 1]]),
    ...wave(5700, [['nightBat', 'right', 1], ['alarmBug', 'right', 1]]),
    ...wave(5950, [['coffeeBean', 'right', 2]]),
    ...wave(6200, [['nightBat', 'right', 2]]),
    ...wave(6450, [['alarmBug', 'right', 2], ['alarmBug', 'left', 1]]),
    ...wave(6800, [['nightBat', 'right', 1], ['alarmBug', 'right', 1]]),
    ...wave(7150, [['coffeeBean', 'right', 2]]),
    ...wave(7400, [['alarmBug', 'right', 2], ['nightBat', 'left', 1]]),
    ...wave(7650, [['nightBat', 'right', 1], ['coffeeBean', 'right', 1]]),
    // 5 森林邊緣
    ...wave(7900, [['alarmBug', 'right', 3]]),
    ...wave(8150, [['coffeeBean', 'ground', 1], ['nightBat', 'right', 1]], 8900),
  ],
  arenas: [
    {
      lockScrollX: 2600,
      waves: [
        [
          { type: 'alarmBug', from: 'right', delayMs: 0 },
          { type: 'alarmBug', from: 'right', delayMs: 600 },
          { type: 'coffeeBean', from: 'right', delayMs: 1200 },
        ],
        [
          { type: 'alarmBug', from: 'left', delayMs: 0 },
          { type: 'coffeeBean', from: 'ground', x: 3200, delayMs: 400 },
          { type: 'alarmBug', from: 'right', delayMs: 900 },
        ],
      ],
    },
    {
      lockScrollX: 6600,
      waves: [
        [
          { type: 'nightBat', from: 'right', delayMs: 0 },
          { type: 'alarmBug', from: 'right', delayMs: 400 },
          { type: 'alarmBug', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'coffeeBean', from: 'top', x: 7100, delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 300 },
          { type: 'coffeeBean', from: 'ground', x: 7300, delayMs: 700 },
        ],
      ],
    },
  ],
  boss: { type: 'squirrel', lockScrollX: 9240, spawnX: 9900 },
  scenes: [{ scene: 'w1-s1', fromScrollX: 0 }],
};
