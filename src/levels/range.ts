import { GROUND_Y, type LevelDef } from './levelDef';

/** 測試靶場:調手感、測魔物與武器用。 */
export const RANGE: LevelDef = {
  id: 'range',
  name: '測試靶場',
  world: 1,
  worldW: 3200,
  terrain: [
    { x: 600, y: 380, w: 200, h: 20 },
    { x: 1000, y: 300, w: 200, h: 20 },
    { x: 1700, y: 380, w: 240, h: 20 },
    // 低矮通道的天花板,底部 y=444,與地面間距 36。
    { x: 1300, y: 380, w: 200, h: 64 },
  ],
  thorns: [
    { x: 520, w: 60 },
    { x: 1580, w: 60 },
    { x: 2380, w: 80 },
  ],
  checkpoints: [150, 1200, 2000],
  chests: [
    { x: 960, bottom: GROUND_Y },
    { x: 1100, bottom: 300 },
    { x: 2600, bottom: GROUND_Y },
  ],
  targets: [
    { x: 450, bottom: GROUND_Y },
    { x: 900, bottom: GROUND_Y },
    { x: 2100, bottom: GROUND_Y },
    { x: 2300, bottom: GROUND_Y },
    { x: 2500, bottom: GROUND_Y },
    { x: 1100, bottom: 220 },
  ],
  trickles: [
    { triggerScrollX: 300, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } },
    { triggerScrollX: 700, spawn: { type: 'nightBat', from: 'right', delayMs: 0 } },
  ],
  arenas: [
    {
      lockScrollX: 1500,
      waves: [
        [
          { type: 'alarmBug', from: 'right', delayMs: 0 },
          { type: 'alarmBug', from: 'right', delayMs: 500 },
          { type: 'alarmBug', from: 'right', delayMs: 1000 },
        ],
        [
          { type: 'nightBat', from: 'left', delayMs: 0 },
          { type: 'nightBat', from: 'right', delayMs: 300 },
          { type: 'coffeeBean', from: 'top', x: 1980, delayMs: 600 },
        ],
        [
          { type: 'hedgehog', from: 'right', delayMs: 0 },
          { type: 'coffeeBean', from: 'ground', x: 1700, delayMs: 800 },
        ],
      ],
    },
    {
      lockScrollX: 2240,
      waves: [
        [
          { type: 'coffeeBean', from: 'ground', x: 2600, delayMs: 0 },
          { type: 'coffeeBean', from: 'ground', x: 2850, delayMs: 400 },
          { type: 'alarmBug', from: 'left', delayMs: 800 },
        ],
      ],
    },
  ],
  boss: null,
  scenes: [{ scene: 'w1-s3', fromScrollX: 0 }],
};
