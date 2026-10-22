import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 1-2「河邊」(黃昏):淺水走得慢、河溝要跳過去、寬的河溝中間有荷葉可以踩。
 * 掉進河裡扣一顆愛心,從左岸重新出來。結尾打小頭目刺蝟隊長。一局約 4–5 分鐘。
 */
export const RIVER: LevelDef = {
  id: 'w1-2',
  name: '河邊',
  world: 1,
  worldW: 10200,
  terrain: [
    // 1 河岸小路
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 淺灘
    { x: 2300, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 蘆葦叢:通往高處寶箱的階梯
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 河灣
    { x: 6900, y: 360, w: 160, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 夕陽下的木棧道
    { x: 9000, y: 380, w: 160, h: 20 },
    // 小頭目區的踏板
    { x: 9500, y: 380, w: 140, h: 20 },
    { x: 9860, y: 380, w: 140, h: 20 },
  ],
  water: {
    shallow: [
      { x: 400, w: 300 },
      { x: 1900, w: 500 },
      { x: 4100, w: 250 },
      { x: 6000, w: 400 },
      { x: 8700, w: 300 },
    ],
    // 寬度 ≤ 110 的跳得過去;寬的中間有荷葉。
    gaps: [
      { x: 1200, w: 70 },
      { x: 2800, w: 110 },
      { x: 3600, w: 240 },
      { x: 5000, w: 220 },
      { x: 7400, w: 110 },
      { x: 8300, w: 300 },
    ],
    pads: [
      { x: 3690, y: 470, w: 60 },
      { x: 5080, y: 470, w: 60 },
      { x: 8370, y: 470, w: 50 },
      { x: 8490, y: 470, w: 50 },
    ],
  },
  thorns: [
    { x: 1450, w: 60 },
    { x: 3400, w: 60 },
    { x: 6600, w: 80 },
    { x: 8000, w: 60 },
  ],
  // 檢查點都在地面上(不在河溝),也不在戰鬥區(A 2400–3360、B 6200–7160)的畫面裡。
  checkpoints: [150, 2100, 4100, 6000, 7880, 9100],
  chests: [
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 河岸小路
    ...wave(200, [['alarmBug', 'right', 2]]),
    ...wave(500, [['coffeeBean', 'right', 1], ['alarmBug', 'right', 1]]),
    ...wave(800, [['nightBat', 'right', 1]]),
    ...wave(950, [['coffeeBean', 'right', 1]]),
    ...wave(1100, [['alarmBug', 'right', 2]]),
    ...wave(1400, [['coffeeBean', 'right', 2]]),
    ...wave(1550, [['alarmBug', 'right', 1]]),
    ...wave(1700, [['nightBat', 'right', 1], ['alarmBug', 'left', 1]]),
    // 2 淺灘
    ...wave(2000, [['alarmBug', 'right', 3]]),
    ...wave(2250, [['alarmBug', 'right', 2]]),
    ...wave(2700, [['coffeeBean', 'right', 2]]),
    ...wave(3100, [['nightBat', 'right', 1]]),
    ...wave(3400, [['nightBat', 'right', 2]]),
    ...wave(3650, [['coffeeBean', 'right', 2]]),
    // 3 蘆葦叢
    ...wave(3900, [['hedgehog', 'right', 1]]),
    ...wave(4150, [['alarmBug', 'right', 2], ['nightBat', 'right', 1]]),
    ...wave(4400, [['coffeeBean', 'ground', 1], ['alarmBug', 'right', 1]], 5300),
    ...wave(4650, [['nightBat', 'right', 2]]),
    ...wave(4900, [['hedgehog', 'right', 1], ['alarmBug', 'left', 1]]),
    ...wave(5150, [['alarmBug', 'right', 3]]),
    // 4 河灣
    ...wave(5400, [['nightBat', 'right', 1], ['coffeeBean', 'right', 1]]),
    ...wave(5650, [['alarmBug', 'right', 2]]),
    ...wave(5900, [['alarmBug', 'left', 1], ['coffeeBean', 'right', 1]]),
    ...wave(6450, [['nightBat', 'right', 2]]),
    ...wave(6900, [['alarmBug', 'right', 2]]),
    ...wave(7250, [['hedgehog', 'right', 1], ['nightBat', 'right', 1]]),
    ...wave(7500, [['coffeeBean', 'right', 2], ['alarmBug', 'left', 1]]),
    // 5 木棧道
    ...wave(7750, [['nightBat', 'right', 2]]),
    ...wave(8000, [['alarmBug', 'right', 3]]),
    ...wave(8200, [['hedgehog', 'left', 1], ['coffeeBean', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'alarmBug', from: 'right', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 500 },
          { type: 'alarmBug', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'coffeeBean', from: 'top', x: 3000, delayMs: 0 },
          { type: 'hedgehog', from: 'right', delayMs: 600 },
          { type: 'nightBat', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'hedgehog', from: 'right', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 400 },
          { type: 'alarmBug', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'nightBat', from: 'right', delayMs: 0 },
          { type: 'nightBat', from: 'left', delayMs: 300 },
          { type: 'coffeeBean', from: 'ground', x: 6700, delayMs: 700 },
          { type: 'hedgehog', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'hedgehogCaptain', lockScrollX: 9240, spawnX: 9900 },
  scenes: [{ scene: 'w1-s2', fromScrollX: 0 }],
};
