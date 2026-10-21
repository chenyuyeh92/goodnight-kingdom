import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 第一關「失眠森林」:三段加關主戰。
 * 第一段教學(鬧鐘蟲、咖啡豆);第二段蝙蝠與低矮通道、隱藏寶箱在高台階梯頂端;
 * 第三段刺蝟;最後是熬夜貓頭鷹。
 */
export const FOREST: LevelDef = {
  id: 'forest',
  name: '失眠森林',
  worldW: 5600,
  terrain: [
    // 第一段
    { x: 500, y: 380, w: 200, h: 20 },
    { x: 1100, y: 340, w: 180, h: 20 },
    // 第二段:低矮通道(底部 y=444,與地面間距 36;頂端高 180 跳不上去)與通往隱藏寶箱的階梯
    { x: 2100, y: 300, w: 260, h: 144 },
    { x: 2500, y: 400, w: 100, h: 20 },
    { x: 2640, y: 320, w: 100, h: 20 },
    { x: 2780, y: 240, w: 140, h: 20 },
    // 第三段
    { x: 3400, y: 380, w: 200, h: 20 },
    { x: 3900, y: 360, w: 160, h: 20 },
    // 關主戰的踏板
    { x: 4800, y: 360, w: 140, h: 20 },
    { x: 5300, y: 360, w: 140, h: 20 },
  ],
  thorns: [
    { x: 1300, w: 60 },
    { x: 1850, w: 60 },
    { x: 3300, w: 60 },
    { x: 4200, w: 80 },
  ],
  // 第二個檢查點要在戰鬥區 A 鎖住的畫面(700–1660)之外,不然還沒打完就存到下一段。
  checkpoints: [150, 1700, 3050, 4500],
  chests: [
    { x: 820, bottom: GROUND_Y },
    { x: 2850, bottom: 240 },
    { x: 4300, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    { triggerScrollX: 200, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } },
    { triggerScrollX: 450, spawn: { type: 'coffeeBean', from: 'right', delayMs: 0 } },
    { triggerScrollX: 1300, spawn: { type: 'nightBat', from: 'right', delayMs: 0 } },
    { triggerScrollX: 1650, spawn: { type: 'nightBat', from: 'right', delayMs: 0 } },
    { triggerScrollX: 1900, spawn: { type: 'alarmBug', from: 'left', delayMs: 0 } },
    { triggerScrollX: 2800, spawn: { type: 'coffeeBean', from: 'right', delayMs: 0 } },
    { triggerScrollX: 3200, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } },
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
      lockScrollX: 2000,
      waves: [
        [
          { type: 'nightBat', from: 'left', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 300 },
          { type: 'coffeeBean', from: 'ground', x: 2500, delayMs: 600 },
        ],
        [
          { type: 'nightBat', from: 'right', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 400 },
          { type: 'alarmBug', from: 'left', delayMs: 800 },
        ],
      ],
    },
    {
      lockScrollX: 3300,
      waves: [
        [
          { type: 'hedgehog', from: 'right', delayMs: 0 },
          { type: 'alarmBug', from: 'left', delayMs: 500 },
          { type: 'alarmBug', from: 'left', delayMs: 900 },
        ],
        [
          { type: 'hedgehog', from: 'left', delayMs: 0 },
          { type: 'hedgehog', from: 'right', delayMs: 600 },
          { type: 'nightBat', from: 'top', x: 3800, delayMs: 1000 },
        ],
      ],
    },
  ],
  boss: { lockScrollX: 4640, spawnX: 5300 },
};
