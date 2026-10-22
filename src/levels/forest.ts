import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 1-3「失眠森林」:五段加關主戰,一局約 4–5 分鐘,以邊走邊打為主。
 * 1 林間小路(教學)→ 2 蘑菇坡(上下兩條路,上路盡頭有寶箱)→ 3 低矮樹洞(蹲著過、隱藏寶箱)
 * → 4 刺蝟谷 → 5 貓頭鷹之巢前(前後夾擊)→ 熬夜貓頭鷹。
 */
export const FOREST: LevelDef = {
  id: 'forest',
  name: '失眠森林',
  world: 1,
  worldW: 10960,
  terrain: [
    // 1 林間小路
    { x: 500, y: 380, w: 200, h: 20 },
    { x: 1100, y: 340, w: 180, h: 20 },
    { x: 1700, y: 380, w: 160, h: 20 },
    // 2 蘑菇坡:上路是一串平台,下路地面魔物多又有荊棘
    { x: 2400, y: 400, w: 120, h: 20 },
    { x: 2560, y: 320, w: 140, h: 20 },
    { x: 2760, y: 300, w: 160, h: 20 },
    { x: 2980, y: 300, w: 160, h: 20 },
    { x: 3200, y: 290, w: 160, h: 20 },
    { x: 3420, y: 300, w: 160, h: 20 },
    { x: 3640, y: 300, w: 160, h: 20 },
    { x: 3820, y: 280, w: 140, h: 20 },
    // 3 低矮樹洞:通道底部 y=444(與地面間距 36),頂端高 180 跳不上去;之後是通往隱藏寶箱的階梯
    { x: 4500, y: 300, w: 260, h: 144 },
    { x: 4900, y: 400, w: 100, h: 20 },
    { x: 5040, y: 320, w: 100, h: 20 },
    { x: 5180, y: 240, w: 140, h: 20 },
    // 4 刺蝟谷
    { x: 6600, y: 380, w: 200, h: 20 },
    { x: 7100, y: 360, w: 160, h: 20 },
    { x: 7700, y: 380, w: 200, h: 20 },
    // 5 貓頭鷹之巢前
    { x: 8800, y: 380, w: 180, h: 20 },
    { x: 9300, y: 340, w: 160, h: 20 },
    { x: 9700, y: 380, w: 180, h: 20 },
    // 關主戰的踏板
    { x: 10160, y: 360, w: 140, h: 20 },
    { x: 10660, y: 360, w: 140, h: 20 },
  ],
  thorns: [
    { x: 1300, w: 60 },
    { x: 1950, w: 60 },
    { x: 2800, w: 80 },
    { x: 3300, w: 80 },
    { x: 3700, w: 60 },
    { x: 6900, w: 60 },
    { x: 7500, w: 80 },
    { x: 9050, w: 60 },
  ],
  // 檢查點都放在戰鬥區鎖住的畫面之外(A 700–1660、B 5300–6260、C 7300–8260)。
  checkpoints: [150, 2250, 4250, 6300, 8450, 9900],
  chests: [
    { x: 820, bottom: GROUND_Y },
    { x: 3890, bottom: 280 },
    { x: 5250, bottom: 240 },
    { x: 8350, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 林間小路
    ...wave(150, [['alarmBug', 'right', 2]]),
    ...wave(400, [['coffeeBean', 'right', 1]]),
    ...wave(600, [['alarmBug', 'right', 1], ['coffeeBean', 'right', 1]]),
    ...wave(1000, [['alarmBug', 'right', 3]]),
    ...wave(1300, [['coffeeBean', 'right', 2], ['alarmBug', 'left', 1]]),
    ...wave(1600, [['alarmBug', 'right', 2]]),
    // 2 蘑菇坡
    ...wave(1950, [['nightBat', 'right', 1]]),
    ...wave(2200, [['alarmBug', 'right', 2], ['coffeeBean', 'ground', 1]], 2900),
    ...wave(2450, [['nightBat', 'right', 2]]),
    ...wave(2700, [['coffeeBean', 'right', 2]]),
    ...wave(2950, [['alarmBug', 'right', 3]]),
    ...wave(3200, [['nightBat', 'right', 1], ['alarmBug', 'left', 1]]),
    ...wave(3450, [['coffeeBean', 'ground', 1], ['alarmBug', 'right', 2]], 4100),
    // 3 低矮樹洞
    ...wave(3700, [['nightBat', 'right', 2]]),
    ...wave(3950, [['alarmBug', 'right', 2]]),
    ...wave(4200, [['coffeeBean', 'right', 1], ['nightBat', 'right', 1]]),
    // 從左邊來的要生在樹洞(4500–4760)之後,不會卡在天花板裡。
    ...wave(4850, [['alarmBug', 'left', 2]]),
    ...wave(4900, [['nightBat', 'right', 2]]),
    ...wave(5100, [['coffeeBean', 'right', 2]]),
    // 4 刺蝟谷
    ...wave(5700, [['hedgehog', 'right', 1]]),
    ...wave(5950, [['alarmBug', 'right', 2], ['nightBat', 'right', 1]]),
    ...wave(6250, [['hedgehog', 'right', 1], ['coffeeBean', 'right', 1]]),
    ...wave(6550, [['nightBat', 'right', 2], ['alarmBug', 'left', 1]]),
    ...wave(6850, [['hedgehog', 'right', 1], ['alarmBug', 'right', 2]]),
    ...wave(7100, [['coffeeBean', 'ground', 1], ['nightBat', 'right', 1]], 7900),
    // 5 貓頭鷹之巢前:前後夾擊;最後一組在關主鎖定點前一個畫面結束
    ...wave(7700, [['alarmBug', 'right', 2], ['alarmBug', 'left', 1]]),
    ...wave(7950, [['hedgehog', 'right', 1], ['nightBat', 'right', 1]]),
    ...wave(8200, [['coffeeBean', 'right', 2], ['nightBat', 'left', 1]]),
    ...wave(8450, [['alarmBug', 'right', 3]]),
    ...wave(8700, [['hedgehog', 'left', 1], ['nightBat', 'right', 1]]),
    ...wave(8950, [['coffeeBean', 'right', 1], ['alarmBug', 'left', 2]]),
  ],
  arenas: [
    {
      lockScrollX: 700,
      waves: [
        [
          { type: 'alarmBug', from: 'right', delayMs: 0 },
          { type: 'alarmBug', from: 'right', delayMs: 500 },
          { type: 'alarmBug', from: 'right', delayMs: 1000 },
        ],
        [
          { type: 'coffeeBean', from: 'top', x: 1300, delayMs: 0 },
          { type: 'coffeeBean', from: 'ground', x: 1500, delayMs: 400 },
        ],
      ],
    },
    {
      lockScrollX: 5300,
      waves: [
        [
          { type: 'nightBat', from: 'left', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 300 },
          { type: 'coffeeBean', from: 'ground', x: 5800, delayMs: 600 },
        ],
        [
          { type: 'nightBat', from: 'right', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 400 },
          { type: 'alarmBug', from: 'left', delayMs: 800 },
          { type: 'alarmBug', from: 'right', delayMs: 1200 },
        ],
      ],
    },
    {
      lockScrollX: 7300,
      waves: [
        [
          { type: 'hedgehog', from: 'right', delayMs: 0 },
          { type: 'alarmBug', from: 'left', delayMs: 500 },
          { type: 'alarmBug', from: 'left', delayMs: 900 },
        ],
        [
          { type: 'hedgehog', from: 'left', delayMs: 0 },
          { type: 'hedgehog', from: 'right', delayMs: 600 },
          { type: 'nightBat', from: 'top', x: 7800, delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { type: 'nightOwl', lockScrollX: 10000, spawnX: 10660 },
  // 深林(晚上),關主前換成貓頭鷹的大樹(深夜)。
  scenes: [
    { scene: 'w1-s3', fromScrollX: 0 },
    { scene: 'w1-s4', fromScrollX: 9300 },
  ],
};
