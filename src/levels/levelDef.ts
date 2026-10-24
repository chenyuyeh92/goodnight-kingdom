import type { Text } from '../i18n/lang';
import type { ArenaDef, TrickleDef } from '../game/encounters';
import type { ScenePlan } from '../art/scenes';
import type { EnemyType } from '../game/enemies';
import type { HintKind } from '../ui/hints';
import type { Span } from '../game/water';
import type { PlateDef } from '../game/traps';
import type { Current } from '../game/currents';
import type { Vine } from '../game/vine';
import type { SpriteKey } from '../art/sprites';
import type { MoverDef } from '../game/gadgets';

export type BossType = Extract<
  EnemyType,
  'nightOwl' | 'squirrel' | 'beaver' | 'camel' | 'fennec' | 'sphinx' | 'hermitCrab' | 'eel' | 'nessie' | 'polarBear' | 'narwhal' | 'yeti' | 'hippo' | 'snail' | 'dragon' | 'sloth' | 'jaguar' | 'gorilla' | 'giraffe' | 'elephant' | 'lion' | 'goat' | 'panda' | 'thunderbird' | 'queen' | 'axolotl' | 'mole' | 'rabbit' | 'peacock' | 'tapir'
>;

export type LevelId =
  | 'range'
  | 'lab'
  | 'forest'
  | 'w1-1'
  | 'w1-2'
  | 'w2-1'
  | 'w2-2'
  | 'w2-3'
  | 'w3-1'
  | 'w3-2'
  | 'w3-3'
  | 'w4-1'
  | 'w4-2'
  | 'w4-3'
  | 'w5-1'
  | 'w5-2'
  | 'w5-3'
  | 'w6-1'
  | 'w6-2'
  | 'w6-3'
  | 'w7-1'
  | 'w7-2'
  | 'w7-3'
  | 'w8-1'
  | 'w8-2'
  | 'w8-3'
  | 'w9-1'
  | 'w9-2'
  | 'w9-3'
  | 'w10-1'
  | 'w10-2'
  | 'w10-3';

const LEVEL_IDS: readonly LevelId[] = ['range', 'lab', 'forest', 'w1-1', 'w1-2', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3', 'w4-1', 'w4-2', 'w4-3', 'w5-1', 'w5-2', 'w5-3', 'w6-1', 'w6-2', 'w6-3', 'w7-1', 'w7-2', 'w7-3', 'w8-1', 'w8-2', 'w8-3', 'w9-1', 'w9-2', 'w9-3', 'w10-1', 'w10-2', 'w10-3'];

/** 左上角座標與寬高。 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelDef {
  id: LevelId;
  name: Text;
  /** 第幾個世界(決定進關時要載入哪個世界的魔物圖)。 */
  world: number;
  worldW: number;
  /** 平台與天花板;地面由場景依 worldW 自動加上。 */
  terrain: readonly Rect[];
  /** 荊棘:x 起點與寬度,貼在地面上。 */
  thorns: readonly { x: number; w: number }[];
  checkpoints: readonly number[];
  /** 寶箱:底部中央座標。 */
  chests: readonly { x: number; bottom: number }[];
  /** 練習靶:底部中央座標(只有靶場有)。 */
  targets: readonly { x: number; bottom: number }[];
  trickles: readonly TrickleDef[];
  arenas: readonly ArenaDef[];
  /** 關尾的關主或小頭目;鏡頭到 lockScrollX 就鎖住開戰。 */
  boss: { type: BossType; lockScrollX: number; spawnX: number } | null;
  /** 背景場景:第一個從頭開始,之後依鏡頭位置淡入。 */
  scenes: readonly ScenePlan[];
  /** 河邊的水(1-2):淺水區變慢、河溝要跳過、荷葉可以踩。 */
  water?: { shallow: readonly Span[]; gaps: readonly Span[]; pads: readonly { x: number; y: number; w: number }[] };
  /** 流沙(世界 2):走得慢、站久了會陷下去。 */
  sand?: readonly Span[];
  /** 壓力板(世界 2):踩到會讓上面掉沙磚。 */
  plates?: readonly PlateDef[];
  /** 整關都在水裡(世界 3):用游的。 */
  underwater?: boolean;
  /** 水流(左右推)與氣泡柱(往上送)。 */
  currents?: readonly Current[];
  /** 很滑的冰地面(世界 4)。 */
  ice?: readonly Span[];
  /** 掛在上面、玩家走近就掉下來的冰柱(x 位置)。 */
  icicles?: readonly number[];
  /** 熔岩地面(世界 5):腳踩到就燙傷,要跳過去或踩岩石平台。 */
  lava?: readonly Span[];
  /** 火山噴發區:玩家在區裡時,每隔一陣子從上面掉石頭。 */
  eruptions?: readonly Span[];
  /** 可以抓住盪過去的藤蔓(世界 6):頂端掛在 (x, top),通常掛在跳不過的寬河溝上。 */
  vines?: readonly Vine[];
  /** 黑暗區(世界 9):只看得到玩家身邊、發光水晶和會發光的魔物附近。 */
  darkness?: readonly Span[];
  /** 發光水晶(x 位置,立在地上):黑暗裡照亮四周。 */
  crystals?: readonly number[];
  /** 發光水晶畫成什麼:水晶(預設)或燭台(世界 10 的城堡大廳)。 */
  lightStyle?: 'crystal' | 'candle';
  /** 收集用的星星(世界 10):中心座標,碰到就收集,結算時顯示收集了幾顆。 */
  stars?: readonly { x: number; y: number }[];
  /** 要多載入的其他世界的圖(世界 10 的綜合考驗:強風的風線、冰柱等)。 */
  borrowArt?: readonly SpriteKey[];
  /** 強風區(世界 8):風一陣一陣往左吹,把玩家往回推。 */
  winds?: readonly Span[];
  /** 河溝畫成什麼:水(預設)或雲海(世界 8,掉下去一樣扣愛心、從岸邊重新出來)。 */
  gapStyle?: 'water' | 'cloud';
  /** 獸群奔跑區(世界 7):玩家在區裡時,每隔一陣子一群角馬衝過來。 */
  stampedes?: readonly Span[];
  /** 平台用美術的圖畫(世界 4 的雪堆平台、世界 5 的岩石平台、世界 6 的木頭平台、世界 7 的岩石平台)。 */
  platformArt?: 'snow-platform' | 'rock-platform' | 'log-platform' | 'savanna-platform' | 'cloud-platform' | 'mine-platform' | 'moon-platform';
  /** 移動平台:左右或上下來回,站在上面會被載著走。 */
  movers?: readonly MoverDef[];
  /** 彈跳墊:x 是中心,y 是墊子頂端(預設在地面上);從上面踩到就彈很高。 */
  springs?: readonly { x: number; y?: number }[];
  /** 會掉的平台:站上去抖一下就掉下去,過幾秒長回來。 */
  crumbles?: readonly Rect[];
  /** 路邊的教學告示牌。 */
  hints?: readonly { x: number; kind: HintKind }[];
}

export const WORLD_H = 540;
export const GROUND_Y = 480;

export function isLevelId(v: unknown): v is LevelId {
  return typeof v === 'string' && (LEVEL_IDS as readonly string[]).includes(v);
}

/** 網址參數;沒有或認不得時進 1-3 失眠森林(測試與舊連結沿用)。 */
export function parseLevelId(v: string | null): LevelId {
  return isLevelId(v) ? v : 'forest';
}

/** 魔王區(鎖定畫面之後)的寶箱:每次打魔王都拿得到武器。 */
export function isBossChest(level: LevelDef, chest: { x: number }): boolean {
  return level.boss !== null && chest.x > level.boss.lockScrollX;
}

/** 睡著重來時維持打開的寶箱:路上開過的不再出現(避免刷寶箱),魔王區的會再出現。 */
export function keepOpenedOnRestart(level: LevelDef, opened: readonly number[]): number[] {
  return opened.filter((i) => !isBossChest(level, level.chests[i]));
}
