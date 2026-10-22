import { MAX_DT_MS } from '../config/tuning';

export type EnemyType =
  | 'alarmBug'
  | 'coffeeBean'
  | 'nightBat'
  | 'hedgehog'
  | 'nightOwl'
  | 'squirrel'
  | 'beaver'
  | 'bellScarab'
  | 'mummyCat'
  | 'sandSnake'
  | 'vulture'
  | 'tortoise'
  | 'camel'
  | 'fennec'
  | 'sphinx'
  | 'jellyfish'
  | 'clownfish'
  | 'octopus'
  | 'puffer'
  | 'hermitCrab'
  | 'eel'
  | 'nessie'
  | 'penguin'
  | 'snowman'
  | 'puffin'
  | 'walrus'
  | 'polarBear'
  | 'narwhal'
  | 'yeti'
  | 'salamander'
  | 'lavaBlob'
  | 'volcanoBird'
  | 'armadillo'
  | 'hippo'
  | 'snail'
  | 'dragon'
  | 'treeFrog'
  | 'chameleon'
  | 'parrot'
  | 'pangolin'
  | 'sloth'
  | 'jaguar'
  | 'gorilla';
export type EnemyTier = 'minion' | 'mid' | 'high' | 'boss';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  tier: EnemyTier;
  hp: number;
  w: number;
  h: number;
  color: number;
  flying: boolean;
  /** 正面有刺盾,擋住迎面的水平子彈。 */
  shield: boolean;
}

export const ENEMY_DEFS: Readonly<Record<EnemyType, EnemyDef>> = {
  alarmBug: { type: 'alarmBug', name: '吵鬧鬧鐘蟲', tier: 'minion', hp: 2, w: 38, h: 44, color: 0xe8a87c, flying: false, shield: false },
  coffeeBean: { type: 'coffeeBean', name: '咖啡豆精靈', tier: 'minion', hp: 2, w: 30, h: 40, color: 0x8b5e3c, flying: false, shield: false },
  nightBat: { type: 'nightBat', name: '熬夜蝙蝠', tier: 'minion', hp: 1, w: 42, h: 30, color: 0x5c4b8a, flying: true, shield: false },
  hedgehog: { type: 'hedgehog', name: '失眠刺蝟', tier: 'mid', hp: 6, w: 60, h: 48, color: 0xa0a0b8, flying: false, shield: true },
  nightOwl: { type: 'nightOwl', name: '熬夜貓頭鷹', tier: 'boss', hp: 60, w: 110, h: 100, color: 0x8a7a5c, flying: true, shield: false },
  // 小頭目(美術原圖 150 高,畫成 0.8 倍;判定比圖小一點)。
  squirrel: { type: 'squirrel', name: '失眠大松鼠', tier: 'boss', hp: 35, w: 100, h: 110, color: 0xe8e0f0, flying: false, shield: false },
  beaver: { type: 'beaver', name: '熬夜大河狸', tier: 'boss', hp: 40, w: 100, h: 110, color: 0x6a4a3a, flying: false, shield: false },
  // 世界 2 沙漠金字塔王國。
  bellScarab: { type: 'bellScarab', name: '叮噹聖甲蟲', tier: 'minion', hp: 2, w: 36, h: 44, color: 0x3f6f8f, flying: false, shield: false },
  mummyCat: { type: 'mummyCat', name: '熬夜木乃伊貓', tier: 'minion', hp: 3, w: 44, h: 44, color: 0xe8dcc0, flying: false, shield: false },
  sandSnake: { type: 'sandSnake', name: '咖啡沙蛇', tier: 'minion', hp: 2, w: 40, h: 44, color: 0x8b5e3c, flying: false, shield: false },
  vulture: { type: 'vulture', name: '失眠禿鷹', tier: 'minion', hp: 2, w: 48, h: 40, color: 0x5a4a6a, flying: true, shield: false },
  tortoise: { type: 'tortoise', name: '失眠沙漠陸龜', tier: 'mid', hp: 8, w: 50, h: 56, color: 0xc8a060, flying: false, shield: true },
  camel: { type: 'camel', name: '失眠駱駝', tier: 'boss', hp: 40, w: 90, h: 112, color: 0xd9a066, flying: false, shield: false },
  fennec: { type: 'fennec', name: '熬夜耳廓狐', tier: 'boss', hp: 45, w: 80, h: 96, color: 0xf0c890, flying: false, shield: false },
  sphinx: { type: 'sphinx', name: '睡不著的人面獅身', tier: 'boss', hp: 70, w: 140, h: 120, color: 0xd9a066, flying: false, shield: false },
  // 世界 3 亞特蘭提斯海底王國:魚類都在水中游(不受重力),寄居蟹在海床上走。
  jellyfish: { type: 'jellyfish', name: '熬夜水母', tier: 'minion', hp: 2, w: 38, h: 48, color: 0xc8a8f0, flying: true, shield: false },
  clownfish: { type: 'clownfish', name: '鬧鐘小丑魚', tier: 'minion', hp: 1, w: 46, h: 34, color: 0xff9a50, flying: true, shield: false },
  octopus: { type: 'octopus', name: '咖啡章魚', tier: 'minion', hp: 3, w: 44, h: 48, color: 0x8b5e3c, flying: true, shield: false },
  puffer: { type: 'puffer', name: '氣鼓鼓河豚', tier: 'mid', hp: 8, w: 54, h: 54, color: 0xf0d080, flying: true, shield: false },
  hermitCrab: { type: 'hermitCrab', name: '失眠寄居蟹', tier: 'boss', hp: 45, w: 80, h: 110, color: 0xe07050, flying: false, shield: false },
  eel: { type: 'eel', name: '熬夜電鰻', tier: 'boss', hp: 50, w: 70, h: 110, color: 0x4a7f9f, flying: true, shield: false },
  nessie: { type: 'nessie', name: '尼斯湖水怪', tier: 'boss', hp: 80, w: 150, h: 140, color: 0x5a9a7a, flying: true, shield: false },
  // 世界 4 冰雪極地。
  penguin: { type: 'penguin', name: '熬夜企鵝', tier: 'minion', hp: 2, w: 38, h: 48, color: 0x2a2a4a, flying: false, shield: false },
  snowman: { type: 'snowman', name: '咖啡雪人精靈', tier: 'minion', hp: 3, w: 40, h: 52, color: 0xf0f4ff, flying: false, shield: false },
  puffin: { type: 'puffin', name: '吵鬧海鸚', tier: 'minion', hp: 1, w: 44, h: 40, color: 0x2a2a3a, flying: true, shield: false },
  walrus: { type: 'walrus', name: '失眠海象', tier: 'mid', hp: 9, w: 56, h: 64, color: 0x8a6a5a, flying: false, shield: true },
  polarBear: { type: 'polarBear', name: '失眠北極熊', tier: 'boss', hp: 45, w: 100, h: 110, color: 0xf6f6ff, flying: false, shield: false },
  narwhal: { type: 'narwhal', name: '熬夜獨角鯨', tier: 'boss', hp: 50, w: 100, h: 100, color: 0xd8e0f0, flying: false, shield: false },
  yeti: { type: 'yeti', name: '失眠雪怪', tier: 'boss', hp: 90, w: 150, h: 155, color: 0xf0f6ff, flying: false, shield: false },
  // 世界 5 火山島。
  salamander: { type: 'salamander', name: '熬夜火蜥蜴', tier: 'minion', hp: 2, w: 46, h: 40, color: 0xe0603a, flying: false, shield: false },
  lavaBlob: { type: 'lavaBlob', name: '咖啡熔岩團子', tier: 'minion', hp: 3, w: 40, h: 50, color: 0x8a4a2a, flying: false, shield: false },
  volcanoBird: { type: 'volcanoBird', name: '吵鬧火山鳥', tier: 'minion', hp: 1, w: 46, h: 40, color: 0xd05a3a, flying: true, shield: false },
  armadillo: { type: 'armadillo', name: '失眠犰狳', tier: 'mid', hp: 9, w: 52, h: 64, color: 0x9a7a6a, flying: false, shield: true },
  hippo: { type: 'hippo', name: '失眠溫泉河馬', tier: 'boss', hp: 45, w: 130, h: 108, color: 0xb08aa0, flying: false, shield: false },
  snail: { type: 'snail', name: '熬夜火山蝸牛', tier: 'boss', hp: 50, w: 80, h: 110, color: 0x7a5a4a, flying: false, shield: false },
  dragon: { type: 'dragon', name: '熬夜火龍', tier: 'boss', hp: 100, w: 140, h: 160, color: 0xd04a3a, flying: false, shield: false },
  // 世界 6 熱帶雨林。
  treeFrog: { type: 'treeFrog', name: '熬夜樹蛙', tier: 'minion', hp: 2, w: 42, h: 40, color: 0x6fbf5a, flying: false, shield: false },
  chameleon: { type: 'chameleon', name: '咖啡變色龍', tier: 'minion', hp: 3, w: 40, h: 50, color: 0x7ac06a, flying: false, shield: false },
  parrot: { type: 'parrot', name: '鬧鐘鸚鵡', tier: 'minion', hp: 1, w: 44, h: 44, color: 0xe05a4a, flying: true, shield: false },
  pangolin: { type: 'pangolin', name: '失眠穿山甲', tier: 'mid', hp: 9, w: 56, h: 64, color: 0xa08a5a, flying: false, shield: true },
  sloth: { type: 'sloth', name: '失眠樹懶', tier: 'boss', hp: 45, w: 90, h: 100, color: 0xe0a050, flying: false, shield: false },
  jaguar: { type: 'jaguar', name: '熬夜美洲豹', tier: 'boss', hp: 50, w: 110, h: 105, color: 0xe8b050, flying: false, shield: false },
  gorilla: { type: 'gorilla', name: '吵鬧大猩猩', tier: 'boss', hp: 110, w: 130, h: 160, color: 0x5a5a6a, flying: false, shield: false },
};

export type EnemyPhase = 'walk' | 'hop' | 'hover' | 'swoop' | 'roll' | 'dash' | 'idle' | 'swim' | 'puff' | 'hide';

export interface EnemyBrain {
  phase: EnemyPhase;
  timerMs: number;
  facing: 1 | -1;
  /** 目標跑到背後後累積的時間;刺蝟要累積夠久才轉身。 */
  turnMs: number;
}

export interface EnemySense {
  x: number;
  y: number;
  grounded: boolean;
  /** 最近的醒著玩家的 x;沒有時為 null。 */
  targetX: number | null;
  /** 最近的醒著玩家身體中心的 y(咖啡沙蛇瞄準用)。 */
  targetY?: number | null;
  dtMs: number;
}

export interface EnemyMove {
  vx: number;
  /** null 表示保留目前垂直速度,交給重力。 */
  vy: number | null;
  brain: EnemyBrain;
  /** 這一格吐出的咖啡(沙蛇是拋物線,章魚的墨汁直直飛,gravity 為 0)。 */
  spit?: { vx: number; vy: number; gravity: number } | null;
}

const ALARM_SPEED = 70;
const COFFEE_HOP_MS = 900;
const COFFEE_HOP_VY = -520;
const COFFEE_SPEED = 130;
const BAT_HOVER_Y = 320;
/** 俯衝最低點:身體底部要高於 452,蹲下才閃得過。 */
export const BAT_SWOOP_Y = 434;
const BAT_SPEED = 100;
const BAT_HOVER_MS = 2000;
const BAT_SWOOP_MS = 700;
const BAT_SWOOP_RANGE = 60;
/** 刺蝟會滾;陸龜不滾、轉身更慢。 */
const HEDGEHOG_TUNE = {
  hedgehog: { walkMs: 3000, rollMs: 1000, rollSpeed: 260, walkSpeed: 40, turnMs: 700 },
  // 海象:正面冰盾,每隔一陣子往前衝一小段(不滾)。
  walrus: { walkMs: 2500, rollMs: 600, rollSpeed: 170, walkSpeed: 35, turnMs: 1000 },
  // 犰狳:正面岩石盾,每隔一陣子縮成球滾過來。
  armadillo: { walkMs: 2800, rollMs: 900, rollSpeed: 240, walkSpeed: 38, turnMs: 900 },
  // 穿山甲:正面鱗片盾,縮成球滾得比犰狳久。
  pangolin: { walkMs: 3000, rollMs: 1200, rollSpeed: 220, walkSpeed: 40, turnMs: 900 },
  tortoise: { walkMs: Infinity, rollMs: 0, rollSpeed: 0, walkSpeed: 30, turnMs: 1200 },
} as const;
/** 走一走衝一下:聖甲蟲推著鈴鐺球衝;企鵝搖搖擺擺走,肚子貼地滑一段。 */
const DASHER_TUNE = {
  bellScarab: { speed: 90, dashSpeed: 220, walkMs: 3000, dashMs: 600 },
  penguin: { speed: 45, dashSpeed: 260, walkMs: 2600, dashMs: 1100 },
  // 火蜥蜴:爬過來,每隔一陣子快速竄一小段。
  salamander: { speed: 60, dashSpeed: 200, walkMs: 2400, dashMs: 500 },
} as const;
/** 雪人:慢慢走過來,停在 250 外,每 2.6 秒朝 520 以內的玩家丟雪球。 */
const SNOWMAN_SPEED = 35;
const SNOWMAN_KEEP = 250;
const SNOWMAN_THROW_MS = 2600;
const SNOWMAN_RANGE = 520;
/** 變色龍:走一走,然後停下來變色躲起來(看不太到,但打得到)。 */
const CHAMELEON_SPEED = 55;
export const CHAMELEON_WALK_MS = 2200;
export const CHAMELEON_HIDE_MS = 1600;
/** 木乃伊貓:跳得比咖啡豆低、比較常跳;熔岩團子坐在咖啡杯裡,跳得高、慢。 */
const HOPPER_TUNE = {
  mummyCat: { hopMs: 600, hopVy: -380, speed: 110 },
  lavaBlob: { hopMs: 900, hopVy: -470, speed: 90 },
  // 樹蛙:跳得遠。
  treeFrog: { hopMs: 800, hopVy: -430, speed: 130 },
} as const;
/** 咖啡沙蛇:原地不動,每 2.5 秒朝 500 以內的玩家吐一口咖啡。 */
const SNAKE_SPIT_MS = 2500;
const SNAKE_RANGE = 500;
/** 沙蛇咖啡的重力;也給 arcShot 用。 */
export const SPIT_GRAVITY = 900;
/** 禿鷹、海鸚:比蝙蝠飛得高、俯衝範圍大、會斜斜衝過去;最低點身體底部 452 以上,蹲下閃得過。 */
export const VULTURE_SWOOP_Y = 430;
const DIVER_TUNE = {
  vulture: { hoverY: 250, speed: 120, swoopRange: 140, swoopVx: 160, hoverMs: 2200, swoopMs: 800 },
  puffin: { hoverY: 230, speed: 150, swoopRange: 170, swoopVx: 220, hoverMs: 1700, swoopMs: 750 },
  volcanoBird: { hoverY: 240, speed: 140, swoopRange: 160, swoopVx: 200, hoverMs: 1900, swoopMs: 780 },
  parrot: { hoverY: 220, speed: 160, swoopRange: 180, swoopVx: 230, hoverMs: 1600, swoopMs: 760 },
} as const;
/** 水母:上下漂(振幅 50、週期 2.4 秒),慢慢往玩家漂。 */
const JELLY_BOB = 50;
const JELLY_PERIOD_MS = 2400;
const JELLY_SPEED = 40;
/** 小丑魚:直直游過來,每 2.5 秒才重新看玩家在哪(游過頭後轉身)。 */
const CLOWN_SPEED = 150;
const CLOWN_TURN_MS = 2500;
const CLOWN_WIGGLE = 30;
/** 章魚:停在水中,離玩家太近會退開;每 2.8 秒朝 520 以內的玩家噴墨汁。 */
const OCTO_INK_MS = 2800;
const OCTO_RANGE = 520;
const OCTO_KEEP = 220;
const OCTO_SPEED = 50;
const INK_SPEED = 200;
/** 河豚:慢慢游過來;被打到膨脹 1.5 秒(子彈全彈開),消氣後至少 1 秒才會再膨脹。 */
const PUFFER_SPEED = 35;
export const PUFF_MS = 1500;
const PUFF_COOLDOWN_MS = 1000;

const START_PHASE: Record<EnemyType, EnemyPhase> = {
  alarmBug: 'walk',
  coffeeBean: 'hop',
  nightBat: 'hover',
  hedgehog: 'walk',
  nightOwl: 'hover',
  squirrel: 'idle',
  beaver: 'idle',
  bellScarab: 'walk',
  mummyCat: 'hop',
  sandSnake: 'idle',
  vulture: 'hover',
  tortoise: 'walk',
  camel: 'idle',
  fennec: 'idle',
  sphinx: 'idle',
  jellyfish: 'swim',
  clownfish: 'swim',
  octopus: 'swim',
  puffer: 'swim',
  hermitCrab: 'idle',
  eel: 'idle',
  nessie: 'idle',
  penguin: 'walk',
  snowman: 'walk',
  puffin: 'hover',
  walrus: 'walk',
  polarBear: 'idle',
  narwhal: 'idle',
  yeti: 'idle',
  salamander: 'walk',
  lavaBlob: 'hop',
  volcanoBird: 'hover',
  armadillo: 'walk',
  hippo: 'idle',
  snail: 'idle',
  dragon: 'idle',
  treeFrog: 'hop',
  chameleon: 'walk',
  parrot: 'hover',
  pangolin: 'walk',
  sloth: 'idle',
  jaguar: 'idle',
  gorilla: 'idle',
};

export function initialBrain(type: EnemyType): EnemyBrain {
  return { phase: START_PHASE[type], timerMs: 0, facing: -1, turnMs: 0 };
}

function faceTarget(brain: EnemyBrain, sense: EnemySense): 1 | -1 {
  if (sense.targetX === null) return brain.facing;
  return sense.targetX < sense.x ? -1 : 1;
}

export function stepEnemy(type: EnemyType, brain: EnemyBrain, sense: EnemySense): EnemyMove {
  const timerMs = brain.timerMs + Math.min(sense.dtMs, MAX_DT_MS);
  const hasTarget = sense.targetX !== null;

  switch (type) {
    case 'chameleon': {
      const facing = faceTarget(brain, sense);
      if (brain.phase === 'hide') {
        if (timerMs >= CHAMELEON_HIDE_MS) return { vx: 0, vy: null, brain: { phase: 'walk', timerMs: 0, facing, turnMs: 0 } };
        return { vx: 0, vy: null, brain: { ...brain, timerMs, facing } };
      }
      if (hasTarget && timerMs >= CHAMELEON_WALK_MS) return { vx: 0, vy: null, brain: { phase: 'hide', timerMs: 0, facing, turnMs: 0 } };
      return { vx: hasTarget ? facing * CHAMELEON_SPEED : 0, vy: null, brain: { phase: 'walk', timerMs, facing, turnMs: 0 } };
    }
    case 'alarmBug': {
      const facing = faceTarget(brain, sense);
      return { vx: hasTarget ? facing * ALARM_SPEED : 0, vy: null, brain: { phase: 'walk', timerMs, facing, turnMs: 0 } };
    }
    case 'coffeeBean': {
      const facing = faceTarget(brain, sense);
      if (!sense.grounded) return { vx: facing * COFFEE_SPEED, vy: null, brain: { phase: 'hop', timerMs, facing, turnMs: 0 } };
      if (hasTarget && timerMs >= COFFEE_HOP_MS) {
        return { vx: facing * COFFEE_SPEED, vy: COFFEE_HOP_VY, brain: { phase: 'hop', timerMs: 0, facing, turnMs: 0 } };
      }
      return { vx: 0, vy: null, brain: { phase: 'hop', timerMs, facing, turnMs: 0 } };
    }
    case 'nightBat': {
      const facing = faceTarget(brain, sense);
      if (brain.phase === 'swoop') {
        if (timerMs >= BAT_SWOOP_MS) return { vx: 0, vy: (BAT_HOVER_Y - sense.y) * 4, brain: { phase: 'hover', timerMs: 0, facing, turnMs: 0 } };
        return { vx: 0, vy: (BAT_SWOOP_Y - sense.y) * 5, brain: { phase: 'swoop', timerMs, facing, turnMs: 0 } };
      }
      const dx = sense.targetX === null ? 0 : sense.targetX - sense.x;
      if (hasTarget && timerMs >= BAT_HOVER_MS && Math.abs(dx) < BAT_SWOOP_RANGE) {
        return { vx: 0, vy: (BAT_SWOOP_Y - sense.y) * 5, brain: { phase: 'swoop', timerMs: 0, facing, turnMs: 0 } };
      }
      const vx = Math.abs(dx) > 8 ? facing * BAT_SPEED : 0;
      return { vx, vy: (BAT_HOVER_Y - sense.y) * 4, brain: { phase: 'hover', timerMs, facing, turnMs: 0 } };
    }
    case 'nightOwl':
    case 'squirrel':
    case 'beaver':
    case 'camel':
    case 'fennec':
    case 'sphinx':
    case 'hermitCrab':
    case 'eel':
    case 'nessie':
    case 'polarBear':
    case 'narwhal':
    case 'yeti':
    case 'hippo':
    case 'snail':
    case 'dragon':
    case 'sloth':
    case 'jaguar':
    case 'gorilla':
      // 關主與小頭目由各自的檔案(owl.ts、squirrel.ts、beaver.ts、camel.ts、fennec.ts、sphinx.ts、crab.ts、eel.ts、nessie.ts、polarBear.ts、yeti.ts、hippo.ts、snail.ts、dragon.ts、sloth.ts、jaguar.ts)控制。
      return { vx: 0, vy: 0, brain: { ...brain, timerMs } };
    case 'jellyfish': {
      const facing = faceTarget(brain, sense);
      const w = (Math.PI * 2) / JELLY_PERIOD_MS;
      // 速度是位置 sin 的微分,不用記起始高度就能上下漂。
      const vy = JELLY_BOB * w * 1000 * Math.cos(w * timerMs);
      const dx = sense.targetX === null ? 0 : sense.targetX - sense.x;
      return { vx: Math.abs(dx) > 8 ? facing * JELLY_SPEED : 0, vy, brain: { phase: 'swim', timerMs, facing, turnMs: 0 } };
    }
    case 'clownfish': {
      // 第一格就看玩家在哪,之後每 CLOWN_TURN_MS 才重新看。
      const look = brain.turnMs === 0 || brain.turnMs + Math.min(sense.dtMs, MAX_DT_MS) >= CLOWN_TURN_MS;
      const facing = look ? faceTarget(brain, sense) : brain.facing;
      const turnMs = look ? 1 : brain.turnMs + Math.min(sense.dtMs, MAX_DT_MS);
      const vy = CLOWN_WIGGLE * Math.sin((timerMs / 300) * Math.PI);
      return { vx: facing * CLOWN_SPEED, vy, brain: { phase: 'swim', timerMs, facing, turnMs } };
    }
    case 'octopus': {
      const facing = faceTarget(brain, sense);
      const dx = sense.targetX === null ? Infinity : sense.targetX - sense.x;
      const vx = Math.abs(dx) < OCTO_KEEP ? -facing * OCTO_SPEED : Math.abs(dx) <= OCTO_RANGE ? 0 : facing * OCTO_SPEED;
      if (hasTarget && timerMs >= OCTO_INK_MS && Math.abs(dx) <= OCTO_RANGE) {
        const dy = (sense.targetY ?? sense.y) - sense.y;
        const d = Math.hypot(dx, dy) || 1;
        const spit = { vx: (dx / d) * INK_SPEED, vy: (dy / d) * INK_SPEED, gravity: 0 };
        return { vx, vy: 0, brain: { phase: 'swim', timerMs: 0, facing, turnMs: 0 }, spit };
      }
      return { vx: hasTarget ? vx : 0, vy: 0, brain: { phase: 'swim', timerMs, facing, turnMs: 0 } };
    }
    case 'puffer': {
      const facing = faceTarget(brain, sense);
      if (brain.phase === 'puff') {
        if (timerMs >= PUFF_MS) return { vx: 0, vy: 0, brain: { phase: 'swim', timerMs: 0, facing, turnMs: 0 } };
        return { vx: 0, vy: 0, brain: { ...brain, timerMs } };
      }
      const dx = sense.targetX === null ? 0 : sense.targetX - sense.x;
      const dy = sense.targetY === null || sense.targetY === undefined ? 0 : sense.targetY - sense.y;
      const d = Math.hypot(dx, dy);
      const vx = d > 8 ? (dx / d) * PUFFER_SPEED : 0;
      const vy = d > 8 ? (dy / d) * PUFFER_SPEED : 0;
      return { vx, vy, brain: { phase: 'swim', timerMs, facing, turnMs: 0 } };
    }
    case 'bellScarab':
    case 'penguin':
    case 'salamander': {
      const tune = DASHER_TUNE[type];
      const facing = faceTarget(brain, sense);
      if (brain.phase === 'dash') {
        if (timerMs >= tune.dashMs) return { vx: facing * tune.speed, vy: null, brain: { phase: 'walk', timerMs: 0, facing, turnMs: 0 } };
        return { vx: brain.facing * tune.dashSpeed, vy: null, brain: { ...brain, timerMs } };
      }
      if (hasTarget && timerMs >= tune.walkMs) {
        return { vx: facing * tune.dashSpeed, vy: null, brain: { phase: 'dash', timerMs: 0, facing, turnMs: 0 } };
      }
      return { vx: hasTarget ? facing * tune.speed : 0, vy: null, brain: { phase: 'walk', timerMs, facing, turnMs: 0 } };
    }
    case 'snowman': {
      const facing = faceTarget(brain, sense);
      const dx = sense.targetX === null ? Infinity : sense.targetX - sense.x;
      const vx = hasTarget && Math.abs(dx) > SNOWMAN_KEEP ? facing * SNOWMAN_SPEED : 0;
      if (hasTarget && timerMs >= SNOWMAN_THROW_MS && Math.abs(dx) <= SNOWMAN_RANGE) {
        const handY = sense.y - ENEMY_DEFS.snowman.h / 2;
        const spit = { ...arcShot(sense.x, handY, sense.targetX!, sense.targetY ?? handY, SPIT_GRAVITY), gravity: SPIT_GRAVITY };
        return { vx, vy: null, brain: { phase: 'walk', timerMs: 0, facing, turnMs: 0 }, spit };
      }
      return { vx, vy: null, brain: { phase: 'walk', timerMs, facing, turnMs: 0 } };
    }
    case 'mummyCat':
    case 'lavaBlob':
    case 'treeFrog': {
      const tune = HOPPER_TUNE[type];
      const facing = faceTarget(brain, sense);
      if (!sense.grounded) return { vx: facing * tune.speed, vy: null, brain: { phase: 'hop', timerMs, facing, turnMs: 0 } };
      if (hasTarget && timerMs >= tune.hopMs) {
        return { vx: facing * tune.speed, vy: tune.hopVy, brain: { phase: 'hop', timerMs: 0, facing, turnMs: 0 } };
      }
      return { vx: 0, vy: null, brain: { phase: 'hop', timerMs, facing, turnMs: 0 } };
    }
    case 'sandSnake': {
      const facing = faceTarget(brain, sense);
      const dx = sense.targetX === null ? Infinity : sense.targetX - sense.x;
      if (hasTarget && timerMs >= SNAKE_SPIT_MS && Math.abs(dx) <= SNAKE_RANGE) {
        const mouthY = sense.y - ENEMY_DEFS.sandSnake.h / 2;
        const spit = { ...arcShot(sense.x, mouthY, sense.targetX!, sense.targetY ?? mouthY, SPIT_GRAVITY), gravity: SPIT_GRAVITY };
        return { vx: 0, vy: null, brain: { phase: 'idle', timerMs: 0, facing, turnMs: 0 }, spit };
      }
      return { vx: 0, vy: null, brain: { phase: 'idle', timerMs, facing, turnMs: 0 } };
    }
    case 'vulture':
    case 'puffin':
    case 'volcanoBird':
    case 'parrot': {
      const tune = DIVER_TUNE[type];
      const facing = faceTarget(brain, sense);
      if (brain.phase === 'swoop') {
        if (timerMs >= tune.swoopMs) return { vx: 0, vy: (tune.hoverY - sense.y) * 4, brain: { phase: 'hover', timerMs: 0, facing, turnMs: 0 } };
        return { vx: brain.facing * tune.swoopVx, vy: (VULTURE_SWOOP_Y - sense.y) * 5, brain: { ...brain, timerMs } };
      }
      const dx = sense.targetX === null ? 0 : sense.targetX - sense.x;
      if (hasTarget && timerMs >= tune.hoverMs && Math.abs(dx) < tune.swoopRange) {
        return { vx: facing * tune.swoopVx, vy: (VULTURE_SWOOP_Y - sense.y) * 5, brain: { phase: 'swoop', timerMs: 0, facing, turnMs: 0 } };
      }
      const vx = Math.abs(dx) > 8 ? facing * tune.speed : 0;
      return { vx, vy: (tune.hoverY - sense.y) * 4, brain: { phase: 'hover', timerMs, facing, turnMs: 0 } };
    }
    case 'hedgehog':
    case 'tortoise':
    case 'walrus':
    case 'armadillo':
    case 'pangolin': {
      const tune = HEDGEHOG_TUNE[type];
      if (brain.phase === 'roll') {
        if (timerMs >= tune.rollMs) {
          // 停下時維持原本的面向,轉身照樣要等遲疑時間。
          const vx = hasTarget ? brain.facing * tune.walkSpeed : 0;
          return { vx, vy: null, brain: { phase: 'walk', timerMs: 0, facing: brain.facing, turnMs: 0 } };
        }
        return { vx: brain.facing * tune.rollSpeed, vy: null, brain: { phase: 'roll', timerMs, facing: brain.facing, turnMs: 0 } };
      }
      const wanted = faceTarget(brain, sense);
      let turnMs = wanted === brain.facing ? 0 : brain.turnMs + Math.min(sense.dtMs, MAX_DT_MS);
      let facing = brain.facing;
      if (turnMs >= tune.turnMs) {
        facing = wanted;
        turnMs = 0;
      }
      if (hasTarget && timerMs >= tune.walkMs) {
        return { vx: facing * tune.rollSpeed, vy: null, brain: { phase: 'roll', timerMs: 0, facing, turnMs: 0 } };
      }
      return { vx: hasTarget ? facing * tune.walkSpeed : 0, vy: null, brain: { phase: 'walk', timerMs, facing, turnMs } };
    }
  }
}

/**
 * 河豚被打到:沒在膨脹、而且消氣夠久了就膨脹(這一下照樣有打到)。
 * 消氣時 swim 階段的 timerMs 從 0 開始累積,所以用它判斷消氣多久。
 */
export function pufferHit(brain: EnemyBrain): EnemyBrain {
  if (brain.phase === 'puff' || brain.timerMs < PUFF_COOLDOWN_MS) return brain;
  return { ...brain, phase: 'puff', timerMs: 0 };
}

/**
 * 刺盾擋住從正面迎面而來、偏水平(比 45 度平)的子彈,扇形與追蹤子彈也算;背後、上下都打得到。
 * 盾牌破掉之後(shieldUp = false)正面也打得到。
 * 膨脹的河豚、縮進殼裡的寄居蟹(armored)什麼方向都擋。
 */
export function bulletEffect(def: EnemyDef, enemyFacing: 1 | -1, bulletVx: number, bulletVy: number, armored = false, shieldUp = true): 'hit' | 'blocked' {
  if (armored) return 'blocked';
  const frontal = Math.sign(bulletVx) === -enemyFacing && Math.abs(bulletVy) < Math.abs(bulletVx);
  return def.shield && shieldUp && frontal ? 'blocked' : 'hit';
}

/** 盾牌(刺盾、殼盾、冰盾、岩石盾)擋下這麼多傷害就破掉;基本武器一發 1 點(葉宸佑 2026-10-22)。 */
export const SHIELD_HP = 15;

/** 盾牌擋下一擊:扣掉這一擊的傷害,扣完就破掉(broke 只在破掉的那一下為 true)。 */
export function wearShield(shieldHp: number, damage: number): { shieldHp: number; broke: boolean } {
  if (shieldHp <= 0) return { shieldHp: 0, broke: false };
  const left = Math.max(0, shieldHp - damage);
  return { shieldHp: left, broke: left === 0 };
}

/** 拋物線子彈的飛行時間:越遠飛越久,夾在 0.6–1.4 秒。 */
const ARC_PX_PER_S = 300;
const ARC_MIN_S = 0.6;
const ARC_MAX_S = 1.4;

/** 從 (x0, y0) 丟到 (x1, y1) 的初速度(重力 g,往下為正)。 */
export function arcShot(x0: number, y0: number, x1: number, y1: number, g: number): { vx: number; vy: number } {
  const t = Math.min(ARC_MAX_S, Math.max(ARC_MIN_S, Math.abs(x1 - x0) / ARC_PX_PER_S));
  return { vx: (x1 - x0) / t, vy: (y1 - y0) / t - 0.5 * g * t };
}
