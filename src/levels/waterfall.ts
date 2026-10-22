import { wave } from './build';
import { GROUND_Y, type LevelDef } from './levelDef';

/**
 * 世界 6-2「瀑布」(黃昏):河溝比較多,三條要盪藤蔓過去。
 * 四種魔物都會出現。結尾打小頭目熬夜美洲豹。一局約 4–5 分鐘。
 */
export const WATERFALL: LevelDef = {
  id: 'w6-2',
  name: '瀑布',
  world: 6,
  worldW: 10200,
  platformArt: 'log-platform',
  terrain: [
    // 1 瀑布下
    { x: 700, y: 380, w: 160, h: 20 },
    { x: 1600, y: 360, w: 160, h: 20 },
    // 2 水潭
    { x: 2200, y: 380, w: 180, h: 20 },
    { x: 3200, y: 360, w: 160, h: 20 },
    // 3 岩壁:通往高處寶箱的木頭平台
    { x: 4400, y: 400, w: 100, h: 20 },
    { x: 4540, y: 320, w: 100, h: 20 },
    { x: 4680, y: 240, w: 140, h: 20 },
    { x: 5600, y: 380, w: 180, h: 20 },
    // 4 瀑布上
    { x: 6900, y: 380, w: 120, h: 20 },
    { x: 7700, y: 380, w: 160, h: 20 },
    // 5 溪流
    { x: 9000, y: 380, w: 160, h: 20 },
  ],
  // 河溝:窄的跳得過,寬的要抓藤蔓盪過去。
  water: {
    shallow: [],
    gaps: [
      { x: 400, w: 100 },
      { x: 1050, w: 280 },
      { x: 3500, w: 110 },
      { x: 5000, w: 280 },
      { x: 7300, w: 100 },
      { x: 8300, w: 280 },
    ],
    pads: [],
  },
  vines: [
    { x: 1120, top: 150 },
    { x: 5070, top: 150 },
    { x: 8370, top: 150 },
  ],
  thorns: [],
  checkpoints: [150, 2160, 4060, 5960, 7880, 9100],
  chests: [
    { x: 900, bottom: GROUND_Y },
    { x: 4750, bottom: 240 },
    { x: 7950, bottom: GROUND_Y },
  ],
  targets: [],
  trickles: [
    // 1 瀑布下
    ...wave(200, [['treeFrog', 'right', 2]]),
    ...wave(450, [['chameleon', 'right', 1], ['parrot', 'right', 1]]),
    ...wave(700, [['treeFrog', 'right', 2]]),
    ...wave(950, [['parrot', 'right', 1]]),
    ...wave(1150, [['chameleon', 'right', 1], ['treeFrog', 'left', 1]]),
    ...wave(1350, [['treeFrog', 'right', 2]]),
    ...wave(1600, [['parrot', 'right', 1], ['chameleon', 'right', 1]]),
    // 2 水潭
    ...wave(1850, [['treeFrog', 'right', 3]]),
    ...wave(2100, [['pangolin', 'right', 1]]),
    ...wave(2300, [['parrot', 'right', 2]]),
    ...wave(3450, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(3700, [['parrot', 'right', 2]]),
    // 3 岩壁
    ...wave(3950, [['pangolin', 'right', 1]]),
    ...wave(4200, [['treeFrog', 'right', 2], ['parrot', 'right', 1]]),
    ...wave(4450, [['chameleon', 'right', 2]]),
    ...wave(4700, [['parrot', 'right', 2]]),
    ...wave(4950, [['pangolin', 'right', 1], ['treeFrog', 'left', 1]]),
    ...wave(5200, [['treeFrog', 'right', 3]]),
    // 4 瀑布上
    ...wave(5450, [['parrot', 'right', 1], ['chameleon', 'right', 1]]),
    ...wave(5700, [['treeFrog', 'right', 2]]),
    ...wave(5950, [['chameleon', 'left', 1], ['treeFrog', 'right', 1]]),
    ...wave(6100, [['parrot', 'right', 1]]),
    // 5 溪流(零星魔物在小頭目前一個畫面就結束)
    ...wave(7300, [['pangolin', 'right', 1], ['treeFrog', 'left', 1]]),
    ...wave(7450, [['parrot', 'right', 2]]),
    ...wave(7650, [['chameleon', 'right', 1], ['treeFrog', 'right', 1]]),
    ...wave(7850, [['treeFrog', 'right', 2]]),
    ...wave(7950, [['parrot', 'right', 1]]),
    ...wave(8150, [['chameleon', 'right', 1], ['parrot', 'right', 1]]),
  ],
  arenas: [
    {
      lockScrollX: 2400,
      waves: [
        [
          { type: 'treeFrog', from: 'right', delayMs: 0 },
          { type: 'parrot', from: 'right', delayMs: 500 },
          { type: 'chameleon', from: 'left', delayMs: 1000 },
        ],
        [
          { type: 'pangolin', from: 'right', delayMs: 0 },
          { type: 'treeFrog', from: 'left', delayMs: 600 },
          { type: 'parrot', from: 'left', delayMs: 1000 },
        ],
      ],
    },
    {
      lockScrollX: 6200,
      waves: [
        [
          { type: 'pangolin', from: 'right', delayMs: 0 },
          { type: 'parrot', from: 'right', delayMs: 400 },
          { type: 'treeFrog', from: 'left', delayMs: 800 },
        ],
        [
          { type: 'chameleon', from: 'right', delayMs: 0 },
          { type: 'parrot', from: 'left', delayMs: 300 },
          { type: 'treeFrog', from: 'right', delayMs: 700 },
          { type: 'pangolin', from: 'left', delayMs: 1100 },
        ],
      ],
    },
  ],
  boss: { type: 'jaguar', lockScrollX: 9240, spawnX: 9950 },
  scenes: [{ scene: 'w6-s2', fromScrollX: 0 }],
};
