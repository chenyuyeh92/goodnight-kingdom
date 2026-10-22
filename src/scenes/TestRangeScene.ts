import Phaser from 'phaser';
import { DEFAULT_TUNING, MAX_DT_MS, type Tuning } from '../config/tuning';
import { KeyboardSource } from '../input/keyboardSource';
import { controlHint, intentsForMode, type PlayMode } from '../input/playMode';
import { advanceTeamCamera, applyLock, limitCameraStep, minPlayerX } from '../game/camera';
import { PlayerEntity } from '../game/playerEntity';
import { ProjectileSystem, type HitResult, type ProjectileHit } from '../game/projectileSystem';
import { BASE_LOADOUT, WEAPONS, activeWeapon, equip, type Loadout, type SpecialWeaponId } from '../game/weapons';
import { CHEST_RATES, openChest, resultFor, type ChestResult } from '../game/chest';
import { createSaveStore, type SaveStore } from '../game/save';
import { ITEM_NAMES, applyItem, rollDrop, type ItemId } from '../game/items';
import { weaponHud } from '../game/hud';
import { mountTouchControls, type TouchControls } from '../ui/touchControls';
import { GROUND_Y, WORLD_H, type BossType, type LevelDef, type LevelId } from '../levels/levelDef';
import { LEVELS } from '../levels';
import { MELEE_DAMAGE, MELEE_REACH, meleeTarget, type MeleeCandidate, type MeleeReach } from '../game/melee';
import { MAX_HEARTS, REVIVE_INVULN_MS, applyHit, freshHealth, tickHealth } from '../game/health';
import { decideTeam, reachedCheckpoint } from '../game/team';
import { ENEMY_DEFS, SPIT_GRAVITY, bulletEffect, pufferHit, wearShield, type EnemyType } from '../game/enemies';
import { EnemyEntity } from '../game/enemyEntity';
import { EnemyShotSystem } from '../game/enemyShots';
import { addWeapon, newRunStats, summaryLines, type RunStats } from '../game/runStats';
import type { LevelCompleteData } from './LevelCompleteScene';
import { ENEMY_ART_TINT, SPRITES, artStatus, assetPath, enemySprite, itemSprite, weaponIcon, worldSpriteKeys } from '../art/sprites';
import { SCENE_PALETTE, SCENE_TIME, sceneKeys, type TerrainPalette } from '../art/scenes';
import { isStoryLevel, levelNumber, nextLevel } from '../game/progress';
import { DesertHazards } from '../game/desertHazards';
import { initialCamelBrain, stepCamel, type CamelBrain } from '../game/camel';
import { initialFennecBrain, stepFennec, type FennecBrain } from '../game/fennec';
import { initialSphinxBrain, stepSphinx, type SphinxBrain } from '../game/sphinx';
import { ACORN_GRAVITY, initialSquirrelBrain, stepSquirrel, type SquirrelBrain } from '../game/squirrel';
import { initialBeaverBrain, stepBeaver, type BeaverBrain } from '../game/beaver';
import { initialBearBrain, stepBear, type BearBrain } from '../game/polarBear';
import { SNOWBALL_GRAVITY, initialYetiBrain, stepYeti, type YetiBrain } from '../game/yeti';
import { iceVx, onIce } from '../game/ice';
import { freshEruption, onLava, stepEruption, type EruptionState } from '../game/lava';
import { initialHippoBrain, stepHippo, type HippoBrain } from '../game/hippo';
import { LAVA_GRAVITY, initialSnailBrain, stepSnail, type SnailBrain } from '../game/snail';
import { FIREBALL_GRAVITY, initialDragonBrain, stepDragon, type DragonBrain } from '../game/dragon';
import { MANGO_GRAVITY, initialSlothBrain, stepSloth, type SlothBrain } from '../game/sloth';
import { initialJaguarBrain, stepJaguar, type JaguarBrain } from '../game/jaguar';
import { initialGiraffeBrain, stepGiraffe, SWEEP_SPEED, type GiraffeBrain } from '../game/giraffe';
import { JET_SPEED, JET_Y, initialElephantBrain, stepElephant, type ElephantBrain } from '../game/elephant';
import { initialLionBrain, stepLion, type LionBrain } from '../game/lion';
import { HERD_OFFSETS, HERD_SPEED, HERD_WARN_MS, beastHits, freshStampede, stepStampede, type StampedeState } from '../game/stampede';
import { animFrame } from '../art/frames';
import { BOSS_GUST_PUSH, WIND_PUSH, inWind, windStrength, windVx } from '../game/wind';
import { ROCK_GRAVITY, initialGoatBrain, stepGoat, type GoatBrain } from '../game/goat';
import { BAMBOO_AX, BAMBOO_VX, BAMBOO_Y, initialPandaBrain, stepPanda, type PandaBrain } from '../game/panda';
import { THUNDER_HOVER_Y, initialThunderBrain, stepThunder, type ThunderBrain } from '../game/thunderbird';
import { BLACKOUT_ALPHA, BLACKOUT_PLAYER_RADIUS, DARK_ALPHA, LIGHT_RADIUS, fadeDark, inDark } from '../game/darkness';
import { QUEEN_HOVER_Y, initialQueenBrain, stepQueen, type QueenBrain } from '../game/queen';
import { initialAxolotlBrain, stepAxolotl, type AxolotlBrain } from '../game/axolotl';
import { MOCHI_GRAVITY, initialRabbitBrain, stepRabbit, type RabbitBrain } from '../game/rabbit';
import { DART_SPEED, REVERSE_MS, initialPeacockBrain, reverseIntent, stepPeacock, type PeacockBrain } from '../game/peacock';
import { INHALE_PULL, MIST_SPEED, TAPIR_SCALE, initialTapirBrain, stepTapir, type TapirBrain } from '../game/tapir';
import { owlPhase } from '../game/owl';
import { REGRAB_MS, canGrab, grabOmega, releaseVelocity, restingVine, stepVine, vineHand, type VineState } from '../game/vine';
import { initialCrabBrain, stepCrab, type CrabBrain } from '../game/crab';
import { BEAM_HALF_H, initialEelBrain, stepEel, type EelBrain } from '../game/eel';
import { initialNessieBrain, stepNessie, type NessieBrain } from '../game/nessie';
import { SWIM_TOP, clampToWater, swimVy, waterTuning } from '../game/swim';
import { currentAt, pushed } from '../game/currents';
import { CurrentsView } from '../game/currentsView';
import type { Intent } from '../input/intent';
import { ParallaxBackground } from '../game/background';
import { audio } from '../audio/audio';
import type { TrackId } from '../audio/tunes';
import { hintText } from '../ui/hints';
import type { GuardPlayer, GuardStore } from '../draw/guards';
import { DEFAULT_GUARD_KEY, guardKeyFor } from '../draw/guardTextures';
import { SHALLOW_SPEED, fellIntoRiver, gapAt, groundSegments, inShallow, respawnX } from '../game/water';
import { OWL_HOVER_Y, initialOwlBrain, stepOwl, type OwlBrain } from '../game/owl';
import {
  initialEncounters,
  stepEncounters,
  type EncounterState,
  type SpawnSpec,
} from '../game/encounters';

const VIEW_W = 960;
const SCREEN_MARGIN = 16;
const CAMERA_LEAD = 0.4;
const START_X = 150;
const PARTNER_OFFSET_X = 40;
/** 鏡頭最快是角色速度的 1.5 倍,平常跟得上,隊友睡著時不會瞬間跳動。 */
const CAMERA_MAX_SPEED_RATIO = 1.5;

const TARGET_SIZE = 40;
const TARGET_HP = 3;
const TARGET_RESPAWN_MS = 2000;
const FLASH_MS = 80;
const ZZZ_MS = 800;
/** 落在鏡頭左邊這麼遠的魔物直接移除。 */
const ENEMY_DESPAWN_BEHIND = 200;
/** 掉到世界下方這麼遠的魔物直接移除。 */
const ENEMY_FALL_OUT = 100;
const FLYING_SPAWN_Y = 320;
const SIDE_SPAWN_MARGIN = 20;
const TOP_SPAWN_Y = -30;
const EMERGE_MS = 300;
const GO_HINT_MS = 1500;
const SWING_MS = 120;
/** 被哄睡:睡著的圖停一下再往上飄走;小羊飄得更高。 */
const SLEEP_HOLD_MS = 200;
const SLEEP_FADE_MS = 900;
const SLEEP_RISE = 50;
const SHEEP_RISE = 80;
const SHEEP_MS = 1200;
/** 揮擊命中的停頓與晃動比泡泡重。 */
const MELEE_IMPACT_SCALE = 2;

/** 雙人時關主血量是單人的 1.5 倍。 */
const BOSS_DUO_HP_RATIO = 1.5;
/** 貓頭鷹盤旋範圍:鎖定畫面左右各內縮這麼多。 */
const BOSS_ARENA_INSET = 80;
const BOSS_BAR_W = 400;
const BOSS_BAR_H = 12;
/** 關主血條放在畫面底部的地面上,不擋到在上方盤旋的貓頭鷹。 */
const BOSS_BAR_Y = 514;
const BOSS_PHASE_TEXT_MS = 1500;
/** 打倒關主後到結算畫面的時間。 */
const BOSS_OUTRO_MS = 1500;
/** 打倒關主:停頓 ×3、晃動 ×2。 */
const BOSS_HIT_STOP_SCALE = 3;
const BOSS_SHAKE_SCALE = 2;
/** 換階段時顯示的關主簡稱。 */
const BOSS_SHORT_NAME: Partial<Record<BossType, string>> = { nightOwl: '貓頭鷹', sphinx: '人面獅身', nessie: '尼斯湖水怪', yeti: '雪怪', dragon: '火龍', gorilla: '大猩猩', lion: '獅子王', thunderbird: '雷鳥', mole: '巨鼴鼠', tapir: '夢貘' };
/** 冰柱:玩家走到左右這麼近就掉下來。 */
const ICICLE_TRIGGER_X = 100;
/** 熔岩圖流動一格(96 px)要多久。 */
const LAVA_FLOW_MS = 4000;
/** 角馬跑出畫面這麼遠才收掉。 */
const HERD_DESPAWN = 100;
/** 世界 9 黑暗遮罩:在世界上面、HUD 下面;光圈貼圖。 */
const DARK_DEPTH = 8;
const DARK_COLOR = 0x07040f;
const LIGHT_KEY = 'gk-light';
const LIGHT_TEX_R = 128;
/** 火螢女王燈泡一閃後,四周很黑多久。 */
const BLACKOUT_MS = 1200;
/** 六角恐龍的水泡飄得慢,活久一點。 */
const BUBBLE_LIFE_MS = 6000;
/** 巨鼴鼠的土堆顏色、最多同時幾隻咖啡蚯蚓。 */
const MOLE_DIRT = 0x5a3a2a;
const MOLE_MAX_WORMS = 3;
/** 世界 10:黏到麻糬變慢多久、變多慢;惡夢雲與羽毛飛鏢飛得慢,活久一點;程式畫的星星大小;夢貘吸氣的線多久冒一條。 */
const MOCHI_SLOW_MS = 2000;
const MOCHI_SLOW = 0.5;
const MIST_LIFE_MS = 12000;
const DART_LIFE_MS = 7000;
const STAR_R = 12;
const INHALE_FX_MS = 90;
/** 離夢貘這麼近(圖的半寬再加這些)就不再吸。 */
const INHALE_STOP_GAP = 30;
/** 巨鼴鼠的土堆比身體寬一點(冒出來會打到的範圍都看得到)。 */
const MOLE_MOUND_RATIO = 1.4;
/** 雲海(世界 8 的河溝)的顏色。 */
const CLOUD_GAP = { fill: 0xd8d0ec, light: 0xffffff } as const;
/** 熊貓的迴旋竹子飛出去再飛回來,回到熊貓手上就消失(不會飛去打背後的人);雷鳥颳強風時畫面輕輕晃。 */
const BAMBOO_LIFE_MS = 2000;
const THUNDER_GUST_SHAKE_MS = 400;
/** 風線:多久飄一條、飄多遠、多久。 */
const WIND_STREAK_EVERY_MS = 60;
const WIND_STREAK_TRAVEL = 520;
const WIND_STREAK_MS = 700;
const WIND_STREAK_SCALE = 1.6;
/** 獸群預告時畫面震動多久(比預告短,關主的招式震動才不會被蓋掉)。 */
const HERD_SHAKE_MS = 500;
/** 獅子王平常站的位置(鎖住畫面右邊往內)、吼聲音波飛得慢要活久一點。 */
const LION_HOME_INSET = 130;
const ROAR_LIFE_MS = 7000;
/** 河馬的蒸氣飄得慢,活久一點才飄得過整個畫面。 */
const STEAM_LIFE_MS = 9000;
/** 噴蒸氣時畫面白霧最濃的程度。 */
const STEAM_FOG_ALPHA = 0.55;
/** 雪怪平常站的位置(鎖住畫面右邊往內)。 */
const YETI_HOME_INSET = 120;
/** 水怪第三階段的圖和第一階段差不多,身體帶一點紅色區分。 */
const NESSIE_RAGE_TINT = 0xffb0b0;
/** 寄居蟹縮進殼裡時圖變暗一點。 */
const SHELL_TINT = 0xb8b0c8;
/** 電流:預告細線與放電的顏色。 */
const BEAM_WARN = 0xfff6a0;
const BEAM_ZAP = 0xffe066;
/** 水怪衝到鎖住畫面左邊這麼遠就回頭;平常待的位置。 */
const NESSIE_LEFT_INSET = 100;
const NESSIE_HOME_INSET = 110;
const NESSIE_HOME_Y = 260;
/** 水怪叫的小丑魚高度。 */
const SCHOOL_YS = [150, 270, 390] as const;
/** 小頭目出招前頭上冒「!」的時間。 */
const TELL_MS = 450;
/** 耳廓狐鑽在沙裡時,玩家腳下冒出的沙堆。 */
const MOUND_W = 70;
const MOUND_H = 16;

/** 荷葉的厚度;河岸擋魔物的隱形牆高度。 */
const PAD_H = 10;
/** 掉進河裡上岸後的無敵時間。 */
const RIVER_INVULN_MS = 2000;
const SHALLOW_DEPTH = 24;
/** 角色判定寬 28 的一半。 */
const STAND_HALF_W = 14;
/** 抓藤蔓時手比頭頂高一點;身體中心在手下面這麼多。 */
const HANG_BELOW_HAND = 20;
/** 從藤蔓放手後這麼久之內保持飛出去的水平速度(落地或撞牆就停)。 */
const FLING_MS = 1100;
/** 藤蔓圖加粗、樹枝寬度、停著時輕輕晃的幅度(弧度)與速度。 */
const VINE_ART_SCALE_X = 1.6;
const VINE_BRANCH_W = 70;
const VINE_SWAY = 0.06;
const VINE_SWAY_MS = 500;
const BANK_H = 80;

const THORN_H = 16;
/** 荊棘畫得比判定高一點,比較顯眼。 */
const THORN_ART_H = 22;
const THORN_BOUNCE_VY = -350;

/** 復活時從畫面頂端掉下來,隊友在通道裡也不會卡進地形。 */
const REVIVE_DROP_Y = 40;

const CHEST_W = 32;
const CHEST_H = 24;
const CHEST_POPUP_MS = 2000;
/** 打開寶箱時彈一下。 */
const CHEST_POP_MS = 120;
const ITEM_SIZE = 16;
const ITEM_LIFE_MS = 8000;
const ITEM_BLINK_MS = 2000;
const ITEM_POPUP_MS = 1000;
const RARITY_COLOR: Record<string, string> = { R: '#ffffff', SR: '#7fb4ff', SSR: '#ffd24a' };
const ITEM_COLOR: Record<ItemId, number> = {
  hotCocoa: 0x8b5e3c,
  shootingStar: 0xffe08a,
  smallPillow: 0xf6d6e8,
  milkBottle: 0xffffff,
};

/** HUD:每位玩家一列,前面是武器小圖示。 */
const HUD_ROW_W = 470;
const HUD_ICON = 28;
/** HUD 文字加深色描邊,在亮背景上也看得清楚。 */
const HUD_STROKE = { stroke: '#2b2a6b', strokeThickness: 4 };

const COLOR = {
  terrain: 0x3b3366,
  /** 美術配色:外框深紫、平台本體、上緣亮邊、地面。 */
  outline: 0x3a2a5a,
  flagOff: 0x7b6bc9,
  flagOn: 0xf8e08e,
  water: 0x4a7fc0,
  waterLight: 0xb8e0ff,
  playerA: 0xffd27a,
  playerB: 0x9be7c4,
  artTintB: 0xb8f0d0,
  angry: 0xff9a9a,
  target: 0xf3e9d2,
  flash: 0xffffff,
  /** 荊棘要在深色地面與草叢剪影前一眼看出來:亮桃紅加奶油色尖端。 */
  thorn: 0xff5c8a,
  thornTip: 0xfff6e5,
  dirt: 0x6b4f3a,
};

interface Target {
  rect: Phaser.GameObjects.Rectangle;
  hp: number;
  /** 練習靶的圖;沒有圖時顯示色塊。 */
  art: Phaser.GameObjects.Image | null;
}


/** 各種關主與小頭目的行為狀態。 */
type BossAi =
  | { kind: 'owl'; brain: OwlBrain }
  | { kind: 'squirrel'; brain: SquirrelBrain; armored: boolean }
  | { kind: 'beaver'; brain: BeaverBrain }
  | { kind: 'camel'; brain: CamelBrain }
  | { kind: 'fennec'; brain: FennecBrain; mound: Phaser.GameObjects.Ellipse | null; phase: 1 | 2 | 3 }
  | { kind: 'sphinx'; brain: SphinxBrain }
  | { kind: 'crab'; brain: CrabBrain; armored: boolean }
  | { kind: 'eel'; brain: EelBrain }
  | { kind: 'nessie'; brain: NessieBrain }
  | { kind: 'bear'; brain: BearBrain }
  | { kind: 'yeti'; brain: YetiBrain }
  | { kind: 'hippo'; brain: HippoBrain }
  | { kind: 'snail'; brain: SnailBrain; armored: boolean }
  | { kind: 'dragon'; brain: DragonBrain }
  | { kind: 'sloth'; brain: SlothBrain }
  | { kind: 'jaguar'; brain: JaguarBrain; shadow: Phaser.GameObjects.Ellipse | null }
  | { kind: 'giraffe'; brain: GiraffeBrain }
  | { kind: 'elephant'; brain: ElephantBrain }
  | { kind: 'lion'; brain: LionBrain }
  | { kind: 'goat'; brain: GoatBrain }
  | { kind: 'panda'; brain: PandaBrain }
  | { kind: 'thunderbird'; brain: ThunderBrain }
  | { kind: 'queen'; brain: QueenBrain }
  | { kind: 'axolotl'; brain: AxolotlBrain; lastHp: number }
  | { kind: 'rabbit'; brain: RabbitBrain }
  | { kind: 'peacock'; brain: PeacockBrain }
  | { kind: 'tapir'; brain: TapirBrain };

/** 由 updateBoss 控制移動的魔物(不跑 stepEnemy)。 */
const SCRIPTED_BOSSES: ReadonlySet<EnemyType> = new Set(['nightOwl', 'squirrel', 'beaver', 'camel', 'fennec', 'sphinx', 'hermitCrab', 'eel', 'nessie', 'polarBear', 'narwhal', 'yeti', 'hippo', 'snail', 'dragon', 'sloth', 'jaguar', 'gorilla', 'giraffe', 'elephant', 'lion', 'goat', 'panda', 'thunderbird', 'queen', 'axolotl', 'mole', 'rabbit', 'peacock', 'tapir']);

function initialAi(type: BossType): BossAi {
  switch (type) {
    case 'nightOwl':
      return { kind: 'owl', brain: initialOwlBrain() };
    case 'squirrel':
      return { kind: 'squirrel', brain: initialSquirrelBrain(), armored: false };
    case 'beaver':
      return { kind: 'beaver', brain: initialBeaverBrain() };
    case 'camel':
      return { kind: 'camel', brain: initialCamelBrain() };
    case 'fennec':
      return { kind: 'fennec', brain: initialFennecBrain(), mound: null, phase: 1 };
    case 'sphinx':
      return { kind: 'sphinx', brain: initialSphinxBrain() };
    case 'hermitCrab':
      return { kind: 'crab', brain: initialCrabBrain(), armored: false };
    case 'eel':
      return { kind: 'eel', brain: initialEelBrain() };
    case 'nessie':
      return { kind: 'nessie', brain: initialNessieBrain() };
    case 'polarBear':
      return { kind: 'bear', brain: initialBearBrain() };
    // 獨角鯨用耳廓狐的行為(在冰面下)。
    case 'narwhal':
      return { kind: 'fennec', brain: initialFennecBrain(), mound: null, phase: 1 };
    case 'yeti':
      return { kind: 'yeti', brain: initialYetiBrain() };
    case 'hippo':
      return { kind: 'hippo', brain: initialHippoBrain() };
    case 'snail':
      return { kind: 'snail', brain: initialSnailBrain(), armored: false };
    case 'dragon':
      return { kind: 'dragon', brain: initialDragonBrain() };
    case 'sloth':
      return { kind: 'sloth', brain: initialSlothBrain() };
    case 'jaguar':
      return { kind: 'jaguar', brain: initialJaguarBrain(), shadow: null };
    // 大猩猩用雪怪的招式(丟芒果、捶胸掉芒果、跳過來送出震波)。
    case 'gorilla':
      return { kind: 'yeti', brain: initialYetiBrain() };
    case 'giraffe':
      return { kind: 'giraffe', brain: initialGiraffeBrain() };
    case 'elephant':
      return { kind: 'elephant', brain: initialElephantBrain() };
    case 'lion':
      return { kind: 'lion', brain: initialLionBrain() };
    case 'goat':
      return { kind: 'goat', brain: initialGoatBrain() };
    case 'panda':
      return { kind: 'panda', brain: initialPandaBrain() };
    case 'thunderbird':
      return { kind: 'thunderbird', brain: initialThunderBrain() };
    case 'queen':
      return { kind: 'queen', brain: initialQueenBrain() };
    case 'axolotl':
      return { kind: 'axolotl', brain: initialAxolotlBrain(), lastHp: Infinity };
    // 巨鼴鼠用耳廓狐的行為(鑽進地底、從玩家腳下冒出來),再加上三個階段。
    case 'mole':
      return { kind: 'fennec', brain: initialFennecBrain(), mound: null, phase: 1 };
    case 'rabbit':
      return { kind: 'rabbit', brain: initialRabbitBrain() };
    case 'peacock':
      return { kind: 'peacock', brain: initialPeacockBrain() };
    case 'tapir':
      return { kind: 'tapir', brain: initialTapirBrain() };
  }
}

/** 有三階段的關主回傳目前階段,其他回傳 1。 */
function aiPhase(ai: BossAi): 1 | 2 | 3 {
  return ai.kind === 'owl' || ai.kind === 'sphinx' || ai.kind === 'nessie' || ai.kind === 'yeti' || ai.kind === 'dragon' || ai.kind === 'lion' || ai.kind === 'thunderbird' || ai.kind === 'tapir' ? ai.brain.phase : ai.kind === 'fennec' ? ai.phase : 1;
}

function aiMode(ai: BossAi): string {
  return ai.brain.mode;
}

interface Boss {
  enemy: EnemyEntity;
  ai: BossAi;
  maxHp: number;
  invulnerable: boolean;
  minions: Set<EnemyEntity>;
  wasAngry: boolean;
}

interface Chest {
  rect: Phaser.GameObjects.Rectangle;
  opened: boolean;
  /** 寶箱圖(關著/打開兩張);沒有圖時為 null。 */
  art: Phaser.GameObjects.Image | null;
}

interface ItemPickup {
  rect: Phaser.GameObjects.Rectangle;
  id: ItemId;
  bornAt: number;
  art: Phaser.GameObjects.Image | null;
}

export interface TestRangeData {
  save?: SaveStore;
  /** 玩家畫的守衛與選用設定。 */
  guards?: GuardStore;
  /** 重來時保留每位玩家手上的武器與剩餘彈藥。 */
  loadouts?: Loadout[];
  /** 重來前已經清完的戰鬥區數量。 */
  arenasCleared?: number;
  /** 要玩的關卡,預設失眠森林。 */
  level?: LevelId;
  /** 顯示手機觸控操作。 */
  touch?: boolean;
  /** 已經開過的寶箱編號,重來後維持打開,避免反覆刷寶箱。 */
  openedChests?: number[];
  /** 已經收集的星星編號(世界 10),重來後不再出現。 */
  collectedStars?: number[];
  /** 這次遊玩的統計,重來時帶著走。 */
  stats?: RunStats;
  getTuning?: () => Tuning;
  mode?: PlayMode;
  checkpointX?: number;
  restarts?: number;
  testHooks?: boolean;
}

const HEART_FULL = 'gk-heart';
const HEART_EMPTY = 'gk-heart-empty';
const HEART_SIZE = 18;

/** 程式畫愛心貼圖(實心粉紅、空心外框),只畫一次。 */
function makeHeartTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(HEART_FULL)) return;
  const s = HEART_SIZE;
  const draw = (key: string, fill: number | null): void => {
    const g = scene.make.graphics({}, false);
    const heart = (pad: number, color: number): void => {
      const r = s / 4 - pad / 2;
      g.fillStyle(color);
      g.fillCircle(s / 4 + pad / 4, s / 3, r);
      g.fillCircle((s * 3) / 4 - pad / 4, s / 3, r);
      g.fillTriangle(pad, s / 3 + 1, s - pad, s / 3 + 1, s / 2, s - pad - 1);
    };
    heart(0, 0x3a2a5a);
    heart(3, fill ?? 0x5a4a8f);
    g.generateTexture(key, s, s);
    g.destroy();
  };
  draw(HEART_FULL, 0xff7aa2);
  draw(HEART_EMPTY, null);
}

/** 每一關的配樂依第一個場景的時段:白天、黃昏、晚上。 */
function levelTrack(level: LevelDef): TrackId {
  return SCENE_TIME[level.scenes[0].scene];
}

/** 只保留跨關卡的設定(存檔、觸控、模式等),去掉這一輪的進度。 */
export function sessionData(d: TestRangeData): TestRangeData {
  return { getTuning: d.getTuning, testHooks: d.testHooks, save: d.save, guards: d.guards, touch: d.touch, level: d.level, mode: d.mode };
}

export class TestRangeScene extends Phaser.Scene {
  private getTuning: () => Tuning = () => DEFAULT_TUNING;
  private keyboard!: KeyboardSource;
  private terrain!: Phaser.Physics.Arcade.StaticGroup;
  private terrainBodies = new Set<Phaser.Physics.Arcade.StaticBody>();
  private players: PlayerEntity[] = [];
  private projectiles!: ProjectileSystem;
  private targetGroup!: Phaser.Physics.Arcade.StaticGroup;
  private targets: Target[] = [];
  private targetsHit = 0;
  private enemies: EnemyEntity[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private enemiesDefeated = 0;
  private blockedShots = 0;
  /** 打破的盾牌數。 */
  private shieldsBroken = 0;
  private meleeHits = 0;
  private meleeSwings = 0;
  private encounters: EncounterState = initialEncounters();
  private save: SaveStore = createSaveStore(null);
  private chests: Chest[] = [];
  private chestsOpened = 0;
  private lastChest: ChestResult['kind'] | null = null;
  private pickups: ItemPickup[] = [];
  private pickupGroup!: Phaser.Physics.Arcade.Group;
  private riggedChest: SpecialWeaponId | null = null;
  private riggedDrop: ItemId | null = null;
  private touchControls: TouchControls | null = null;
  private lockScrollX: number | null = null;
  private arenaHud!: Phaser.GameObjects.Text;
  private goHintUntil = 0;
  private scrollX = 0;
  private shots!: EnemyShotSystem;
  private boss: Boss | null = null;
  private bossTriggered = false;
  private bossDefeated = false;
  private bossLock: number | null = null;
  private bossName!: Phaser.GameObjects.Text;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossPhaseText!: Phaser.GameObjects.Text;
  private stats!: RunStats;
  private riverFalls = 0;
  /** 世界 5:踩到熔岩被燙到的次數、火山噴發次數。 */
  private lavaBurns = 0;
  private eruption: EruptionState = freshEruption();
  /** 世界 6 的藤蔓:圖、擺動狀態、每位玩家抓著哪一條、放手後的冷卻與飛出去的速度。 */
  private vineViews: (Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle)[] = [];
  private vineStates: VineState[] = [];
  private holding: (number | null)[] = [];
  private regrabMs: number[] = [];
  /** 剛放手的那條藤蔓:落地以前抓不回來。 */
  private lastVine: (number | null)[] = [];
  private fling: { vx: number; ms: number }[] = [];
  private prevJumpVine: boolean[] = [];
  private vineGrabs = 0;
  /** 世界 7 的獸群:奔跑區計時、正在預告的(方向與剩下的時間)、正在跑的角馬、被撞到的次數。 */
  private stampede: StampedeState = freshStampede();
  private herdWarnings: { dir: 1 | -1; ms: number; views: Phaser.GameObjects.GameObject[] }[] = [];
  private beasts: { x: number; dir: 1 | -1; view: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle; dust: Phaser.GameObjects.Image | null }[] = [];
  private herdsReleased = 0;
  private herdHits = 0;
  /** 世界 8 的強風:風的時鐘、雷鳥正在颳強風、風的線條、被風推過的次數(除錯用)。 */
  private windMs = 0;
  private bossGust = false;
  private windSpawnMs = 0;
  private windPushes = 0;
  /** 世界 9 的黑暗:遮罩(擦出光圈)、目前多黑、火螢女王閃光後更黑的剩餘時間、這一格有幾個光源。 */
  private darkRt: Phaser.GameObjects.RenderTexture | null = null;
  private lightPool: Phaser.GameObjects.Image[] = [];
  private darkAlpha = 0;
  private blackoutMs = 0;
  private lightCount = 0;
  /** 世界 10:星星(收集了沒)、孔雀開屏後左右顛倒剩多久、夢貘正在吸、每位玩家黏到麻糬變慢剩多久。 */
  private stars: { x: number; y: number; view: Phaser.GameObjects.Image | Phaser.GameObjects.Star; got: boolean }[] = [];
  private starHud: Phaser.GameObjects.Text | null = null;
  private reverseMs = 0;
  private reverseText!: Phaser.GameObjects.Text;
  private inhaling = false;
  private inhaleFxMs = 0;
  private slowMs: number[] = [];
  private mochiHits = 0;
  private pulls = 0;
  /** 地形配色跟著這一關第一個場景。 */
  private get palette(): TerrainPalette {
    return SCENE_PALETTE[this.level.scenes[0].scene];
  }
  private background!: ParallaxBackground;
  private desert!: DesertHazards;
  private currentsView: CurrentsView | null = null;
  /** 每位玩家上一格有沒有按跳躍(游泳時判斷「剛按下」)。 */
  private prevJump: boolean[] = [];
  /** 電鰻的電流(每格重畫);有美術圖時用橫向接長的電流圖。 */
  private beamGfx!: Phaser.GameObjects.Graphics;
  private beamTiles: Phaser.GameObjects.TileSprite[] = [];
  /** 冰上滑:每位玩家上一格的水平速度。 */
  /** 還沒掉下來的冰柱(掛在上面的圖)。 */
  private hangingIcicles: { x: number; view: Phaser.GameObjects.Image | Phaser.GameObjects.Triangle }[] = [];
  private flags: { x: number; g: Phaser.GameObjects.Graphics; on: boolean | null }[] = [];

  constructor() {
    super('TestRange');
  }

  private mode: PlayMode = 'single';
  private level: LevelDef = LEVELS.forest;
  private checkpointX = START_X;
  private restarts = 0;
  private testHooks = false;
  private initData: TestRangeData = {};
  private maxReachedX = START_X;
  private restarting = false;
  private hudRows: { icon: Phaser.GameObjects.Image | null; label: Phaser.GameObjects.Text; hearts: Phaser.GameObjects.Image[]; text: Phaser.GameObjects.Text }[] = [];

  init(data: TestRangeData): void {
    this.initData = data ?? {};
    if (data?.getTuning) this.getTuning = data.getTuning;
    this.mode = data?.mode ?? 'single';
    this.level = LEVELS[data?.level ?? 'forest'];
    this.checkpointX = data?.checkpointX ?? START_X;
    this.restarts = data?.restarts ?? 0;
    this.testHooks = data?.testHooks ?? false;
    this.save = data?.save ?? createSaveStore(null);
  }

  /** 這一關的背景在進關時才載入(主頁不用先下載全部背景)。 */
  preload(): void {
    if (artStatus.disabled) return;
    const base = import.meta.env.BASE_URL;
    // 之前載入失敗的背景不再重抓(重來時不會一直卡在載入)。
    const wanted = [...sceneKeys(this.level.scenes.map((s) => s.scene)), ...worldSpriteKeys(this.level.world), ...(this.level.borrowArt ?? [])];
    const keys = wanted.filter((k) => !this.textures.exists(k) && !artStatus.missing.includes(k));
    if (keys.length === 0) return;
    const label = this.add.text(480, 270, '載入中 0%', { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
    const done = (): void => void (artStatus.loaded += 1);
    const fail = (file: Phaser.Loader.File): void => {
      if (!artStatus.missing.includes(file.key)) artStatus.missing.push(file.key);
    };
    const progress = (v: number): void => void label.setText(`載入中 ${Math.round(v * 100)}%`);
    this.load.on('progress', progress);
    this.load.on('filecomplete', done);
    this.load.on('loaderror', fail);
    // 載入器跟著場景一直存在,重來時不能讓監聽一直疊上去。
    this.load.once('complete', () => {
      this.load.off('filecomplete', done);
      this.load.off('progress', progress);
      this.load.off('loaderror', fail);
      label.destroy();
    });
    for (const k of keys) this.load.image(k, `${base}${assetPath(k)}`);
  }

  create(): void {
    this.targets = [];
    this.enemies = [];
    this.enemiesDefeated = 0;
    this.blockedShots = 0;
    this.shieldsBroken = 0;
    this.meleeHits = 0;
    this.meleeSwings = 0;
    this.encounters = initialEncounters();
    this.lockScrollX = null;
    this.chests = [];
    this.chestsOpened = 0;
    this.lastChest = null;
    this.pickups = [];
    this.goHintUntil = 0;
    this.targetsHit = 0;
    this.scrollX = 0;
    this.boss = null;
    this.bossTriggered = false;
    this.bossDefeated = false;
    this.bossLock = null;
    this.riverFalls = 0;
    this.lavaBurns = 0;
    this.eruption = freshEruption();
    this.stats = this.initData.stats ?? newRunStats(Date.now(), this.level.chests.length);
    this.terrainBodies.clear();

    this.physics.world.setBounds(0, 0, this.level.worldW, WORLD_H + 200);
    this.background = new ParallaxBackground(this, this.level.scenes);
    audio.music(levelTrack(this.level));
    this.cameras.main.setBounds(0, 0, this.level.worldW, WORLD_H);

    this.terrain = this.physics.add.staticGroup();
    const water = this.level.water;
    // 地面依河溝切成幾段;會飛的魔物只被地面擋住。
    const grounds = groundSegments(this.level.worldW, water?.gaps ?? []).map((g) => ({ x: g.x, y: GROUND_Y, w: g.w, h: WORLD_H - GROUND_Y }));
    const groundRects = new Set<unknown>();
    /** 關卡的平台(不含地面、掉下來的沙磚與木頭)。 */
    const platformRects = new Set<unknown>();
    for (const t of [...grounds, ...this.level.terrain]) {
      const r = this.add.rectangle(t.x + t.w / 2, t.y + t.h / 2, t.w, t.h, COLOR.terrain).setVisible(false);
      const isGround = grounds.includes(t);
      this.drawTerrain(t, isGround);
      if (isGround) groundRects.add(r);
      else platformRects.add(r);
      this.terrain.add(r);
      this.terrainBodies.add(r.body as Phaser.Physics.Arcade.StaticBody);
    }
    for (const pad of water?.pads ?? []) {
      const r = this.add.rectangle(pad.x + pad.w / 2, pad.y + PAD_H / 2, pad.w, PAD_H, COLOR.terrain).setVisible(false);
      this.terrain.add(r);
      this.terrainBodies.add(r.body as Phaser.Physics.Arcade.StaticBody);
    }
    if (water) this.drawWater(water);

    this.targetGroup = this.physics.add.staticGroup();
    for (const t of this.level.targets) {
      const rect = this.add.rectangle(t.x, t.bottom - TARGET_SIZE / 2, TARGET_SIZE, TARGET_SIZE, COLOR.target);
      this.targetGroup.add(rect);
      const art = this.textures.exists('target') ? this.add.image(t.x, rect.y, 'target') : null;
      if (art) rect.setVisible(false);
      this.targets.push({ rect, hp: TARGET_HP, art });
    }

    const isTerrain = (b: unknown): boolean => this.terrainBodies.has(b as Phaser.Physics.Arcade.StaticBody);
    const startX = this.checkpointX;
    this.players =
      this.mode === 'duo'
        ? [
            new PlayerEntity(this, { x: startX, feetY: GROUND_Y, color: COLOR.playerA, label: 'A', isTerrain, artTint: null, artKey: this.guardKey('A') }),
            new PlayerEntity(this, { x: startX + PARTNER_OFFSET_X, feetY: GROUND_Y, color: COLOR.playerB, label: 'B', isTerrain, ...this.guardArtB() }),
          ]
        : [new PlayerEntity(this, { x: startX, feetY: GROUND_Y, color: COLOR.playerA, label: null, isTerrain, artTint: null, artKey: this.guardKey('A') })];
    this.scrollX = Math.min(Math.max(startX - VIEW_W * CAMERA_LEAD, 0), this.level.worldW - VIEW_W);
    this.encounters = initialEncounters(this.scrollX, this.level.trickles, this.initData.arenasCleared ?? 0);
    for (const p of this.players) this.physics.add.collider(p.zone, this.terrain);
    this.players.forEach((p, i) => (p.loadout = { ...(this.initData.loadouts?.[i] ?? BASE_LOADOUT) }));
    this.desert = new DesertHazards(this, {
      sand: this.level.sand ?? [],
      plates: this.level.plates ?? [],
      platforms: this.level.terrain,
      terrain: this.terrain,
      terrainBodies: this.terrainBodies,
      players: () => this.players,
      hurt: (p) => this.hurtPlayer(p, false),
    });
    this.currentsView = this.level.currents?.length ? new CurrentsView(this, this.level.currents) : null;
    this.prevJump = this.players.map(() => false);
    this.hangingIcicles = (this.level.icicles ?? []).map((x) => ({
      x,
      view: this.textures.exists('icicle')
        ? this.add.image(x, 0, 'icicle').setOrigin(0.5, 0).setDepth(-1)
        : this.add.triangle(x, 0, -12, 0, 12, 0, 0, 56, 0xd8f0ff).setOrigin(0.5, 0).setDepth(-1),
    }));
    for (const s of this.level.ice ?? []) this.drawIce(s.x, s.w);
    for (const s of this.level.lava ?? []) this.drawLava(s.x, s.w);
    this.vineStates = (this.level.vines ?? []).map(() => restingVine());
    this.vineViews = (this.level.vines ?? []).map((v) => {
      // 掛藤蔓的樹枝(藤蔓圖很細,在樹林背景裡加粗一點、加上樹枝才看得出來)。
      const g = this.add.graphics().setDepth(-1);
      g.fillStyle(COLOR.outline).fillRoundedRect(v.x - VINE_BRANCH_W / 2 - 2, v.top - 8, VINE_BRANCH_W + 4, 14, 7);
      g.fillStyle(0x7a5232).fillRoundedRect(v.x - VINE_BRANCH_W / 2, v.top - 6, VINE_BRANCH_W, 10, 5);
      return this.textures.exists('vine')
        ? this.add.image(v.x, v.top, 'vine').setOrigin(0.5, 0).setScale(VINE_ART_SCALE_X, 1).setDepth(-1)
        : this.add.rectangle(v.x, v.top, 8, 160, 0x4a8a3a).setOrigin(0.5, 0).setStrokeStyle(2, COLOR.outline).setDepth(-1);
    });
    this.holding = this.players.map(() => null);
    this.regrabMs = this.players.map(() => 0);
    this.lastVine = this.players.map(() => null);
    this.fling = this.players.map(() => ({ vx: 0, ms: 0 }));
    this.prevJumpVine = this.players.map(() => false);
    this.vineGrabs = 0;
    this.stampede = freshStampede();
    this.herdWarnings = [];
    this.beasts = [];
    this.herdsReleased = 0;
    this.herdHits = 0;
    this.windMs = 0;
    this.bossGust = false;
    this.windSpawnMs = 0;
    this.windPushes = 0;
    this.darkAlpha = 0;
    this.blackoutMs = 0;
    this.lightCount = 0;
    this.lightPool = [];
    this.darkRt = null;
    for (const x of this.level.crystals ?? []) {
      if (this.level.lightStyle === 'candle') this.drawCandle(x);
      else this.drawCrystal(x);
    }
    this.reverseMs = 0;
    this.inhaling = false;
    this.inhaleFxMs = 0;
    this.slowMs = this.players.map(() => 0);
    this.mochiHits = 0;
    this.pulls = 0;
    this.createStars();
    if (this.level.darkness?.length) {
      this.makeLightTexture();
      this.darkRt = this.add.renderTexture(0, 0, VIEW_W, WORLD_H).setOrigin(0, 0).setScrollFactor(0).setDepth(DARK_DEPTH).setVisible(false);
    }
    this.beamGfx = this.add.graphics().setDepth(4);
    this.beamTiles = [];

    const chestGroup = this.physics.add.staticGroup();
    const alreadyOpened = new Set(this.initData.openedChests ?? []);
    this.level.chests.forEach((c, i) => {
      const rect = this.add.rectangle(c.x, c.bottom - CHEST_H / 2, CHEST_W, CHEST_H, 0xc98b4f).setStrokeStyle(2, 0xffe08a);
      chestGroup.add(rect);
      const closedKey = this.textures.exists('chest-closed') ? 'chest-closed' : 'chest';
      const art = this.textures.exists(closedKey) ? this.add.image(c.x, c.bottom, closedKey).setOrigin(0.5, 1) : null;
      if (art) rect.setVisible(false);
      const chest: Chest = { rect, opened: false, art };
      if (alreadyOpened.has(i)) this.markOpened(chest, false);
      this.chests.push(chest);
    });
    this.pickupGroup = this.physics.add.group();
    this.physics.add.collider(this.pickupGroup, this.terrain);
    for (const p of this.players) {
      this.physics.add.overlap(p.zone, chestGroup, (_z, c) => this.touchChest(p, c));
      this.physics.add.overlap(p.zone, this.pickupGroup, (_z, i) => this.touchPickup(p, i));
    }
    this.maxReachedX = startX;
    this.restarting = false;

    for (const h of this.level.hints ?? []) this.drawSign(h.x, hintText(h.kind, this.mode, this.initData.touch ?? false));
    this.flags = this.level.checkpoints.map((cp) => ({ x: cp, g: this.add.graphics().setDepth(-1), on: null }));
    const thorns = this.physics.add.staticGroup();
    for (const t of this.level.thorns) {
      thorns.add(this.add.rectangle(t.x + t.w / 2, GROUND_Y - THORN_H / 2, t.w, THORN_H, COLOR.thorn).setVisible(false));
      this.drawThorns(t.x, t.w);
    }
    for (const p of this.players) this.physics.add.overlap(p.zone, thorns, () => this.hurtPlayer(p, true));

    this.enemyGroup = this.physics.add.group();
    // 會飛的魔物(含貓頭鷹)只會被地面擋住,穿過平台與通道,不會卡在地形旁邊。
    // 關主與小頭目身體比較高,也穿過平台(不會卡在平台底下);掉下來的沙磚、木頭照樣擋住。
    this.physics.add.collider(this.enemyGroup, this.terrain, undefined, (e, t) => {
      const en = this.enemyFor(e);
      if (en?.def.flying) return groundRects.has(t);
      if (en && en === this.boss?.enemy) return !platformRects.has(t);
      return true;
    });
    // 地上的魔物走到河溝邊就停住,不會掉進河裡(戰鬥區也不會因此少算)。
    const banks = this.physics.add.staticGroup();
    for (const g of water?.gaps ?? []) {
      for (const x of [g.x - 2, g.x + g.w + 2]) banks.add(this.add.rectangle(x, GROUND_Y - BANK_H / 2, 4, BANK_H).setVisible(false));
    }
    this.physics.add.collider(this.enemyGroup, banks, undefined, (e) => !this.enemyFor(e)?.def.flying);
    // 正在從地面冒出的魔物還看不見,不傷人也不會被打到。
    const solid = (_a: unknown, e: unknown): boolean => {
      const en = this.enemyFor(e);
      return !en?.emerging && !en?.burrowed;
    };
    for (const p of this.players) {
      this.physics.add.overlap(p.zone, this.enemyGroup, () => this.hurtPlayer(p, true), solid);
    }

    this.projectiles = new ProjectileSystem(this, this.terrain, (target, hit) => this.onProjectileHit(target, hit));
    this.projectiles.addTargets(this.enemyGroup);
    this.projectiles.addTargets(this.targetGroup);

    this.shots = new EnemyShotSystem(this, this.terrain);
    this.players.forEach((p, i) => {
      this.shots.addVictim(p.zone, (kind) => {
        if (p.health.down) return false;
        // 月兔的麻糬不扣愛心,黏到會變慢一下。
        if (kind === 'mochi') this.stickMochi(p, i);
        else this.hurtPlayer(p, false);
        return true;
      });
    });

    this.add
      .text(16, 12, controlHint(this.mode, this.initData.touch), {
        fontSize: this.mode === 'duo' ? '15px' : '18px',
        color: '#f3e9d2',
        ...HUD_STROKE,
      })
      .setScrollFactor(0)
      .setDepth(10);
    makeHeartTextures(this);
    const duo = this.mode === 'duo';
    const heartStep = duo ? 15 : 19;
    this.hudRows = this.players.map((_, i) => {
      const x = 16 + i * HUD_ROW_W;
      const icon = this.textures.exists(weaponIcon('yawnBubble'))
        ? this.add.image(x + HUD_ICON / 2, 52, weaponIcon('yawnBubble')).setScrollFactor(0).setDepth(10)
        : null;
      const style = { fontSize: duo ? '16px' : '20px', color: '#ffb3c7', ...HUD_STROKE };
      const labelX = icon ? x + HUD_ICON + 6 : x;
      const label = this.add.text(labelX, 40, duo ? (i === 0 ? 'A' : 'B') : '', style).setScrollFactor(0).setDepth(10);
      // 愛心用程式畫的圖(♥ 字元在部分 Android 會變成表情符號)。
      const heartsX = labelX + (duo ? 18 : 0) + HEART_SIZE / 2;
      const hearts = Array.from({ length: MAX_HEARTS }, (_, h) =>
        this.add.image(heartsX + h * heartStep, 53, HEART_FULL).setScrollFactor(0).setDepth(10).setScale(duo ? 0.8 : 1),
      );
      const text = this.add.text(heartsX + MAX_HEARTS * heartStep, 40, '', style).setScrollFactor(0).setDepth(10);
      return { icon, label, hearts, text };
    });
    this.arenaHud = this.add
      .text(VIEW_W / 2, 90, '', { fontSize: '26px', color: '#ffe08a', ...HUD_STROKE })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);
    this.bossName = this.add
      .text(VIEW_W / 2, BOSS_BAR_Y - 6, '', { fontSize: '18px', color: '#f3e9d2', ...HUD_STROKE })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(10);
    this.bossBarBg = this.add
      .rectangle((VIEW_W - BOSS_BAR_W) / 2, BOSS_BAR_Y, BOSS_BAR_W, BOSS_BAR_H, 0x2a2550)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xf3e9d2)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);
    this.bossBar = this.add
      .rectangle((VIEW_W - BOSS_BAR_W) / 2, BOSS_BAR_Y, BOSS_BAR_W, BOSS_BAR_H, 0xffb3c7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);
    this.bossPhaseText = this.add
      .text(VIEW_W / 2, 200, '', { fontSize: '30px', color: '#ffe08a', ...HUD_STROKE })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);
    this.reverseText = this.add
      .text(VIEW_W / 2, 140, '左右顛倒!', { fontSize: '28px', color: '#7ae0d0', ...HUD_STROKE })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);
    this.starHud = null;
    if (this.stars.length > 0) {
      if (this.textures.exists('star')) this.add.image(VIEW_W - 92, 24, 'star').setScrollFactor(0).setDepth(10);
      this.starHud = this.add
        .text(VIEW_W - 74, 24, '', { fontSize: '20px', color: '#ffe08a', ...HUD_STROKE })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(10);
    }

    this.keyboard = new KeyboardSource(window, document);
    this.touchControls = this.initData.touch ? mountTouchControls(document.body) : null;
    // 物理移動完才把美術圖對到判定上,圖不會落後一格。
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.renderEnemyArt, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.renderEnemyArt, this);
      this.keyboard.destroy();
      this.touchControls?.destroy();
      this.touchControls = null;
    });

    this.publishDebug();
  }

  update(time: number, delta: number): void {
    const t = this.getTuning();
    const dtMs = Math.min(delta, MAX_DT_MS);
    // 卡頓時物理也只前進 MAX_DT_MS,不會一次衝過頭(例如蝙蝠俯衝低到打到蹲著的人)。
    this.physics.world.update(time, dtMs);
    const raw = intentsForMode(this.keyboard.pressed(), this.mode, this.touchControls?.intent());
    // 孔雀開屏後一陣子左右顛倒。
    const intents = this.reverseMs > 0 ? raw.map((i) => reverseIntent(i)) : raw;

    const playerTuning = this.level.underwater ? waterTuning(t) : t;
    this.players.forEach((p, i) => {
      p.health = tickHealth(p.health, dtMs);
      const prevVx = p.body().velocity.x;
      const r = p.update(intents[i], dtMs, playerTuning, (reach) => this.findMeleeTarget(reach) !== null);
      this.applyIce(p, prevVx, dtMs);
      this.applyVine(p, i, intents[i], dtMs);
      this.applyWind(p);
      this.applyInhale(p);
      this.applyMochi(p, i);
      if (p.jumped) audio.sfx('jump');
      if (r.kind === 'bullet') {
        this.projectiles.fire(p, r.weapon, r.spawn, t);
        audio.sfx('shoot');
      }
      else if (r.kind === 'melee') this.performMelee(r.reach);
      this.applyWater(p);
      // 打擊停頓時物理暫停,流沙與機關也一起停。
      if (!this.physics.world.isPaused) this.desert.applySand(p, i, dtMs);
      if (this.level.underwater) this.applySwim(p, i, intents[i]);
    });
    this.currentsView?.update(dtMs, this.scrollX, VIEW_W);
    this.updateIcicles();
    this.updateVolcano(dtMs);
    this.updateVines(dtMs);
    this.updateStampede(dtMs);
    this.updateWind(dtMs);
    this.updateW10(dtMs);
    this.projectiles.update(dtMs, this.scrollX, VIEW_W, () =>
      this.enemies.filter((e) => !e.emerging && !this.isInvulnerable(e)).map((e) => ({ x: e.body.x, y: e.body.y })),
    );
    this.updateEnemies(dtMs, t);
    this.updateBoss(dtMs, time);
    if (!this.physics.world.isPaused) this.desert.update(dtMs);
    this.shots.update();
    this.updatePickups(time);
    this.handleTeam();

    const awake = this.players.filter((p) => !p.health.down);
    this.updateEncounters(dtMs, time);
    const target = applyLock(
      advanceTeamCamera(this.scrollX, awake.map((p) => p.x), VIEW_W, this.level.worldW, CAMERA_LEAD, SCREEN_MARGIN),
      this.bossLock ?? this.lockScrollX,
    );
    const maxStep = (Math.max(t.walkSpeed, t.airSpeed) * CAMERA_MAX_SPEED_RATIO * dtMs) / 1000;
    this.scrollX = limitCameraStep(this.scrollX, target, maxStep);
    this.cameras.main.scrollX = this.scrollX;
    this.background.update(this.scrollX);
    this.renderFlags();
    for (const p of awake) p.clampX(minPlayerX(this.scrollX, SCREEN_MARGIN), this.scrollX + VIEW_W - SCREEN_MARGIN);
    for (const p of awake) this.maxReachedX = Math.max(this.maxReachedX, p.x);
    for (const p of this.players) p.render(time);
    // 黑暗的光圈在鏡頭移動、玩家夾回畫面之後才畫(不會比畫面慢一格)。
    this.updateDarkness(dtMs);
    this.renderHud();

    this.publishDebug();
  }

  /** 地面:深色本體加一條亮邊;平台與天花板:圓角、深紫外框、上緣亮邊。 */
  private drawTerrain(t: { x: number; y: number; w: number; h: number }, isGround: boolean): void {
    const g = this.add.graphics().setDepth(-2);
    if (isGround) {
      g.fillStyle(this.palette.ground).fillRect(t.x, t.y, t.w, t.h);
      g.fillStyle(this.palette.rim).fillRect(t.x, t.y, t.w, 3);
      return;
    }
    const art = this.level.platformArt;
    if (art && this.textures.exists(art)) {
      // 雪堆平台圖 28 高,上緣對齊平台頂。
      this.add.tileSprite(t.x, t.y - 2, t.w, 28, art).setOrigin(0, 0).setDepth(-2);
      g.destroy();
      return;
    }
    const r = Math.min(8, t.h / 2);
    g.fillStyle(COLOR.outline).fillRoundedRect(t.x - 2, t.y - 2, t.w + 4, t.h + 4, r + 2);
    g.fillStyle(this.palette.platform).fillRoundedRect(t.x, t.y, t.w, t.h, r);
    g.fillStyle(this.palette.rim).fillRoundedRect(t.x + 3, t.y + 2, t.w - 6, 4, 2);
  }

  private guardKey(player: GuardPlayer): string {
    const guards = this.initData.guards;
    return guards ? guardKeyFor(this, guards.get(), player) : DEFAULT_GUARD_KEY;
  }

  /** B 用小綿羊時染淡綠色和 A 區分;自己畫的守衛不染色。 */
  private guardArtB(): { artKey: string; artTint: number | null } {
    const artKey = this.guardKey('B');
    return { artKey, artTint: artKey === DEFAULT_GUARD_KEY ? COLOR.artTintB : null };
  }

  /** 淺水區走得慢;掉進河溝扣一顆愛心,從左岸重新出來(睡著的人直接搬上岸)。 */
  private applyWater(p: PlayerEntity): void {
    const water = this.level.water;
    if (!water) return;
    const pb = p.body();
    // 在水裡跳來跳去也一樣慢(腳離地面 24 以內都算在水裡)。
    if (!p.health.down && p.feetY > GROUND_Y - SHALLOW_DEPTH && inShallow(p.x, water.shallow)) {
      pb.setVelocityX(pb.velocity.x * SHALLOW_SPEED);
    }
    if (!fellIntoRiver(p.feetY)) return;
    this.splash(p.x);
    audio.sfx('splash');
    const half = STAND_HALF_W + 2;
    p.teleport(respawnX(p.x, water.gaps, minPlayerX(this.scrollX, SCREEN_MARGIN) + half, this.scrollX + VIEW_W - SCREEN_MARGIN - half), GROUND_Y);
    this.riverFalls += 1;
    if (p.health.down) return;
    this.hurtPlayer(p, false);
    // 上岸後多一點無敵時間,岸邊剛好有魔物也不會馬上再被打。
    p.health = { ...p.health, invulnMs: Math.max(p.health.invulnMs, RIVER_INVULN_MS) };
  }

  /** 冰上:左右速度慢慢追上想要的速度(起步慢、放開會滑一段)。只有站在冰地面上才滑。 */
  private applyIce(p: PlayerEntity, prevVx: number, dtMs: number): void {
    const ice = this.level.ice;
    if (!ice || p.health.down) return;
    const pb = p.body();
    const grounded = (pb.blocked.down || pb.touching.down) && p.feetY >= GROUND_Y - 2;
    if (!grounded || !onIce(p.x, ice)) return;
    pb.setVelocityX(iceVx(prevVx, pb.velocity.x, dtMs));
  }

  /** 醒著的玩家走到冰柱附近,冰柱就搖晃、掉下來(每根只掉一次)。 */
  private updateIcicles(): void {
    for (const ic of [...this.hangingIcicles]) {
      if (!this.players.some((p) => !p.health.down && Math.abs(p.x - ic.x) <= ICICLE_TRIGGER_X)) continue;
      this.hangingIcicles = this.hangingIcicles.filter((x) => x !== ic);
      this.tweens.add({ targets: ic.view, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => ic.view.destroy() });
      this.desert.dropBlock(ic.x, 'icicle');
    }
  }

  /**
   * 世界 6 的藤蔓:在空中碰到藤蔓下段就抓住(順著飛過來的方向盪),按住左右越盪越高,
   * 按跳躍放手往盪的方向飛出去;睡著就鬆手。
   */
  private applyVine(p: PlayerEntity, i: number, intent: Intent, dtMs: number): void {
    const vines = this.level.vines;
    if (!vines?.length) return;
    const pb = p.body();
    const jumpPressed = intent.jump && !this.prevJumpVine[i];
    this.prevJumpVine[i] = intent.jump;
    this.regrabMs[i] = Math.max(0, this.regrabMs[i] - dtMs);
    const held = this.holding[i];
    if (held !== null) {
      if (p.health.down) {
        this.holding[i] = null;
        return;
      }
      const push = intent.left && !intent.right ? -1 : intent.right && !intent.left ? 1 : 0;
      const st = stepVine(this.vineStates[held], true, push, dtMs);
      this.vineStates[held] = st;
      if (jumpPressed) {
        const v = releaseVelocity(st, p.motor.facing);
        this.holding[i] = null;
        this.regrabMs[i] = REGRAB_MS;
        this.lastVine[i] = held;
        pb.setVelocity(v.vx, v.vy);
        this.fling[i] = { vx: v.vx, ms: FLING_MS };
        audio.sfx('jump');
        return;
      }
      const hand = vineHand(vines[held], st);
      pb.reset(hand.x, hand.y + HANG_BELOW_HAND);
      return;
    }
    const grounded = pb.blocked.down || pb.touching.down;
    const f = this.fling[i];
    if (f.ms > 0) {
      f.ms = grounded || pb.blocked.left || pb.blocked.right ? 0 : f.ms - dtMs;
      if (f.ms > 0) pb.setVelocityX(f.vx);
    }
    if (grounded) this.lastVine[i] = null;
    if (grounded || p.health.down || this.regrabMs[i] > 0) return;
    for (let k = 0; k < vines.length; k++) {
      if (this.holding.includes(k) || k === this.lastVine[i] || !canGrab(vines[k], this.vineStates[k], p.x, p.feetY - pb.height, p.feetY)) continue;
      this.holding[i] = k;
      this.vineStates[k] = { angle: this.vineStates[k].angle, omega: grabOmega(pb.velocity.x, p.motor.facing) };
      this.fling[i] = { vx: 0, ms: 0 };
      this.vineGrabs += 1;
      return;
    }
  }

  /** 柔和的光圈(中間全亮、往外慢慢變暗),擦黑暗遮罩用;半徑 LIGHT_TEX_R。 */
  private makeLightTexture(): void {
    if (this.textures.exists(LIGHT_KEY)) return;
    const size = LIGHT_TEX_R * 2;
    const tex = this.textures.createCanvas(LIGHT_KEY, size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(LIGHT_TEX_R, LIGHT_TEX_R, 0, LIGHT_TEX_R, LIGHT_TEX_R, LIGHT_TEX_R);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  /** 發光水晶:立在地上、一閃一閃。 */
  private drawCrystal(x: number): void {
    const view = this.textures.exists('crystal')
      ? this.add.image(x, GROUND_Y, 'crystal').setOrigin(0.5, 1)
      : this.add.triangle(x, GROUND_Y - 18, 0, 36, 12, 0, 24, 36, 0xc0a0ff).setOrigin(0.5, 0.5);
    view.setDepth(-1);
    this.tweens.add({ targets: view, alpha: { from: 1, to: 0.75 }, duration: 900, yoyo: true, repeat: -1 });
  }

  /**
   * 世界 9:黑暗區裡畫面蓋一層黑,只在玩家身邊、發光水晶、會發光的魔物(螢火蟲、發光蛾、女王、巨鼴鼠的頭燈)附近擦出光圈。
   * 火螢女王閃光後一陣子更黑、玩家身邊的光變小。
   */
  private updateDarkness(dtMs: number): void {
    this.blackoutMs = Math.max(0, this.blackoutMs - Math.min(dtMs, MAX_DT_MS));
    const rt = this.darkRt;
    if (!rt) return;
    const dark = inDark(this.scrollX + VIEW_W / 2, this.level.darkness ?? []);
    const blackout = this.blackoutMs > 0;
    const target = !dark ? 0 : blackout ? BLACKOUT_ALPHA : DARK_ALPHA;
    this.darkAlpha = blackout && dark ? target : fadeDark(this.darkAlpha, target, dtMs);
    if (this.darkAlpha <= 0.01) {
      rt.setVisible(false);
      this.lightCount = 0;
      return;
    }
    const lights: { x: number; y: number; r: number }[] = [];
    for (const p of this.players) lights.push({ x: p.x, y: p.feetY - 24, r: blackout ? BLACKOUT_PLAYER_RADIUS : LIGHT_RADIUS.player });
    for (const x of this.level.crystals ?? []) {
      if (x > this.scrollX - LIGHT_RADIUS.crystal && x < this.scrollX + VIEW_W + LIGHT_RADIUS.crystal) lights.push({ x, y: GROUND_Y - 40, r: LIGHT_RADIUS.crystal });
    }
    for (const e of this.enemies) {
      if (e.emerging) continue;
      const t = e.def.type;
      if (t === 'moth' || t === 'firefly' || t === 'queen' || t === 'axolotl' || t === 'noisyStar') lights.push({ x: e.x, y: e.body.y, r: LIGHT_RADIUS[t] });
      // 巨鼴鼠的頭燈:照著前面。
      if (t === 'mole') lights.push({ x: e.x + e.brain.facing * 40, y: e.body.y - e.def.h / 4, r: LIGHT_RADIUS.headlamp });
    }
    while (this.lightPool.length < lights.length) this.lightPool.push(new Phaser.GameObjects.Image(this, 0, 0, LIGHT_KEY));
    const used = lights.map((l, i) =>
      this.lightPool[i].setPosition(l.x - this.scrollX, l.y).setScale(l.r / LIGHT_TEX_R),
    );
    this.lightCount = lights.length;
    rt.setVisible(true);
    rt.clear();
    rt.fill(DARK_COLOR, this.darkAlpha);
    if (used.length > 0) rt.erase(used);
    rt.render();
  }

  /** 燭台(世界 10 的城堡大廳):金色燭台上一根蠟燭,火焰一閃一閃。 */
  private drawCandle(x: number): void {
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(COLOR.outline).fillRoundedRect(x - 14, GROUND_Y - 8, 28, 8, 3).fillRect(x - 4, GROUND_Y - 44, 8, 38).fillRoundedRect(x - 12, GROUND_Y - 48, 24, 7, 3);
    g.fillStyle(0xe0b050).fillRoundedRect(x - 12, GROUND_Y - 6, 24, 5, 2).fillRect(x - 2, GROUND_Y - 42, 4, 36).fillRoundedRect(x - 10, GROUND_Y - 46, 20, 4, 2);
    g.fillStyle(0xfff4e0).fillRect(x - 4, GROUND_Y - 66, 8, 20);
    const flame = this.add.ellipse(x, GROUND_Y - 72, 9, 14, 0xffc040).setDepth(-1);
    this.tweens.add({ targets: flame, scaleY: { from: 1, to: 0.8 }, alpha: { from: 1, to: 0.8 }, duration: 260, yoyo: true, repeat: -1 });
  }

  /** 世界 10 的星星:碰到就收集;重來後已經拿過的不再出現。 */
  private createStars(): void {
    const got = new Set(this.initData.collectedStars ?? []);
    this.stars = (this.level.stars ?? []).map((s, i) => {
      const view = this.textures.exists('star')
        ? this.add.image(s.x, s.y, 'star')
        : this.add.star(s.x, s.y, 5, STAR_R / 2, STAR_R, 0xffe070).setStrokeStyle(2, COLOR.outline);
      view.setDepth(3);
      this.tweens.add({ targets: view, y: s.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const taken = got.has(i);
      view.setVisible(!taken);
      return { x: s.x, y: s.y, view, got: taken };
    });
  }

  private collectedStarIndexes(): number[] {
    return this.stars.flatMap((s, i) => (s.got ? [i] : []));
  }

  /** 世界 10:收集星星、左右顛倒與麻糬變慢的計時、夢貘吸氣的線。 */
  private updateW10(dtMs: number): void {
    const dt = Math.min(dtMs, MAX_DT_MS);
    for (const p of this.players) {
      if (p.health.down) continue;
      const b = p.body();
      for (const s of this.stars) {
        if (s.got || s.x < b.left - STAR_R || s.x > b.right + STAR_R || s.y < b.top - STAR_R || s.y > b.bottom + STAR_R) continue;
        s.got = true;
        audio.sfx('item');
        this.tweens.killTweensOf(s.view);
        this.tweens.add({ targets: s.view, y: s.view.y - 30, scale: 1.8, alpha: 0, duration: 350, onComplete: () => s.view.setVisible(false) });
      }
    }
    this.starHud?.setText(`${this.stars.filter((s) => s.got).length} / ${this.stars.length}`);
    if (this.physics.world.isPaused) return;
    this.reverseMs = Math.max(0, this.reverseMs - dt);
    this.reverseText.setVisible(this.reverseMs > 0);
    this.slowMs = this.slowMs.map((ms) => Math.max(0, ms - dt));
    const boss = this.boss?.enemy;
    if (!this.inhaling || !boss) return;
    // 夢貘吸氣:風線從畫面另一邊往鼻子飛過去。
    this.inhaleFxMs -= dt;
    if (this.inhaleFxMs > 0) return;
    this.inhaleFxMs = INHALE_FX_MS;
    const mouthX = boss.x + boss.brain.facing * (boss.def.w / 2);
    const fromX = mouthX + boss.brain.facing * (300 + Math.random() * 300);
    const y = GROUND_Y - 20 - Math.random() * 160;
    const line = this.add.rectangle(fromX, y, 40, 4, 0xe0d0ff, 0.8).setDepth(6);
    this.tweens.add({ targets: line, x: mouthX, y: boss.body.y, alpha: 0.2, duration: 450, onComplete: () => line.destroy() });
  }

  /** 夢貘吸氣時把醒著的玩家往牠那邊拉(往反方向跑還跑得掉)。 */
  private applyInhale(p: PlayerEntity): void {
    const boss = this.boss?.enemy;
    if (!this.inhaling || !boss || p.health.down) return;
    // 已經貼到夢貘身上就不再拉(不會被卡在牠身上一直扣愛心)。
    const reach = (boss.def.w / 2) * boss.artScaleMul + INHALE_STOP_GAP;
    if (Math.abs(boss.x - p.x) < reach) return;
    const pb = p.body();
    pb.setVelocityX(pb.velocity.x + Math.sign(boss.x - p.x) * INHALE_PULL);
    this.pulls += 1;
  }

  /** 黏到麻糬:走得慢一點。 */
  private applyMochi(p: PlayerEntity, i: number): void {
    if (!(this.slowMs[i] > 0) || p.health.down) return;
    const pb = p.body();
    pb.setVelocityX(pb.velocity.x * MOCHI_SLOW);
  }

  private stickMochi(p: PlayerEntity, i: number): void {
    if (this.bossDefeated) return;
    this.slowMs[i] = MOCHI_SLOW_MS;
    this.mochiHits += 1;
    audio.sfx('blocked');
    const label = this.add
      .text(p.x, p.feetY - 70, '黏住了!', { fontSize: '18px', color: '#fff8f0', stroke: '#3a2a5a', strokeThickness: 4 })
      .setOrigin(0.5, 1)
      .setDepth(DARK_DEPTH + 1);
    this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: 700, onComplete: () => label.destroy() });
  }

  /** 風區現在的風有多強(0–1)。 */
  private windNow(): number {
    return this.level.winds?.length ? windStrength(this.windMs) : 0;
  }

  /** 世界 8:在風區裡(或雷鳥颳強風時)被風往左推。睡著的不推。 */
  private applyWind(p: PlayerEntity): void {
    if (p.health.down) return;
    const zone = this.level.winds && inWind(p.x, this.level.winds) ? WIND_PUSH * this.windNow() : 0;
    const push = this.bossGust ? Math.max(zone, BOSS_GUST_PUSH) : zone;
    if (push <= 0) return;
    const pb = p.body();
    pb.setVelocityX(windVx(pb.velocity.x, push, 1));
    this.windPushes += 1;
  }

  /** 風的時鐘往前走;有風的時候畫面上飄過往左吹的風線。 */
  private updateWind(dtMs: number): void {
    if (this.physics.world.isPaused) return;
    const dt = Math.min(dtMs, MAX_DT_MS);
    this.windMs += dt;
    const zones = this.level.winds ?? [];
    const blowing = this.bossGust || (this.windNow() > 0 && this.players.some((p) => inWind(p.x, zones)));
    if (!blowing) return;
    this.windSpawnMs -= dt;
    if (this.windSpawnMs > 0) return;
    this.windSpawnMs = WIND_STREAK_EVERY_MS;
    // 整個畫面都飄,線條放大一點才看得出來在颳風。
    const x = this.scrollX + 60 + Math.random() * VIEW_W;
    const y = 120 + Math.random() * (GROUND_Y - 140);
    const alpha = this.bossGust ? 0.95 : 0.9 * this.windNow();
    const streak = this.textures.exists('wind-streak')
      ? this.add.image(x, y, 'wind-streak').setAlpha(alpha).setScale(WIND_STREAK_SCALE)
      : this.add.rectangle(x, y, 72, 5, 0xffffff, alpha);
    streak.setDepth(6);
    this.tweens.add({ targets: streak, x: x - WIND_STREAK_TRAVEL, alpha: 0, duration: WIND_STREAK_MS, onComplete: () => streak.destroy() });
  }

  /** 世界 7:奔跑區計時放出角馬群(先預告);跑過的角馬撞到醒著的玩家扣一顆愛心、往上彈。 */
  private updateStampede(dtMs: number): void {
    const zones = this.level.stampedes;
    if (zones) {
      const awake = this.players.filter((p) => !p.health.down).map((p) => p.x);
      const step = stepStampede(this.stampede, zones, awake, dtMs);
      this.stampede = step.state;
      if (step.warn !== null) this.warnHerd(step.warn, false);
      if (step.release !== null) this.releaseHerd(step.release);
    }
    // 預告的沙塵與「!」時間到就收掉。
    for (const w of [...this.herdWarnings]) {
      w.ms -= Math.min(dtMs, MAX_DT_MS);
      if (w.ms > 0) continue;
      this.destroyWarning(w);
    }
    // 打倒魔物的停頓(hit-stop)時角馬也停住。
    if (this.physics.world.isPaused) return;
    const dt = Math.min(dtMs, MAX_DT_MS) / 1000;
    const t = this.time.now;
    for (const b of [...this.beasts]) {
      b.x += b.dir * HERD_SPEED * dt;
      b.view.setX(b.x);
      b.dust?.setX(b.x - b.dir * 30);
      if (b.view instanceof Phaser.GameObjects.Image) {
        const frame = animFrame(SPRITES.wildebeest.file, t, true);
        if (frame && this.textures.exists(frame)) b.view.setTexture(frame);
      }
      for (const p of this.players) {
        if (p.health.down) continue;
        const pb = p.body();
        if (beastHits(b.x, GROUND_Y, p.x, p.feetY - pb.height, p.feetY, pb.width / 2) && this.hurtPlayer(p, true)) this.herdHits += 1;
      }
      const gone = b.dir < 0 ? b.x < this.scrollX - HERD_DESPAWN : b.x > this.scrollX + VIEW_W + HERD_DESPAWN;
      if (gone) {
        b.view.destroy();
        b.dust?.destroy();
        this.beasts = this.beasts.filter((x) => x !== b);
      }
    }
  }

  /**
   * 獸群預告:角馬要來的那一邊畫面邊緣揚起沙塵、跳出「!」,地面震動。
   * release 為 true 時(關主叫的)預告完自己放出來;奔跑區的由 stepStampede 放。
   */
  private warnHerd(dir: 1 | -1, release: boolean): void {
    const edgeX = dir < 0 ? VIEW_W - 50 : 50;
    const views: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < 3; i++) {
      const y = GROUND_Y - 20 - i * 26;
      const puff = this.textures.exists('herd-dust')
        ? this.add.image(edgeX, y, 'herd-dust').setAlpha(0.8)
        : this.add.ellipse(edgeX, y, 64, 32, 0xd8c090, 0.7);
      puff.setScrollFactor(0).setDepth(6);
      this.tweens.add({ targets: puff, scaleX: 1.3, scaleY: 1.2, duration: 200 + i * 60, yoyo: true, repeat: -1 });
      views.push(puff);
    }
    const mark = this.add
      .text(edgeX, GROUND_Y - 110, '!', { fontSize: '44px', color: '#ffe08a', stroke: '#3a2a5a', strokeThickness: 6 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(7);
    this.tweens.add({ targets: mark, scale: 1.25, duration: 150, yoyo: true, repeat: -1 });
    views.push(mark);
    // 短短震一下就好(震動期間其他震動會被忽略)。
    this.cameras.main.shake(HERD_SHAKE_MS, 0.0025);
    audio.sfx('bossAppear');
    this.herdWarnings.push({ dir, ms: HERD_WARN_MS, views });
    if (release) this.time.delayedCall(HERD_WARN_MS, () => this.releaseHerd(dir));
  }

  private destroyWarning(w: { views: Phaser.GameObjects.GameObject[] }): void {
    for (const v of w.views) {
      this.tweens.killTweensOf(v);
      v.destroy();
    }
    this.herdWarnings = this.herdWarnings.filter((x) => x !== w);
  }

  /** 關主被打倒:場上的角馬群與預告一起收掉。 */
  private clearHerds(): void {
    for (const w of [...this.herdWarnings]) this.destroyWarning(w);
    for (const b of this.beasts) {
      b.view.destroy();
      b.dust?.destroy();
    }
    this.beasts = [];
  }

  /** 放出一群角馬:從畫面外(dir 的反方向那邊)排成兩隻一組跑過來。 */
  private releaseHerd(dir: 1 | -1): void {
    if (this.bossDefeated) return;
    this.herdsReleased += 1;
    for (const o of HERD_OFFSETS) {
      const x = dir < 0 ? this.scrollX + VIEW_W + 40 + o : this.scrollX - 40 - o;
      const view = this.textures.exists('wildebeest')
        ? this.add.image(x, GROUND_Y, 'wildebeest').setOrigin(0.5, 1).setFlipX(dir > 0)
        : this.add.rectangle(x, GROUND_Y, 44, 48, 0x8a6a4a).setOrigin(0.5, 1);
      view.setDepth(4);
      const dust = this.textures.exists('herd-dust') ? this.add.image(x - dir * 30, GROUND_Y - 12, 'herd-dust').setAlpha(0.55).setDepth(3) : null;
      this.beasts.push({ x, dir, view, dust });
    }
  }

  /** 沒人抓的藤蔓慢慢停回垂直,停著時輕輕晃(看得出來可以抓);圖跟著角度轉。 */
  private updateVines(dtMs: number): void {
    const sway = Math.sin(this.time.now / VINE_SWAY_MS) * VINE_SWAY;
    this.vineStates.forEach((st, k) => {
      const held = this.holding.includes(k);
      if (!held) this.vineStates[k] = stepVine(st, false, 0, dtMs);
      this.vineViews[k].setRotation(-this.vineStates[k].angle - (held ? 0 : sway));
    });
  }

  /** 世界 5:腳踩在熔岩上就燙傷(往上彈);噴發區裡每隔一陣子掉石頭。 */
  private updateVolcano(dtMs: number): void {
    const lava = this.level.lava;
    if (lava) {
      for (const p of this.players) {
        if (p.health.down) continue;
        const pb = p.body();
        const onGround = (pb.blocked.down || pb.touching.down) && p.feetY >= GROUND_Y - 2;
        if (onGround && onLava(p.x, lava) && this.hurtPlayer(p, true)) {
          this.lavaBurns += 1;
          this.puffAt(p.x);
        }
      }
    }
    const zones = this.level.eruptions;
    if (!zones) return;
    const awake = this.players.filter((p) => !p.health.down).map((p) => p.x);
    const step = stepEruption(this.eruption, zones, awake, dtMs);
    this.eruption = step.state;
    if (step.rocks.length === 0) return;
    for (const x of step.rocks) this.desert.dropBlock(x, 'rock');
    audio.sfx('bossPhase');
    this.cameras.main.shake(180, 0.004);
  }

  /** 熔岩地面:美術的熔岩圖橫向接起來慢慢流動,沒有圖時畫橘紅色。 */
  private drawLava(x: number, w: number): void {
    if (this.textures.exists('lava-floor')) {
      const t = this.add.tileSprite(x, GROUND_Y - 4, w, 24, 'lava-floor').setOrigin(0, 0).setDepth(-1);
      this.tweens.add({ targets: t, tilePositionX: 96, duration: LAVA_FLOW_MS, repeat: -1 });
      this.tweens.add({ targets: t, alpha: { from: 1, to: 0.8 }, duration: 700, yoyo: true, repeat: -1 });
      return;
    }
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(0xff6a2a).fillRect(x, GROUND_Y - 4, w, 12);
    g.fillStyle(0xffd060).fillRect(x, GROUND_Y - 4, w, 3);
  }

  /** 冰地面:美術的冰面圖橫向接起來,沒有圖時畫淡藍色。 */
  private drawIce(x: number, w: number): void {
    if (this.textures.exists('ice-floor')) {
      this.add.tileSprite(x, GROUND_Y - 4, w, 24, 'ice-floor').setOrigin(0, 0).setDepth(-1);
      return;
    }
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(0xd8f0ff, 0.9).fillRect(x, GROUND_Y - 4, w, 12);
    g.fillStyle(0xffffff).fillRect(x, GROUND_Y - 4, w, 3);
  }

  /** 在水裡游:按跳躍往上划/往上游、按住下往下潛、放開慢慢沉;水流推著走;不能游出水面。 */
  private applySwim(p: PlayerEntity, i: number, intent: Intent): void {
    const pb = p.body();
    const pressed = intent.jump && !this.prevJump[i];
    this.prevJump[i] = intent.jump;
    const grounded = pb.blocked.down || pb.touching.down;
    // 在海床上剛按下跳躍時交給一般的跳躍(p.jumped),這一格不再算划水。
    const stroke = pressed && !grounded && !p.jumped && !p.health.down;
    let v = { vx: pb.velocity.x, vy: swimVy(pb.velocity.y, { jump: intent.jump, jumpPressed: stroke, down: intent.down, grounded, asleep: p.health.down }) };
    if (!p.health.down) v = pushed(v.vx, v.vy, currentAt(p.x, p.feetY - 24, this.level.currents ?? []));
    pb.setVelocity(v.vx, v.vy);
    // 從海床起跳的聲音在一般跳躍那裡已經播過。
    if (stroke) audio.sfx('jump');
    if (stroke || p.jumped) this.bubbles(p.x, p.feetY - 40);
    const top = clampToWater(p.feetY, pb.velocity.y);
    if (!top) return;
    pb.reset(p.x, SWIM_TOP - pb.height / 2);
    pb.setVelocity(v.vx, top.vy);
  }

  /** 往上冒的小氣泡。 */
  private bubbles(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const b = this.add.circle(x + (i - 1) * 7, y, 3 + i, COLOR.waterLight, 0.7).setStrokeStyle(1, 0xffffff).setDepth(5);
      this.tweens.add({ targets: b, y: y - 40 - i * 12, alpha: 0, duration: 600, onComplete: () => b.destroy() });
    }
  }

  private splash(x: number): void {
    for (let i = 0; i < 6; i++) {
      const drop = this.add.circle(x + (i - 2.5) * 6, GROUND_Y + 6, 4, this.level.gapStyle === 'cloud' ? CLOUD_GAP.light : COLOR.water).setDepth(5);
      this.tweens.add({ targets: drop, y: GROUND_Y - 30 - (i % 3) * 12, alpha: 0, duration: 500, ease: 'Quad.easeOut', onComplete: () => drop.destroy() });
    }
  }

  /** 河溝畫成水面、淺水區畫成半透明的水、荷葉畫成綠色橢圓。 */
  private drawWater(water: NonNullable<LevelDef['water']>): void {
    const g = this.add.graphics().setDepth(-2);
    const cloud = this.level.gapStyle === 'cloud';
    for (const gap of water.gaps) {
      g.fillStyle(cloud ? CLOUD_GAP.fill : COLOR.water).fillRect(gap.x, GROUND_Y + 12, gap.w, WORLD_H - GROUND_Y - 12);
      g.fillStyle(cloud ? CLOUD_GAP.light : COLOR.waterLight).fillRect(gap.x, GROUND_Y + 12, gap.w, 4);
      // 雲海:上面一排圓圓的雲。
      if (cloud) for (let x = gap.x + 12; x < gap.x + gap.w; x += 24) g.fillStyle(CLOUD_GAP.light, 0.9).fillCircle(x, GROUND_Y + 16, 12);
    }
    const front = this.add.graphics().setDepth(3);
    for (const s of water.shallow) {
      front.fillStyle(COLOR.water, 0.45).fillRect(s.x, GROUND_Y - 6, s.w, 12);
      front.fillStyle(COLOR.waterLight, 0.8).fillRect(s.x, GROUND_Y - 6, s.w, 2);
    }
    for (const pad of water.pads) {
      g.fillStyle(COLOR.outline).fillEllipse(pad.x + pad.w / 2, pad.y + PAD_H / 2, pad.w + 6, PAD_H + 8);
      g.fillStyle(0x6fbf73).fillEllipse(pad.x + pad.w / 2, pad.y + PAD_H / 2, pad.w, PAD_H + 2);
    }
  }

  /** 教學告示牌:木頭柱子加一塊板子,字寫在板子上方。 */
  private drawSign(x: number, text: string): void {
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(COLOR.outline).fillRect(x - 3, GROUND_Y - 56, 6, 56);
    g.fillStyle(COLOR.outline).fillRoundedRect(x - 26, GROUND_Y - 72, 52, 30, 6);
    g.fillStyle(0xc98b4f).fillRoundedRect(x - 23, GROUND_Y - 69, 46, 24, 5);
    g.fillStyle(0xf8e08e).fillCircle(x, GROUND_Y - 57, 5);
    this.add
      .text(x, GROUND_Y - 80, text, { fontSize: '16px', color: '#fff6e5', stroke: '#3a2a5a', strokeThickness: 4, align: 'center', wordWrap: { width: 280, useAdvancedWrap: true } })
      .setOrigin(0.5, 1)
      .setDepth(-1);
  }

  /** 荊棘:一排小三角形。 */
  private drawThorns(x: number, w: number): void {
    const g = this.add.graphics().setDepth(-1);
    const n = Math.max(1, Math.round(w / 12));
    const step = w / n;
    for (let i = 0; i < n; i++) {
      const left = x + i * step;
      const tip = GROUND_Y - THORN_ART_H;
      g.fillStyle(COLOR.outline).fillTriangle(left - 2, GROUND_Y, left + step / 2, tip - 3, left + step + 2, GROUND_Y);
      g.fillStyle(COLOR.thorn).fillTriangle(left + 1, GROUND_Y, left + step / 2, tip, left + step - 1, GROUND_Y);
      g.fillStyle(COLOR.thornTip).fillTriangle(left + step / 2 - 3, tip + 8, left + step / 2, tip, left + step / 2 + 3, tip + 8);
    }
  }

  /** 檢查點小旗子,經過後變成月光黃。 */
  private renderFlags(): void {
    for (const f of this.flags) {
      const on = this.maxReachedX >= f.x;
      if (on === f.on) continue;
      f.on = on;
      f.g.clear();
      f.g.fillStyle(COLOR.outline).fillRect(f.x - 2, GROUND_Y - 64, 4, 64);
      f.g.fillStyle(on ? COLOR.flagOn : COLOR.flagOff).fillTriangle(f.x + 2, GROUND_Y - 64, f.x + 30, GROUND_Y - 54, f.x + 2, GROUND_Y - 44);
    }
  }

  /** 無敵或睡著時不會受傷;碰到荊棘時小彈跳一下。打倒關主後不再受傷。 */
  /** 回傳這一下有沒有真的打到(無敵時間內不算)。 */
  private hurtPlayer(p: PlayerEntity, bounce: boolean): boolean {
    if (this.bossDefeated) return false;
    const r = applyHit(p.health);
    p.health = r.health;
    if (r.hit) audio.sfx('hurt');
    if (r.hit && bounce && !r.health.down) p.body().setVelocityY(THORN_BOUNCE_VY);
    return r.hit;
  }

  private handleTeam(): void {
    // 打倒關主後就算全員睡著也不重來,直接進結算。
    if (this.restarting || this.bossDefeated) return;
    const action = decideTeam(this.players.map((p) => p.health));
    if (action.kind === 'revive') {
      const p = this.players[action.index];
      const partner = this.players.find((q) => !q.health.down)!;
      // 隊友抓著藤蔓在河上時,從岸邊落下(不掉進河裡)。
      const gaps = this.level.water?.gaps ?? [];
      p.teleport(gapAt(partner.x, gaps) ? respawnX(partner.x, gaps) : partner.x, REVIVE_DROP_Y);
      p.health = freshHealth(REVIVE_INVULN_MS);
    } else if (action.kind === 'restart') {
      this.restarting = true;
      this.scene.restart({
        ...this.initData,
        checkpointX: reachedCheckpoint(this.level.checkpoints, this.maxReachedX),
        restarts: this.restarts + 1,
        loadouts: this.players.map((p) => p.loadout),
        openedChests: this.openedChestIndexes(),
        collectedStars: this.collectedStarIndexes(),
        arenasCleared: this.encounters.nextArena,
        stats: { ...this.stats, defeated: this.stats.defeated + this.enemiesDefeated },
      });
    }
  }

  private renderHud(): void {
    const labels = this.mode === 'duo' ? ['A', 'B'] : [''];
    this.players.forEach((p, i) => {
      const row = this.hudRows[i];
      const down = p.health.down;
      row.label.setText(labels[i]);
      row.hearts.forEach((h, n) => {
        const key = n < p.health.hearts ? HEART_FULL : HEART_EMPTY;
        if (h.texture.key !== key) h.setTexture(key);
        h.setVisible(!down);
      });
      row.text.setText(down ? '睡著了…' : weaponHud(p.loadout, p.buffs)).setX(down ? row.hearts[0].x - HEART_SIZE / 2 : row.hearts[MAX_HEARTS - 1].x + HEART_SIZE);
      if (!row.icon) return;
      const key = weaponIcon(activeWeapon(p.loadout).id);
      if (this.textures.exists(key) && row.icon.texture.key !== key) row.icon.setTexture(key);
      const src = row.icon.frame;
      const scale = Math.min(HUD_ICON / src.width, HUD_ICON / src.height);
      row.icon.setScale(scale).setAlpha(p.health.down ? 0.4 : 1);
    });
  }

  spawnEnemy(type: EnemyType, x: number, y?: number, arena = false): EnemyEntity {
    const def = ENEMY_DEFS[type];
    const feetY = y !== undefined ? y + def.h / 2 : def.flying ? FLYING_SPAWN_Y + def.h / 2 : GROUND_Y;
    // 生成位置夾在世界內,避免掉出世界讓戰鬥區永遠清不完。
    const clampedX = Math.min(Math.max(x, def.w / 2), this.level.worldW - def.w / 2);
    const enemy = new EnemyEntity(this, type, clampedX, feetY, arena);
    this.enemyGroup.add(enemy.body);
    enemy.physicsBody().setAllowGravity(!def.flying);
    this.enemies.push(enemy);
    return enemy;
  }

  private updateEncounters(dtMs: number, time: number): void {
    const wasLocked = this.lockScrollX !== null;
    const step = stepEncounters(this.encounters, this.level.arenas, this.level.trickles, {
      scrollX: this.scrollX,
      arenaEnemiesAlive: this.enemies.filter((e) => e.arena).length,
      dtMs,
    });
    this.encounters = step.state;
    this.lockScrollX = step.lockScrollX;
    for (const s of step.spawns) this.spawnFrom(s.spec, s.arena);
    if (wasLocked && this.lockScrollX === null) this.goHintUntil = time + GO_HINT_MS;

    const active = this.encounters.active;
    if (active) {
      const total = this.level.arenas[this.encounters.nextArena].waves.length;
      this.arenaHud.setText(`清除魔物!(第 ${active.wave + 1} / ${total} 波)`);
    } else {
      this.arenaHud.setText(time < this.goHintUntil ? '前進 →' : '');
    }
  }

  /** 依進場方式決定生成位置:左右從畫面外、上方掉落、地面冒出。 */
  private spawnFrom(spec: SpawnSpec, arena: boolean): EnemyEntity {
    const def = ENEMY_DEFS[spec.type];
    if (spec.from === 'left' || spec.from === 'right') {
      let x = spec.from === 'left' ? this.scrollX - SIDE_SPAWN_MARGIN : this.scrollX + VIEW_W + SIDE_SPAWN_MARGIN;
      // 地上的魔物生在河溝上會直接掉下去:移到河溝外側(還是在畫面外)。
      const gap = def.flying ? null : gapAt(x, this.level.water?.gaps ?? []);
      if (gap) x = spec.from === 'left' ? gap.x - SIDE_SPAWN_MARGIN : gap.x + gap.w + SIDE_SPAWN_MARGIN;
      return this.spawnEnemy(spec.type, x, def.flying ? spec.y : undefined, arena);
    }
    const x = spec.x ?? this.scrollX + VIEW_W / 2;
    if (spec.from === 'top') return this.spawnEnemy(spec.type, x, TOP_SPAWN_Y, arena);
    const enemy = this.spawnEnemy(spec.type, x, def.flying ? undefined : GROUND_Y - def.h / 2, arena);
    enemy.emerging = true;
    enemy.body.setAlpha(0);
    enemy.render();
    this.tweens.add({ targets: enemy.body, alpha: 1, duration: EMERGE_MS, onComplete: () => (enemy.emerging = false) });
    const mound = this.add.ellipse(x, GROUND_Y, def.w + 16, 12, COLOR.dirt);
    this.tweens.add({ targets: mound, alpha: 0, delay: EMERGE_MS, duration: EMERGE_MS, onComplete: () => mound.destroy() });
    return enemy;
  }

  /** 醒著的玩家碰到未開的寶箱就打開;同一格只有第一個處理到的人拿到。 */
  private touchChest(p: PlayerEntity, obj: unknown): void {
    const chest = this.chests.find((c) => c.rect === obj);
    if (!chest || chest.opened || p.health.down) return;
    this.markOpened(chest, true);
    audio.sfx('chest');
    this.chestsOpened += 1;

    const owned = this.save.get().weapons;
    const result = this.riggedChest ? resultFor(this.riggedChest, owned) : openChest(Math.random, owned);
    this.riggedChest = null;
    this.lastChest = result.kind;
    if (result.kind === 'maxed') {
      this.dropItem('milkBottle', chest.rect.x, chest.rect.y - CHEST_H);
    } else {
      this.save.setStars(result.weapon, result.stars);
      this.stats = { ...this.stats, weaponsGot: addWeapon(this.stats.weaponsGot, result.weapon) };
      p.loadout = equip(result.weapon, result.stars);
    }

    const def = WEAPONS[result.weapon];
    const stars = result.kind === 'maxed' ? 3 : result.stars;
    const line = `${def.rarity} ${def.name} ${'★'.repeat(stars)}${result.kind === 'maxed' ? '(已滿,改給牛奶瓶)' : ''}`;
    const rates = `機率 R ${CHEST_RATES.R * 100}% / SR ${CHEST_RATES.SR * 100}% / SSR ${CHEST_RATES.SSR * 100}%`;
    const title = this.add
      .text(chest.rect.x, chest.rect.y - 96, line, { fontSize: '20px', color: RARITY_COLOR[def.rarity] })
      .setOrigin(0.5)
      .setDepth(8);
    const sub = this.add.text(chest.rect.x, chest.rect.y - 74, rates, { fontSize: '12px', color: '#f3e9d2' }).setOrigin(0.5).setDepth(8);
    this.tweens.add({ targets: [title, sub], alpha: 0, delay: CHEST_POPUP_MS - 400, duration: 400, onComplete: () => [title, sub].forEach((o) => o.destroy()) });
  }

  /** 打開寶箱:有圖時換成打開的圖並彈一下;沒有圖時色塊變暗。 */
  private markOpened(chest: Chest, animate: boolean): void {
    chest.opened = true;
    const art = chest.art;
    if (!art) {
      chest.rect.setFillStyle(0x5a4636).setAlpha(0.6);
      return;
    }
    if (this.textures.exists('chest')) art.setTexture('chest');
    if (animate) this.tweens.add({ targets: art, scaleX: 1.2, scaleY: 0.85, duration: CHEST_POP_MS, yoyo: true });
  }

  private closeChest(chest: Chest): void {
    chest.opened = false;
    if (!chest.art) {
      chest.rect.setFillStyle(0xc98b4f).setAlpha(1);
      return;
    }
    this.tweens.killTweensOf(chest.art);
    chest.art.setScale(1).setTexture(this.textures.exists('chest-closed') ? 'chest-closed' : 'chest');
  }

  private openedChestIndexes(): number[] {
    return this.chests.flatMap((c, i) => (c.opened ? [i] : []));
  }

  private dropItem(id: ItemId, x: number, y: number): void {
    const rect = this.add.rectangle(x, y, ITEM_SIZE, ITEM_SIZE, ITEM_COLOR[id]).setStrokeStyle(1, 0x2a2550);
    this.pickupGroup.add(rect);
    const t = this.getTuning();
    (rect.body as Phaser.Physics.Arcade.Body).setGravityY(this.level.underwater ? waterTuning(t).gravity : t.gravity);
    const key = itemSprite(id);
    const art = this.textures.exists(key) ? this.add.image(x, y, key).setOrigin(0.5, 1) : null;
    if (art) rect.setVisible(false);
    this.pickups.push({ rect, id, bornAt: this.time.now, art });
  }

  private touchPickup(p: PlayerEntity, obj: unknown): void {
    const pickup = this.pickups.find((i) => i.rect === obj);
    if (!pickup || p.health.down) return;
    this.applyItemTo(p, pickup.id);
    audio.sfx('item');
    const label = this.add
      .text(pickup.rect.x, pickup.rect.y - 20, ITEM_NAMES[pickup.id], { fontSize: '16px', color: '#ffe08a' })
      .setOrigin(0.5)
      .setDepth(8);
    this.tweens.add({ targets: label, y: label.y - 20, alpha: 0, duration: ITEM_POPUP_MS, onComplete: () => label.destroy() });
    this.removePickup(pickup);
  }

  /** 道具 8 秒後消失,最後 2 秒閃爍。 */
  private updatePickups(time: number): void {
    for (const pickup of [...this.pickups]) {
      const age = this.time.now - pickup.bornAt;
      if (age > ITEM_LIFE_MS) {
        this.removePickup(pickup);
        continue;
      }
      if (age > ITEM_LIFE_MS - ITEM_BLINK_MS) pickup.rect.setAlpha(Math.floor(time / 100) % 2 ? 0.3 : 1);
      pickup.art?.setPosition(pickup.rect.x, pickup.rect.y + ITEM_SIZE / 2).setAlpha(pickup.rect.alpha);
    }
  }

  private removePickup(pickup: ItemPickup): void {
    this.pickups = this.pickups.filter((i) => i !== pickup);
    pickup.rect.destroy();
    pickup.art?.destroy();
  }

  private applyItemTo(p: PlayerEntity, item: ItemId): void {
    const stars = p.loadout.special ? (this.save.get().weapons[p.loadout.special] ?? 1) : 1;
    const r = applyItem(item, { health: p.health, loadout: p.loadout, buffs: p.buffs, stars });
    p.health = r.health;
    p.loadout = r.loadout;
    p.buffs = r.buffs;
  }

  /** 測試用:把醒著的角色與鏡頭一起移到 x。 */
  private warp(x: number): void {
    this.players.forEach((p, i) => {
      if (!p.health.down) p.teleport(x + i * PARTNER_OFFSET_X, GROUND_Y);
    });
    this.scrollX = Math.min(Math.max(x - VIEW_W * CAMERA_LEAD, this.scrollX), this.level.worldW - VIEW_W);
    this.maxReachedX = Math.max(this.maxReachedX, x);
    // 跳過的路段:一個畫面以前的零星魔物與整個落在身後的戰鬥區當作已經過,不一次全部生出來。
    const behind = this.scrollX - VIEW_W;
    const fired = [...this.level.trickles].sort((p, q) => p.triggerScrollX - q.triggerScrollX).filter((t) => t.triggerScrollX < behind).length;
    const cleared = this.level.arenas.filter((a) => a.lockScrollX + VIEW_W < x).length;
    if (this.encounters.active === null) {
      this.encounters = {
        ...this.encounters,
        tricklesFired: Math.max(this.encounters.tricklesFired, fired),
        nextArena: Math.max(this.encounters.nextArena, cleared),
      };
    }
  }

  private updateEnemies(dtMs: number, t: Tuning): void {
    const awake = this.players.filter((p) => !p.health.down);
    for (const e of [...this.enemies]) {
      // 關主與新的小頭目由 updateBoss 控制;世界 1 的小頭目照一般魔物移動,但不會因為落在鏡頭後面被移除。
      const isBoss = e === this.boss?.enemy;
      if (isBoss && SCRIPTED_BOSSES.has(e.def.type)) {
        if (!e.def.flying) e.physicsBody().setGravityY(t.gravity);
        continue;
      }
      if (!isBoss && (e.x < this.scrollX - ENEMY_DESPAWN_BEHIND || e.body.y > WORLD_H + ENEMY_FALL_OUT)) {
        this.removeEnemy(e);
        continue;
      }
      const nearest = awake.reduce<PlayerEntity | null>(
        (best, p) => (best === null || Math.abs(p.x - e.x) < Math.abs(best.x - e.x) ? p : best),
        null,
      );
      const spit = e.update(nearest ? nearest.x : null, nearest ? nearest.feetY - 20 : null, dtMs, t.gravity);
      if (e.def.type === 'octopus') this.keepOnScreen(e);
      if (spit) this.shots.fire(e.x, e.def.flying ? e.body.y : e.body.y - e.def.h / 2, spit.vx, spit.vy, e.def.type === 'snowman' ? 'snow' : 'coffee', spit.gravity);
      e.render();
    }
  }

  private renderEnemyArt(): void {
    for (const e of this.enemies) e.render();
    this.projectiles.renderAll();
  }

  /** 鏡頭到關主區就開戰;之後每格依關主種類控制。 */
  private updateBoss(dtMs: number, time: number): void {
    const def = this.level.boss;
    if (def && !this.bossTriggered && this.scrollX >= def.lockScrollX) this.startBoss(def.type, def.lockScrollX, def.spawnX);
    const boss = this.boss;
    if (!boss) return;
    for (const m of [...boss.minions]) if (!this.enemies.includes(m)) boss.minions.delete(m);
    const ai = boss.ai;
    if (ai.kind === 'owl') this.updateOwl(boss, ai, dtMs, time);
    else if (ai.kind === 'sphinx') this.updateSphinx(boss, ai, dtMs);
    else if (ai.kind === 'eel') this.updateEel(boss, ai, dtMs);
    else if (ai.kind === 'nessie') this.updateNessie(boss, ai, dtMs, time);
    else if (ai.kind === 'yeti') this.updateYeti(boss, ai, dtMs);
    else {
      if (ai.kind === 'camel') this.updateCamel(boss, ai, dtMs);
      else if (ai.kind === 'fennec') this.updateFennec(boss, ai, dtMs);
      else if (ai.kind === 'crab') this.updateCrab(boss, ai, dtMs);
      else if (ai.kind === 'squirrel') this.updateSquirrel(boss, ai, dtMs);
      else if (ai.kind === 'bear') this.updateBear(boss, ai, dtMs);
      else if (ai.kind === 'hippo') this.updateHippo(boss, ai, dtMs);
      else if (ai.kind === 'snail') this.updateSnail(boss, ai, dtMs);
      else if (ai.kind === 'dragon') this.updateDragon(boss, ai, dtMs);
      else if (ai.kind === 'sloth') this.updateSloth(boss, ai, dtMs);
      else if (ai.kind === 'jaguar') this.updateJaguar(boss, ai, dtMs);
      else if (ai.kind === 'giraffe') this.updateGiraffe(boss, ai, dtMs);
      else if (ai.kind === 'elephant') this.updateElephant(boss, ai, dtMs);
      else if (ai.kind === 'lion') this.updateLion(boss, ai, dtMs);
      else if (ai.kind === 'goat') this.updateGoat(boss, ai, dtMs);
      else if (ai.kind === 'panda') this.updatePanda(boss, ai, dtMs);
      else if (ai.kind === 'thunderbird') this.updateThunder(boss, ai, dtMs);
      else if (ai.kind === 'queen') this.updateQueen(boss, ai, dtMs);
      else if (ai.kind === 'axolotl') this.updateAxolotl(boss, ai, dtMs);
      else if (ai.kind === 'rabbit') this.updateRabbit(boss, ai, dtMs);
      else if (ai.kind === 'peacock') this.updatePeacock(boss, ai, dtMs);
      else if (ai.kind === 'tapir') this.updateTapir(boss, ai, dtMs);
      else this.updateBeaver(boss, ai, dtMs);
      this.keepInArena(boss.enemy);
    }
    this.renderBossBar();
  }

  private nearestAwake(x: number): PlayerEntity | null {
    return this.players
      .filter((p) => !p.health.down)
      .reduce<PlayerEntity | null>((best, p) => (best === null || Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), null);
  }

  private updateOwl(boss: Boss, ai: Extract<BossAi, { kind: 'owl' }>, dtMs: number, time: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const step = stepOwl(ai.brain, {
      x: enemy.body.x,
      y: enemy.body.y,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      arenaLeft: lock + BOSS_ARENA_INSET,
      arenaRight: lock + VIEW_W - BOSS_ARENA_INSET,
      timeMs: time,
      dtMs,
      minionsAlive: boss.minions.size,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('nightOwl', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    enemy.physicsBody().setVelocity(step.vx, step.vy);
    const bottom = enemy.body.y + enemy.def.h / 2;
    for (const f of step.feathers) this.shots.fire(enemy.body.x, bottom, f.vx, f.vy);
    for (const side of step.summon) boss.minions.add(this.spawnFrom({ type: 'alarmBug', from: side, delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 人面獅身:趴在原地,輪流沙磚雨、拍出沙浪、吐沙球;第二階段起叫木乃伊貓。 */
  private updateSphinx(boss: Boss, ai: Extract<BossAi, { kind: 'sphinx' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const front = enemy.x - enemy.def.w / 2;
    const mouthX = front + 20;
    const mouthY = enemy.body.y - enemy.def.h / 2 + 30;
    const step = stepSphinx(ai.brain, {
      mouthX,
      mouthY,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 20 : null,
      dropLeft: lock + SCREEN_MARGIN + 30,
      dropRight: front - 40,
      minionsAlive: boss.minions.size,
      dtMs,
      rand: Math.random,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('sphinx', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    enemy.physicsBody().setVelocityX(step.vx);
    for (const x of step.blocks) this.desert.dropBlock(x);
    for (const delay of step.waves) this.desert.sendWave(front, -1, delay);
    for (const b of step.balls) this.shots.fire(mouthX, mouthY, b.vx, b.vy, 'sand');
    if (step.blocks.length + step.waves.length + step.balls.length > 0) audio.sfx('bossPhase');
    if (step.summon) boss.minions.add(this.spawnFrom({ type: 'mummyCat', from: 'left', delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 失眠駱駝:走一走,頭上冒「!」後吐口水或踢沙浪。 */
  private updateCamel(boss: Boss, ai: Extract<BossAi, { kind: 'camel' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const step = stepCamel(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 20 : null,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    const mouthX = enemy.x + step.brain.facing * (enemy.def.w / 2);
    const mouthY = GROUND_Y - enemy.def.h + 16;
    for (const sp of step.spits) this.shots.fire(mouthX, mouthY, sp.vx, sp.vy, 'spit', SPIT_GRAVITY);
    if (step.wave) {
      this.desert.sendWave(enemy.x + step.wave * (enemy.def.w / 2), step.wave);
      audio.sfx('bossPhase');
    }
  }

  /** 熬夜耳廓狐:鑽進沙裡(打不到也碰不到)→ 玩家腳下冒沙堆 → 跳出來 → 頭暈可以打。 */
  private updateFennec(boss: Boss, ai: Extract<BossAi, { kind: 'fennec' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const step = stepFennec(ai.brain, {
      x: enemy.x,
      grounded: pb.blocked.down || pb.touching.down,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      arenaLeft: lock + SCREEN_MARGIN,
      arenaRight: lock + VIEW_W - SCREEN_MARGIN,
      halfW: enemy.def.w / 2,
      alwaysThrow: enemy.def.type === 'mole',
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    const icy = enemy.def.type === 'narwhal';
    const mole = enemy.def.type === 'mole';
    if (mole) this.updateMolePhase(boss, ai, was !== 'burrow' && step.brain.mode === 'burrow');
    if (step.teleportX !== null) pb.reset(step.teleportX, enemy.body.y);
    if (was !== 'burrow' && step.brain.mode === 'burrow') this.puffAt(enemy.x, icy);
    enemy.emerging = step.hidden;
    enemy.body.setAlpha(step.hidden ? 0 : 1);
    pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (step.brain.mode === 'under' && !ai.mound) {
      // 耳廓狐冒出沙堆;獨角鯨是冰面的裂痕。
      // 巨鼴鼠是一大堆深色的土。
      const w = mole ? enemy.def.w * MOLE_MOUND_RATIO : MOUND_W;
      ai.mound = this.add.ellipse(step.brain.moundX, GROUND_Y - MOUND_H / 4, w, MOUND_H, icy ? 0xd8f0ff : mole ? MOLE_DIRT : COLOR.dirt).setDepth(3);
      if (icy) ai.mound.setStrokeStyle(2, 0x6fa8d8);
      this.tweens.add({ targets: ai.mound, scaleX: 1.15, duration: 90, yoyo: true, repeat: -1 });
    }
    if (step.brain.mode !== 'under' && ai.mound) {
      ai.mound.destroy();
      ai.mound = null;
      this.puffAt(enemy.x, icy);
    }
    for (const c of step.clumps) this.shots.fire(enemy.x, enemy.body.y - 10, c.vx, c.vy, icy ? 'ice' : mole ? 'stone' : 'sand', SPIT_GRAVITY);
  }

  /** 巨鼴鼠:依血量換階段(換圖、跳出「越來越暴躁」);第二階段起每次鑽進地底叫一隻咖啡蚯蚓。 */
  private updateMolePhase(boss: Boss, ai: Extract<BossAi, { kind: 'fennec' }>, burrowed: boolean): void {
    const { enemy } = boss;
    const phase = owlPhase(enemy.hp / boss.maxHp);
    if (phase > ai.phase) {
      ai.phase = phase;
      this.announcePhase(boss);
    }
    enemy.setArt(enemySprite('mole', 'awake', ai.phase));
    enemy.bossPhase = ai.phase;
    if (burrowed && ai.phase >= 2 && boss.minions.size < MOLE_MAX_WORMS) {
      // 從左邊來:從右邊會被夾在畫面右緣,直接冒在躲到右邊的玩家身上。
      boss.minions.add(this.spawnFrom({ type: 'coffeeWorm', from: 'left', delayMs: 0 }, false));
    }
  }

  /** 熬夜螢火蟲女王:在半空中飄,叫會發光的小螢火蟲、射光點、燈泡一閃讓四周很黑一下。 */
  private updateQueen(boss: Boss, ai: Extract<BossAi, { kind: 'queen' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const fireflies = [...boss.minions].filter((m) => m.def.type === 'firefly').length;
    const step = stepQueen(ai.brain, {
      x: enemy.x,
      y: enemy.body.y,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      halfW: enemy.def.w / 2,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      firefliesAlive: fireflies,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: 'hover' };
    enemy.physicsBody().setVelocity(step.vx, step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (let i = 0; i < step.summon; i++) {
      boss.minions.add(this.spawnEnemy('firefly', enemy.x + (i - (step.summon - 1) / 2) * 40, enemy.body.y + 30));
    }
    for (const sp of step.sparks) this.shots.fire(enemy.x, enemy.body.y, sp.vx, sp.vy, 'spark');
    if (step.flash) {
      // 燈泡一閃:整個畫面白一下,然後很黑一陣子。
      const flash = this.add.rectangle(VIEW_W / 2, WORLD_H / 2, VIEW_W, WORLD_H, 0xfff8d0, 0.8).setScrollFactor(0).setDepth(DARK_DEPTH + 1);
      this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
      this.blackoutMs = BLACKOUT_MS;
      audio.sfx('bossPhase');
    }
  }

  /** 失眠六角恐龍:慢慢游、吐慢慢飄的水泡;3 秒沒被打就慢慢回血。 */
  private updateAxolotl(boss: Boss, ai: Extract<BossAi, { kind: 'axolotl' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const was = ai.brain.mode;
    const mouthX = enemy.x + ai.brain.facing * (enemy.def.w / 2);
    const mouthY = enemy.body.y - enemy.def.h / 6;
    const step = stepAxolotl(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      mouthX,
      mouthY,
      hurt: enemy.hp < ai.lastHp,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'swim' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const b of step.bubbles) this.shots.fire(mouthX, mouthY, b.vx, b.vy, 'waterBubble', 0, BUBBLE_LIFE_MS);
    if (step.heal > 0 && enemy.hp > 0) {
      enemy.hp = Math.min(boss.maxHp, enemy.hp + step.heal);
      // 頭上冒出綠色的「+」,看得出來在回血。
      const plus = this.add
        .text(enemy.x, enemy.body.y - enemy.def.h / 2 - 6, '+', { fontSize: '26px', color: '#8fe08f', stroke: '#2a4a2a', strokeThickness: 5 })
        .setOrigin(0.5, 1)
        .setDepth(DARK_DEPTH + 1);
      this.tweens.add({ targets: plus, y: plus.y - 24, alpha: 0, duration: 500, onComplete: () => plus.destroy() });
    }
    ai.lastHp = enemy.hp;
  }

  /** 失眠月兔:木槌敲地往左右送出震波(跳過)、丟麻糬(黏到會變慢,不扣愛心)。 */
  private updateRabbit(boss: Boss, ai: Extract<BossAi, { kind: 'rabbit' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const was = ai.brain.mode;
    const handX = enemy.x + ai.brain.facing * (enemy.def.w / 2 - 10);
    const handY = enemy.body.y - enemy.def.h / 4;
    const step = stepRabbit(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      handX,
      handY,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const w of step.waves) this.desert.sendWave(enemy.x + w.dir * (enemy.def.w / 2), w.dir, w.delayMs, 'moon');
    if (step.waves.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
    for (const m of step.mochi) this.shots.fire(handX, handY, m.vx, m.vy, 'mochi', MOCHI_GRAVITY);
  }

  /** 熬夜孔雀:開屏讓玩家左右顛倒一陣子、射有高有低的羽毛飛鏢。 */
  private updatePeacock(boss: Boss, ai: Extract<BossAi, { kind: 'peacock' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const was = ai.brain.mode;
    const step = stepPeacock(ai.brain, { x: enemy.x, hpRatio: enemy.hp / boss.maxHp, targetX: nearest ? nearest.x : null, dtMs });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const d of step.darts) {
      this.later(boss, d.delayMs, () => this.shots.fire(enemy.x + d.dir * (enemy.def.w / 2), d.y, d.dir * DART_SPEED, 0, 'dart', 0, DART_LIFE_MS));
    }
    if (step.fan) {
      // 開屏:尾羽一圈光散開,畫面閃一下。
      this.reverseMs = REVERSE_MS;
      audio.sfx('bossPhase');
      const glow = this.add.ellipse(enemy.x, enemy.body.y, enemy.def.w * 1.6, enemy.def.h * 1.3, 0x3ab0a0, 0.55).setDepth(2);
      this.tweens.add({ targets: glow, scale: 2.2, alpha: 0, duration: 600, onComplete: () => glow.destroy() });
      const flash = this.add.rectangle(VIEW_W / 2, WORLD_H / 2, VIEW_W, WORLD_H, 0x7ae0d0, 0.35).setScrollFactor(0).setDepth(9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    }
  }

  /** 偷走睡意的夢貘(最終魔王):吐惡夢雲、用鼻子把玩家吸過去、叫手下;三個階段越來越大。 */
  private updateTapir(boss: Boss, ai: Extract<BossAi, { kind: 'tapir' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const was = ai.brain.mode;
    const step = stepTapir(ai.brain, { hpRatio: enemy.hp / boss.maxHp, targetX: nearest ? nearest.x : null, minionsAlive: boss.minions.size, dtMs });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('tapir', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    enemy.artScaleMul = TAPIR_SCALE[ai.brain.phase];
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    const facing: 1 | -1 = nearest && nearest.x > enemy.x ? 1 : -1;
    enemy.brain = { ...enemy.brain, facing, phase: 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    // 圖放大了,嘴巴也跟著往外。
    const half = (enemy.def.w / 2) * enemy.artScaleMul;
    for (const m of step.mist) {
      this.later(boss, m.delayMs, () => {
        const dir: 1 | -1 = enemy.brain.facing;
        this.shots.fire(enemy.x + dir * half, m.y, dir * MIST_SPEED, 0, 'mist', 0, MIST_LIFE_MS);
      });
    }
    if (!this.inhaling && step.inhaling) audio.sfx('bossPhase');
    this.inhaling = step.inhaling;
    // 手下從夢貘背後(右邊)出來,不擋在玩家逃開吸氣的方向。
    for (const type of step.summon) boss.minions.add(this.spawnFrom({ type, from: 'right', delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 失眠寄居蟹:走一走,輪流縮進殼裡滑過來(打不動)與吐慢慢飄的泡泡。 */
  private updateCrab(boss: Boss, ai: Extract<BossAi, { kind: 'crab' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const mouthY = enemy.body.y - enemy.def.h / 4;
    const step = stepCrab(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      mouthY,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    ai.armored = step.armored;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== step.brain.mode && (step.brain.mode === 'windup' || step.brain.mode === 'shell')) this.tell(enemy);
    // 用 baseTint:被打閃白光後也會恢復成殼的顏色。
    const art = enemy.artImage();
    if (art && was !== step.brain.mode) {
      enemy.baseTint = step.armored ? SHELL_TINT : undefined;
      if (step.armored) art.setTint(SHELL_TINT);
      else art.clearTint();
    }
    for (const b of step.bubbles) this.shots.fire(enemy.x + step.brain.facing * (enemy.def.w / 2), mouthY, b.vx, b.vy, 'bubble');
  }

  /** 熬夜電鰻:來回游;預告時身體閃爍、畫面出現細線,然後沿著細線放電。 */
  private updateEel(boss: Boss, ai: Extract<BossAi, { kind: 'eel' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const step = stepEel(ai.brain, {
      x: enemy.x,
      y: enemy.body.y,
      hpRatio: enemy.hp / boss.maxHp,
      targetY: nearest ? nearest.feetY - 24 : null,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing };
    enemy.physicsBody().setVelocity(step.vx, step.vy);
    if (was !== 'charge' && step.brain.mode === 'charge') this.tell(enemy);
    if (was !== 'zap' && step.brain.mode === 'zap') {
      audio.sfx('bossPhase');
      this.cameras.main.shake(150, 0.004);
    }
    // 預告時身體一閃一閃(render 會把 body 的透明度套到圖上)。
    enemy.body.setAlpha(step.brain.mode === 'charge' && Math.floor(this.time.now / 90) % 2 === 0 ? 0.4 : 1);
    this.drawBeams(lock, step.warn, step.zap);
    for (const y of step.zap) {
      for (const p of this.players) {
        const b = p.body();
        if (!p.health.down && b.bottom > y - BEAM_HALF_H && b.top < y + BEAM_HALF_H) this.hurtPlayer(p, false);
      }
    }
  }

  private drawBeams(lock: number, warn: readonly number[], zap: readonly number[]): void {
    const g = this.beamGfx.clear();
    for (const y of warn) {
      const a = Math.floor(this.time.now / 100) % 2 === 0 ? 0.9 : 0.4;
      g.fillStyle(BEAM_WARN, a).fillRect(lock, y - 1, VIEW_W, 2);
    }
    const art = this.textures.exists('b-electric-beam');
    zap.forEach((y, i) => {
      if (art) {
        // 電流圖 16 高:縱向拉長成判定的高度,不上下重複。
        this.beamTiles[i] ??= this.add
          .tileSprite(0, 0, VIEW_W, BEAM_HALF_H * 2, 'b-electric-beam')
          .setOrigin(0, 0.5)
          .setTileScale(1, (BEAM_HALF_H * 2) / this.textures.get('b-electric-beam').getSourceImage().height)
          .setDepth(4);
        // 電流圖往前流動。
        this.beamTiles[i].setPosition(lock, y).setVisible(true).tilePositionX = this.time.now / 4;
        return;
      }
      g.fillStyle(0x3a2a5a, 0.8).fillRect(lock, y - BEAM_HALF_H - 2, VIEW_W, BEAM_HALF_H * 2 + 4);
      g.fillStyle(BEAM_ZAP).fillRect(lock, y - BEAM_HALF_H, VIEW_W, BEAM_HALF_H * 2);
      g.fillStyle(0xffffff).fillRect(lock, y - 3, VIEW_W, 6);
    });
    this.beamTiles.forEach((t, i) => t.setVisible(i < zap.length));
  }

  /** 尼斯湖水怪:上下漂,輪流衝撞、泡泡扇、叫小丑魚;第三階段身體帶紅色。 */
  private updateNessie(boss: Boss, ai: Extract<BossAi, { kind: 'nessie' }>, dtMs: number, time: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const mouthX = enemy.x - enemy.def.w / 2 + 20;
    const mouthY = enemy.body.y - enemy.def.h / 2 + 30;
    const step = stepNessie(ai.brain, {
      x: enemy.x,
      y: enemy.body.y,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      homeX: lock + VIEW_W - NESSIE_HOME_INSET,
      homeY: NESSIE_HOME_Y,
      leftX: lock + NESSIE_LEFT_INSET,
      mouthX,
      mouthY,
      minionsAlive: boss.minions.size,
      timeMs: time,
      dtMs,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('nessie', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    if (ai.brain.phase === 3) enemy.baseTint = NESSIE_RAGE_TINT;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    enemy.brain = { ...enemy.brain, facing: step.brain.mode === 'return' ? 1 : -1 };
    enemy.physicsBody().setVelocity(step.vx, step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    if (was !== 'charge' && step.brain.mode === 'charge') audio.sfx('bossPhase');
    for (const b of step.bubbles) this.shots.fire(mouthX, mouthY, b.vx, b.vy, 'bubble');
    if (step.summon) {
      for (const y of SCHOOL_YS) boss.minions.add(this.spawnFrom({ type: 'clownfish', from: 'left', y, delayMs: 0 }, false));
    }
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 失眠北極熊:肚子貼地滑過來、拍地讓上面掉冰柱。 */
  private updateBear(boss: Boss, ai: Extract<BossAi, { kind: 'bear' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const step = stepBear(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.brain.mode === 'slide' ? 'dash' : step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== step.brain.mode && (step.brain.mode === 'windup' || step.brain.mode === 'slide')) this.tell(enemy);
    for (const x of step.icicles) this.desert.dropBlock(x, 'icicle');
    if (step.icicles.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(200, 0.006);
    }
  }

  /**
   * 失眠雪怪:丟雪球、跺腳掉冰柱、跳過來落地震出雪浪;第二階段起叫企鵝。
   * 吵鬧大猩猩同一套:丟芒果、捶胸讓芒果掉下來、跳過來落地送出震波;第二階段起叫鸚鵡。
   */
  private updateYeti(boss: Boss, ai: Extract<BossAi, { kind: 'yeti' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const handX = enemy.x - enemy.def.w / 2 + 10;
    const handY = enemy.body.y - enemy.def.h / 4;
    const step = stepYeti(ai.brain, {
      x: enemy.x,
      grounded: pb.blocked.down || pb.touching.down,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      homeX: lock + VIEW_W - YETI_HOME_INSET,
      handX,
      handY,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      minionsAlive: boss.minions.size,
      halfW: enemy.def.w / 2,
      dtMs,
    });
    const gorilla = enemy.def.type === 'gorilla';
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite(enemy.def.type, 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    enemy.brain = { ...enemy.brain, facing: pb.velocity.x > 50 ? 1 : -1, phase: step.brain.mode === 'leap' ? 'hop' : 'idle' };
    if (step.vx !== null) pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const b of step.snowballs) this.shots.fire(handX, handY, b.vx, b.vy, gorilla ? 'mango' : 'snow', SNOWBALL_GRAVITY);
    for (const x of step.icicles) this.desert.dropBlock(x, gorilla ? 'mango' : 'icicle');
    for (const dir of step.waves) this.desert.sendWave(enemy.x + dir * (enemy.def.w / 2), dir, 0, gorilla ? 'shock' : 'snow');
    if (step.icicles.length + step.waves.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
    if (step.summon) boss.minions.add(this.spawnFrom({ type: gorilla ? 'parrot' : 'penguin', from: 'left', delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 失眠長頸鹿:脖子橫掃(高的站著、低的跳過),玩家靠太近就用後腿蹬一下。 */
  private updateGiraffe(boss: Boss, ai: Extract<BossAi, { kind: 'giraffe' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const was = ai.brain.mode;
    const step = stepGiraffe(ai.brain, { x: enemy.x, hpRatio: enemy.hp / boss.maxHp, targetX: nearest ? nearest.x : null, dtMs });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const sw of step.sweeps) {
      this.later(boss, sw.delayMs, () => this.shots.fire(enemy.x + sw.dir * (enemy.def.w / 2), sw.y, sw.dir * SWEEP_SPEED, 0, 'sweep'));
    }
  }

  /** 熬夜大象:鼻子噴一串水柱(蹲下躲)、跺腳送出震波(跳過)。 */
  private updateElephant(boss: Boss, ai: Extract<BossAi, { kind: 'elephant' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const was = ai.brain.mode;
    const step = stepElephant(ai.brain, { x: enemy.x, hpRatio: enemy.hp / boss.maxHp, targetX: nearest ? nearest.x : null, dtMs });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    if (step.jet !== null) this.shots.fire(enemy.x + step.jet * (enemy.def.w / 2), JET_Y, step.jet * JET_SPEED, 0, 'jet');
    for (const w of step.waves) this.desert.sendWave(enemy.x + w.dir * (enemy.def.w / 2), w.dir, w.delayMs, 'stomp');
    if (step.waves.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
  }

  /** 失眠獅子王:獅吼(音波有高有低)、撲過來落地送出震波、叫角馬群從背後衝過來;第二階段起叫疣豬。 */
  private updateLion(boss: Boss, ai: Extract<BossAi, { kind: 'lion' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const step = stepLion(ai.brain, {
      x: enemy.x,
      grounded: pb.blocked.down || pb.touching.down,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      homeX: lock + VIEW_W - LION_HOME_INSET,
      halfW: enemy.def.w / 2,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      minionsAlive: boss.minions.size,
      dtMs,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('lion', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    const facing: 1 | -1 = nearest && nearest.x > enemy.x ? 1 : -1;
    enemy.brain = { ...enemy.brain, facing, phase: step.brain.mode === 'leap' ? 'hop' : step.brain.mode === 'return' ? 'walk' : 'idle' };
    if (step.vx !== null) pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    const mouthX = enemy.x + facing * (enemy.def.w / 2 - 10);
    for (const r of step.roars) this.shots.fire(mouthX, r.y, facing * r.speed, 0, 'roar', 0, ROAR_LIFE_MS);
    if (step.roars.length > 0) this.cameras.main.shake(300, 0.005);
    for (const dir of step.waves) this.desert.sendWave(enemy.x + dir * (enemy.def.w / 2), dir, 0, 'stomp');
    if (step.waves.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
    // 角馬群從玩家背後(左邊)衝過來。
    if (step.stampede) this.warnHerd(1, true);
    if (step.summon) boss.minions.add(this.spawnFrom({ type: 'warthog', from: 'left', delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 熬夜山羊:低頭衝撞到山壁(頭暈,山上滾下石頭)、踢石頭過來。 */
  private updateGoat(boss: Boss, ai: Extract<BossAi, { kind: 'goat' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const footX = enemy.x + ai.brain.facing * (enemy.def.w / 2);
    const footY = enemy.body.y + enemy.def.h / 2 - 20;
    const step = stepGoat(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      footX,
      footY,
      halfW: enemy.def.w / 2,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    const mode = step.brain.mode;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: mode === 'charge' ? 'dash' : step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && mode === 'windup') this.tell(enemy);
    for (const k of step.kicks) this.shots.fire(footX, footY, k.vx, k.vy, 'rock', ROCK_GRAVITY);
    if (was === 'charge' && mode === 'dizzy') {
      this.puffAt(enemy.x + ai.brain.facing * (enemy.def.w / 2));
      audio.sfx('bossPhase');
      this.cameras.main.shake(300, 0.01);
      for (const x of step.rocks) this.desert.dropBlock(x, 'boulder');
    }
  }

  /** 失眠熊貓:縮成一團滾過來(站到雲朵平台上躲)、丟迴旋竹子(蹲下躲)。 */
  private updatePanda(boss: Boss, ai: Extract<BossAi, { kind: 'panda' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const step = stepPanda(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      halfW: enemy.def.w / 2,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    const mode = step.brain.mode;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: mode === 'roll' ? 'roll' : step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && mode === 'windup') this.tell(enemy);
    for (const bb of step.bamboos) {
      this.later(boss, bb.delayMs, () =>
        this.shots.fire(enemy.x + bb.dir * (enemy.def.w / 2), BAMBOO_Y, bb.dir * BAMBOO_VX, 0, 'bamboo', 0, BAMBOO_LIFE_MS, -bb.dir * BAMBOO_AX),
      );
    }
  }

  /** 熬夜雷鳥:飛在上面,召喚落雷、颳強風把玩家往後推、射羽毛;第二階段起叫老鷹。 */
  private updateThunder(boss: Boss, ai: Extract<BossAi, { kind: 'thunderbird' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const step = stepThunder(ai.brain, {
      x: enemy.x,
      y: enemy.body.y,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      halfW: enemy.def.w / 2,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      minionsAlive: boss.minions.size,
      dtMs,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('thunderbird', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    const facing: 1 | -1 = nearest && nearest.x > enemy.x ? 1 : -1;
    enemy.brain = { ...enemy.brain, facing, phase: 'hover' };
    pb.setVelocity(step.vx, step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    if (!this.bossGust && step.gusting) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(THUNDER_GUST_SHAKE_MS, 0.004);
    }
    this.bossGust = step.gusting;
    for (const x of step.bolts) this.desert.dropBlock(x, 'lightning');
    if (step.bolts.length > 0) audio.sfx('bossPhase');
    for (const f of step.feathers) this.shots.fire(enemy.x, enemy.body.y, f.vx, f.vy, 'feather');
    // 老鷹從右邊來(颳強風時玩家被推到左邊,從左邊來會躲不掉)。
    if (step.summon) boss.minions.add(this.spawnFrom({ type: 'eagle', from: 'right', delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 關主晚一點才出的招:到時候關主已經被打倒(或換了)就不出。 */
  private later(boss: Boss, delayMs: number, fn: () => void): void {
    if (delayMs <= 0) {
      fn();
      return;
    }
    this.time.delayedCall(delayMs, () => {
      if (this.boss === boss && !this.bossDefeated) fn();
    });
  }

  /** 失眠樹懶:慢慢爬,搖樹讓芒果掉下來、丟芒果;靠太近用爪子往前掃。 */
  private updateSloth(boss: Boss, ai: Extract<BossAi, { kind: 'sloth' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const handX = enemy.x + ai.brain.facing * (enemy.def.w / 2);
    const handY = enemy.body.y - enemy.def.h / 4;
    const step = stepSloth(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      handX,
      handY,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const b of step.throws) this.shots.fire(handX, handY, b.vx, b.vy, 'mango', MANGO_GRAVITY);
    for (const x of step.drops) this.desert.dropBlock(x, 'mango');
    if (step.drops.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(200, 0.005);
    }
  }

  /** 熬夜美洲豹:衝過來,或跳上樹躲起來、玩家腳下出現影子後撲下來,落地頭暈。 */
  private updateJaguar(boss: Boss, ai: Extract<BossAi, { kind: 'jaguar' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const step = stepJaguar(ai.brain, {
      x: enemy.x,
      y: enemy.body.y,
      grounded: pb.blocked.down || pb.touching.down,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      halfW: enemy.def.w / 2,
      dtMs,
    });
    ai.brain = step.brain;
    const mode = step.brain.mode;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: mode === 'dash' || mode === 'prowl' ? 'walk' : mode === 'leap' || mode === 'drop' ? 'hop' : 'idle' };
    if (step.teleport) pb.reset(step.teleport.x, step.teleport.y);
    enemy.emerging = step.hidden;
    enemy.body.setAlpha(step.hidden ? 0 : 1);
    if (step.vx !== null) pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (was !== 'windup' && mode === 'windup') this.tell(enemy);
    if (step.shadowX !== null && !ai.shadow) {
      ai.shadow = this.add.ellipse(step.shadowX, GROUND_Y - 2, enemy.def.w, 16, 0x2a2040, 0.5).setDepth(3);
      this.tweens.add({ targets: ai.shadow, scaleX: 1.15, duration: 120, yoyo: true, repeat: -1 });
    }
    if (step.shadowX === null && ai.shadow) {
      ai.shadow.destroy();
      ai.shadow = null;
    }
    if (was === 'drop' && mode === 'dizzy') {
      this.puffAt(enemy.x);
      audio.sfx('bossPhase');
      this.cameras.main.shake(200, 0.006);
    }
  }

  /** 失眠溫泉河馬:泡在溫泉裡不走動,噴蒸氣(畫面冒白霧)、跳起來砸地送出震波。 */
  private updateHippo(boss: Boss, ai: Extract<BossAi, { kind: 'hippo' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const step = stepHippo(ai.brain, {
      grounded: pb.blocked.down || pb.touching.down,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      dtMs,
    });
    ai.brain = step.brain;
    const facing: 1 | -1 = nearest && nearest.x > enemy.x ? 1 : -1;
    enemy.brain = { ...enemy.brain, facing, phase: step.brain.mode === 'hop' ? 'hop' : 'idle' };
    pb.setVelocityX(0);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    const mouthX = enemy.x + facing * (enemy.def.w / 2);
    for (const c of step.steam) this.shots.fire(mouthX, c.y, facing * c.speed, 0, 'steam', 0, STEAM_LIFE_MS);
    if (step.steam.length > 0) this.steamFog();
    for (const w of step.waves) this.desert.sendWave(enemy.x + w.dir * (enemy.def.w / 2), w.dir, w.delayMs, 'shock');
    if (step.waves.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
  }

  /** 噴蒸氣時整個畫面冒白霧,一下子看不清楚。 */
  private steamFog(): void {
    const fog = this.add.rectangle(VIEW_W / 2, WORLD_H / 2, VIEW_W, WORLD_H, 0xffffff, 0).setScrollFactor(0).setDepth(6);
    this.tweens.add({
      targets: fog,
      fillAlpha: { from: 0, to: STEAM_FOG_ALPHA },
      duration: 300,
      hold: 500,
      yoyo: true,
      onComplete: () => fog.destroy(),
    });
  }

  /** 熬夜火山蝸牛:慢慢爬,殼上的火山噴出熔岩球,同時縮進殼裡(打不動)。 */
  private updateSnail(boss: Boss, ai: Extract<BossAi, { kind: 'snail' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    // 殼在身體後面(圖朝左,殼在右邊);熔岩球從殼頂噴出來。
    const ventX = enemy.x - ai.brain.facing * (enemy.def.w / 4);
    const ventY = enemy.body.y - enemy.def.h / 2;
    const step = stepSnail(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      ventX,
      ventY,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    ai.armored = step.armored;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== step.brain.mode && step.brain.mode === 'windup') this.tell(enemy);
    const art = enemy.artImage();
    if (art && was !== step.brain.mode) {
      enemy.baseTint = step.armored ? SHELL_TINT : undefined;
      if (step.armored) art.setTint(SHELL_TINT);
      else art.clearTint();
    }
    for (const b of step.lavaBalls) this.shots.fire(ventX, ventY, b.vx, b.vy, 'lava', LAVA_GRAVITY);
    if (step.lavaBalls.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(160, 0.004);
    }
  }

  /** 熬夜火龍:吐火球、火山噴發掉落石、噴火沿地面燒過來;第二階段起叫火蜥蜴。 */
  private updateDragon(boss: Boss, ai: Extract<BossAi, { kind: 'dragon' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const facing: 1 | -1 = nearest && nearest.x > enemy.x ? 1 : -1;
    const mouthX = enemy.x + facing * (enemy.def.w / 2 - 20);
    const mouthY = enemy.body.y - enemy.def.h / 3;
    const step = stepDragon(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      mouthX,
      mouthY,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      minionsAlive: boss.minions.size,
      dtMs,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('dragon', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    enemy.brain = { ...enemy.brain, facing, phase: 'idle' };
    pb.setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const b of step.fireballs) this.shots.fire(mouthX, mouthY, b.vx, b.vy, 'lava', FIREBALL_GRAVITY);
    for (const x of step.rocks) this.desert.dropBlock(x, 'rock');
    for (const f of step.flames) this.desert.sendWave(enemy.x + f.dir * (enemy.def.w / 2), f.dir, f.delayMs, 'fire');
    if (step.rocks.length + step.flames.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
    if (step.summon) boss.minions.add(this.spawnFrom({ type: 'salamander', from: 'left', delayMs: 0 }, false));
    if (step.enteredPhase) this.announcePhase(boss);
  }

  /** 失眠大松鼠:丟橡實 → 轉身用大尾巴當盾(打不動)→ 跳到另一個位置。 */
  private updateSquirrel(boss: Boss, ai: Extract<BossAi, { kind: 'squirrel' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const pb = enemy.physicsBody();
    const was = ai.brain.mode;
    const step = stepSquirrel(ai.brain, {
      x: enemy.x,
      grounded: pb.blocked.down || pb.touching.down,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      targetY: nearest ? nearest.feetY - 24 : null,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    ai.armored = step.armored;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.brain.mode === 'hop' ? 'hop' : 'idle' };
    if (step.vx !== null) pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (was !== 'shield' && step.brain.mode === 'shield') this.tell(enemy);
    const handX = enemy.x + step.brain.facing * (enemy.def.w / 2);
    const handY = GROUND_Y - enemy.def.h * 0.6;
    for (const a of step.acorns) this.shots.fire(handX, handY, a.vx, a.vy, 'acorn', ACORN_GRAVITY);
  }

  /** 熬夜大河狸:尾巴拍地送出水波、把木頭丟到玩家頭上(落地當踏板)。 */
  private updateBeaver(boss: Boss, ai: Extract<BossAi, { kind: 'beaver' }>, dtMs: number): void {
    const { enemy } = boss;
    const nearest = this.nearestAwake(enemy.x);
    const lock = this.bossLock ?? this.scrollX;
    const was = ai.brain.mode;
    const step = stepBeaver(ai.brain, {
      x: enemy.x,
      hpRatio: enemy.hp / boss.maxHp,
      targetX: nearest ? nearest.x : null,
      arenaLeft: lock,
      arenaRight: lock + VIEW_W,
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    enemy.physicsBody().setVelocityX(step.vx);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const w of step.waves) this.desert.sendWave(enemy.x + w.dir * (enemy.def.w / 2), w.dir, w.delayMs, 'water');
    for (const x of step.logs) this.desert.dropBlock(x, 'log');
    if (step.waves.length > 0) {
      audio.sfx('splash');
      this.cameras.main.shake(120, 0.004);
    }
  }

  /** 咖啡章魚會停住或退開:一律留在畫面裡,不會躲在畫面外讓戰鬥區清不完。 */
  private keepOnScreen(e: EnemyEntity): void {
    const half = e.def.w / 2;
    const x = Math.min(Math.max(e.body.x, this.scrollX + half), this.scrollX + VIEW_W - half);
    if (x !== e.body.x) e.physicsBody().reset(x, e.body.y);
  }

  /** 走路的小頭目不能走出鎖住的畫面。 */
  private keepInArena(e: EnemyEntity): void {
    const lock = this.bossLock ?? this.scrollX;
    const half = e.def.w / 2;
    const x = Math.min(Math.max(e.body.x, lock + half), lock + VIEW_W - half);
    if (x !== e.body.x) e.physicsBody().reset(x, e.body.y);
  }

  /** 換階段發抖時染紅,結束後恢復。 */
  private angryTint(boss: Boss, angry: boolean, entered: 2 | 3 | null): void {
    const art = boss.enemy.artImage();
    if (art && angry) art.setTint(COLOR.angry).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (art && entered === null && boss.wasAngry) {
      art.clearTint();
      if (boss.enemy.baseTint !== undefined) art.setTint(boss.enemy.baseTint);
    }
    boss.wasAngry = angry;
  }

  private announcePhase(boss: Boss): void {
    audio.sfx('bossPhase');
    const name = BOSS_SHORT_NAME[boss.enemy.def.type as BossType] ?? boss.enemy.def.name;
    this.bossPhaseText.setText(`${name}越來越暴躁了!`).setAlpha(1);
    this.tweens.add({ targets: this.bossPhaseText, alpha: 0, delay: BOSS_PHASE_TEXT_MS - 300, duration: 300 });
    this.cameras.main.shake(300, 0.008);
  }

  /** 小頭目出招前頭上冒一個「!」(畫在黑暗上面,洞窟裡也看得到)。 */
  private tell(e: EnemyEntity): void {
    // 圖放大時(夢貘)「!」也跟著畫在頭頂上。
    const top = e.body.y + e.def.h / 2 - e.def.h * e.artScaleMul;
    const mark = this.add
      .text(e.x, top - 12, '!', { fontSize: '30px', color: '#ffe08a', stroke: '#3a2a5a', strokeThickness: 5 })
      .setOrigin(0.5, 1)
      .setDepth(DARK_DEPTH + 1);
    this.tweens.add({ targets: mark, y: mark.y - 10, alpha: 0, delay: TELL_MS - 150, duration: 150, onComplete: () => mark.destroy() });
  }

  /** 鑽進、冒出地面時噴沙(icy:冰屑)。 */
  private puffAt(x: number, icy = false): void {
    for (let i = 0; i < 6; i++) {
      const d = this.add.circle(x + (i - 2.5) * 9, GROUND_Y - 4, 6, icy ? 0xe0f4ff : 0xe8c27a).setDepth(5);
      this.tweens.add({ targets: d, y: GROUND_Y - 28 - (i % 3) * 8, alpha: 0, duration: 420, onComplete: () => d.destroy() });
    }
  }

  private startBoss(type: BossType, lockScrollX: number, spawnX: number): void {
    audio.music('boss');
    audio.sfx('bossAppear');
    this.bossTriggered = true;
    this.bossLock = lockScrollX;
    // 路上跟過來的魔物一起睡著,關主戰從乾淨的場地開始(不算打倒)。
    for (const e of [...this.enemies]) {
      this.sleepAway(e, false);
      this.removeEnemy(e);
    }
    this.shots.clear();
    const flyingY: Partial<Record<BossType, number>> = { nightOwl: OWL_HOVER_Y, eel: 200, nessie: NESSIE_HOME_Y, thunderbird: THUNDER_HOVER_Y, queen: QUEEN_HOVER_Y };
    const enemy = this.spawnEnemy(type, spawnX, flyingY[type]);
    const maxHp = this.mode === 'duo' ? Math.round(enemy.def.hp * BOSS_DUO_HP_RATIO) : enemy.def.hp;
    enemy.hp = maxHp;
    this.boss = { enemy, ai: initialAi(type), maxHp, invulnerable: false, minions: new Set(), wasAngry: false };
    this.bossName.setText(enemy.def.name);
    this.bossBarBg.setVisible(true);
    this.bossBar.setVisible(true);
    this.renderBossBar();
  }

  private renderBossBar(): void {
    const boss = this.boss;
    if (!boss) return;
    this.bossBar.width = (BOSS_BAR_W * boss.enemy.hp) / boss.maxHp;
    this.bossBar.setFillStyle(aiPhase(boss.ai) === 3 ? 0xff5a6e : 0xffb3c7);
  }

  /** 膨脹的河豚、縮進殼裡的寄居蟹:子彈與揮擊全部彈開。 */
  private isArmored(e: EnemyEntity): boolean {
    if (e.def.type === 'puffer') return e.brain.phase === 'puff';
    const ai = this.boss?.enemy === e ? this.boss.ai : null;
    return (ai?.kind === 'crab' || ai?.kind === 'squirrel' || ai?.kind === 'snail') && ai.armored;
  }

  /** 換階段的關主、躲進地洞的狐獴:打不到。 */
  private isInvulnerable(e: EnemyEntity): boolean {
    if (e.burrowed) return true;
    return this.boss?.enemy === e && this.boss.invulnerable;
  }

  /** 扣血;打到 0 就打倒。 */
  private damageEnemy(enemy: EnemyEntity, amount: number, impactScale = 1): void {
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.flash();
    if (enemy.hp === 0) this.defeatEnemy(enemy, impactScale);
    else if (impactScale !== 1) this.impact(impactScale);
  }

  /** 可以被揮擊的對象:已上場的魔物與還站著的練習靶。 */
  private findMeleeTarget(reach: MeleeReach): EnemyEntity | Target | null {
    const pool: (EnemyEntity | Target)[] = [
      ...this.enemies.filter((e) => !e.emerging && e.hp > 0 && !this.isInvulnerable(e)),
      ...this.targets.filter((t) => t.hp > 0),
    ];
    const boxes: MeleeCandidate[] = pool.map((o) => {
      const r = o instanceof EnemyEntity ? o.body : o.rect;
      return { x: r.x, w: r.width, top: r.y - r.height / 2, bottom: r.y + r.height / 2 };
    });
    const i = meleeTarget(reach, boxes);
    return i === null ? null : pool[i];
  }

  private performMelee(reach: MeleeReach): void {
    const target = this.findMeleeTarget(reach);
    if (!target) return;
    this.meleeSwings += 1;
    const swing = this.add
      .ellipse(reach.x + reach.facing * (14 + MELEE_REACH / 2), reach.feetY - reach.h / 2, MELEE_REACH, reach.h, 0xffffff, 0.6)
      .setDepth(5);
    this.tweens.add({ targets: swing, alpha: 0, duration: SWING_MS, onComplete: () => swing.destroy() });

    if (target instanceof EnemyEntity) {
      if (this.blockedBy(target, reach.facing, 0, MELEE_DAMAGE)) return;
      this.meleeHits += 1;
      audio.sfx('melee');
      this.damageEnemy(target, MELEE_DAMAGE, MELEE_IMPACT_SCALE);
      if (target.def.type === 'puffer') target.brain = pufferHit(target.brain);
      return;
    }
    this.meleeHits += 1;
    target.hp = Math.max(0, target.hp - MELEE_DAMAGE);
    if (target.hp === 0) this.defeatTarget(target);
  }

  private enemyFor(obj: unknown): EnemyEntity | undefined {
    return this.enemies.find((e) => e.body === obj);
  }

  /**
   * 這一擊被擋下了嗎?被盾牌擋下時盾牌扣掉這一擊的傷害、噴碎屑,扣完就破盾(之後正面也打得到)。
   * 關主縮殼、河豚膨脹(armored)擋下的不會破。
   */
  private blockedBy(enemy: EnemyEntity, vx: number, vy: number, damage: number): boolean {
    const armored = this.isArmored(enemy);
    if (bulletEffect(enemy.def, enemy.brain.facing, vx, vy, armored, enemy.shieldUp) === 'hit') return false;
    this.blockedShots += 1;
    audio.sfx('blocked');
    if (armored || !enemy.shieldUp) return true;
    const r = wearShield(enemy.shieldHp, damage);
    enemy.shieldHp = r.shieldHp;
    const sx = enemy.x + enemy.brain.facing * (enemy.def.w / 2);
    this.shieldChips(sx, enemy.body.y, r.broke ? 8 : 2);
    if (r.broke) {
      enemy.breakShield();
      this.shieldsBroken += 1;
      audio.sfx('melee');
      const label = this.add
        .text(sx, enemy.body.y - enemy.def.h / 2 - 8, '破盾!', { fontSize: '22px', color: '#ffe08a', stroke: '#3a2a5a', strokeThickness: 5 })
        .setOrigin(0.5, 1)
        .setDepth(6);
      this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, delay: 500, duration: 300, onComplete: () => label.destroy() });
    }
    return true;
  }

  /** 盾牌被打到時噴出碎屑(破掉時噴比較多)。 */
  private shieldChips(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const d = this.add.circle(x, y, 3 + (i % 2), 0xc8c0d0).setDepth(5);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * 26, y: y + Math.sin(a) * 26 - 8, alpha: 0, duration: 320, onComplete: () => d.destroy() });
    }
  }

  /** 子彈命中:刺盾擋下、扣血、打倒;正在冒出的魔物與已倒下的靶不算。 */
  private onProjectileHit(obj: Phaser.GameObjects.GameObject, hit: ProjectileHit): HitResult {
    const enemy = this.enemyFor(obj);
    if (enemy) {
      if (enemy.emerging || enemy.hp <= 0 || this.isInvulnerable(enemy)) return 'ignored';
      if (this.blockedBy(enemy, hit.vx, hit.vy, hit.damage)) return 'blocked';
      audio.sfx('hit');
      this.damageEnemy(enemy, hit.damage);
      if (enemy.def.type === 'puffer') enemy.brain = pufferHit(enemy.brain);
      return 'consumed';
    }
    const target = this.targets.find((t) => t.rect === obj);
    if (!target || target.hp <= 0) return 'ignored';
    this.hitTarget(target, hit.damage);
    return 'consumed';
  }

  private defeatEnemy(enemy: EnemyEntity, impactScale = 1): void {
    if (enemy === this.boss?.enemy) {
      this.defeatBoss(this.boss);
      return;
    }
    this.enemiesDefeated += 1;
    audio.sfx('sleep');
    this.playDefeatEffect(enemy.body.x, enemy.body.y, impactScale);
    this.sleepAway(enemy, false);
    const drop = this.riggedDrop ?? rollDrop(Math.random);
    this.riggedDrop = null;
    if (drop) this.dropItem(drop, enemy.body.x, enemy.body.y);
    this.removeEnemy(enemy);
  }

  /** 貓頭鷹睡著:加重的效果,場上魔物與羽毛一起消失,稍後進入結算。 */
  private defeatBoss(boss: Boss): void {
    this.enemiesDefeated += 1;
    this.bossDefeated = true;
    this.boss = null;
    // 撲下來時被打倒:地上的影子(耳廓狐的沙堆)一起收掉。
    if (boss.ai.kind === 'jaguar') boss.ai.shadow?.destroy();
    if (boss.ai.kind === 'fennec') boss.ai.mound?.destroy();
    this.clearHerds();
    this.bossGust = false;
    this.inhaling = false;
    this.reverseMs = 0;
    this.reverseText.setVisible(false);
    this.slowMs.fill(0);
    audio.music(null);
    audio.sfx('bossDown');
    const { x, y } = boss.enemy.body;
    this.playDefeatEffect(x, y, BOSS_HIT_STOP_SCALE, BOSS_SHAKE_SCALE);
    this.floatZzz(x, y - 30, 3, ZZZ_MS * 2);
    this.sleepAway(boss.enemy, true);
    // 森林裡所有魔物一起睡著。
    for (const e of [...this.enemies]) {
      if (e !== boss.enemy) this.sleepAway(e, false);
      this.removeEnemy(e);
    }
    this.shots.clear();
    this.desert.clear();
    this.beamGfx.clear();
    for (const t of this.beamTiles) t.setVisible(false);
    if (boss.ai.kind === 'fennec') boss.ai.mound?.destroy();
    this.bossName.setText('');
    this.bossBarBg.setVisible(false);
    this.bossBar.setVisible(false);
    this.time.delayedCall(BOSS_OUTRO_MS, () => this.onLevelComplete());
  }

  private onLevelComplete(): void {
    const stats: RunStats = {
      ...this.stats,
      defeated: this.stats.defeated + this.enemiesDefeated,
      chestsFound: this.openedChestIndexes().length,
      restarts: this.restarts,
      ...(this.stars.length > 0 ? { starsFound: this.collectedStarIndexes().length, starsTotal: this.stars.length } : {}),
    };
    const endedAt = Date.now();
    if (isStoryLevel(this.level.id)) this.save.markCleared(this.level.id, endedAt - stats.startedAt);
    const data: LevelCompleteData = {
      ...sessionData(this.initData),
      mode: this.mode,
      level: this.level.id,
      levelName: `${levelNumber(this.level.id)} ${this.level.name}`,
      next: nextLevel(this.level.id),
      summary: summaryLines(stats, endedAt),
      // 打倒最終魔王夢貘就是破關,結算畫面變成結局。
      ending: this.level.boss?.type === 'tapir',
    };
    this.scene.start('LevelComplete', data);
  }

  private removeEnemy(enemy: EnemyEntity): void {
    this.enemies = this.enemies.filter((e) => e !== enemy);
    enemy.destroy();
  }

  /** 打倒時的回饋:Zzz 飄走、短暫停頓、輕微晃動。 */
  private playDefeatEffect(x: number, y: number, impactScale = 1, shakeScale = impactScale): void {
    this.floatZzz(x, y - 10, 1, ZZZ_MS);
    this.impact(impactScale, shakeScale);
  }

  /** Zzz 往上飄並淡出;有圖用圖,沒有用文字。 */
  private floatZzz(x: number, y: number, scale: number, duration: number): void {
    const zzz = this.textures.exists('zzz')
      ? this.add.image(x, y, 'zzz').setScale(scale)
      : this.add.text(x, y, 'Zzz', { fontSize: `${22 * scale}px`, color: '#f3e9d2' }).setOrigin(0.5);
    zzz.setDepth(6);
    this.tweens.add({ targets: zzz, y: y - 50 * scale, alpha: 0, duration, onComplete: () => zzz.destroy() });
  }

  /** 換成睡著的圖,往上飄走,放出小羊;stay 時(關主)留在原地直到進結算。沒有圖就什麼都不做。 */
  private sleepAway(enemy: EnemyEntity, stay: boolean): void {
    const art = enemy.artImage();
    const key = enemySprite(enemy.def.type, 'sleep');
    if (!art || !this.textures.exists(key)) return;
    const img = this.add
      .image(art.x, art.y, key)
      .setOrigin(art.originX, art.originY)
      .setTint(ENEMY_ART_TINT[enemy.def.type] ?? 0xffffff)
      .setScale(art.scaleX, art.scaleY)
      .setFlipX(art.flipX)
      .setDepth(art.depth);
    if (stay) {
      // 關主睡著留在原地:輕輕上下呼吸(睡著的圖沒有動畫格)。
      this.tweens.add({ targets: img, scaleY: img.scaleY * 1.04, scaleX: img.scaleX * 0.98, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return;
    }
    this.tweens.add({ targets: img, y: img.y - SLEEP_RISE, alpha: 0, delay: SLEEP_HOLD_MS, duration: SLEEP_FADE_MS, onComplete: () => img.destroy() });
    if (!this.textures.exists('dream-sheep')) return;
    const sheep = this.add.image(art.x, art.y - art.displayHeight, 'dream-sheep').setAlpha(0.85).setDepth(6);
    this.tweens.add({ targets: sheep, y: sheep.y - SHEEP_RISE, alpha: 0, duration: SHEEP_MS, onComplete: () => sheep.destroy() });
  }

  /** 打擊停頓與畫面晃動;scale 放大揮擊的份量感。 */
  private impact(scale: number, shakeScale = scale): void {
    const t = this.getTuning();
    if (t.hitStopMs > 0 && !this.physics.world.isPaused) {
      this.physics.world.pause();
      this.time.delayedCall(t.hitStopMs * scale, () => this.physics.world.resume());
    }
    if (t.shakeMs > 0) this.cameras.main.shake(t.shakeMs * shakeScale, t.shakeIntensity * shakeScale);
  }

  private hitTarget(target: Target, damage: number): void {
    const { rect, art } = target;
    this.targetsHit += 1;
    target.hp = Math.max(0, target.hp - damage);

    rect.setFillStyle(COLOR.flash);
    art?.setTint(COLOR.flash).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(FLASH_MS, () => {
      rect.setFillStyle(COLOR.target);
      art?.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    });
    this.tweens.add({ targets: art ?? rect, scaleX: 1.2, scaleY: 0.8, duration: FLASH_MS, yoyo: true });

    if (target.hp === 0) this.defeatTarget(target);
  }

  private defeatTarget(target: Target): void {
    const { rect, art } = target;
    rect.setVisible(false);
    art?.setVisible(false);
    (rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.playDefeatEffect(rect.x, rect.y);

    this.time.delayedCall(TARGET_RESPAWN_MS, () => {
      target.hp = TARGET_HP;
      rect.setVisible(!art).setScale(1).setFillStyle(COLOR.target);
      art?.setVisible(true).setScale(1);
      (rect.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    });
  }

  private publishDebug(): void {
    const players = this.players.map((p) => p.debug());
    window.__GK__ = {
      ready: true,
      screen: 'range',
      mode: this.mode,
      player: players[0],
      players,
      checkpointX: this.checkpointX,
      restarts: this.restarts,
      hurt: this.testHooks ? (i: number) => this.hurtPlayer(this.players[i], false) : undefined,
      giveWeapon: this.testHooks
        ? (i: number, id: SpecialWeaponId, stars?: number) => void (this.players[i].loadout = equip(id, stars ?? 1))
        : undefined,
      giveItem: this.testHooks ? (i: number, item: ItemId) => this.applyItemTo(this.players[i], item) : undefined,
      rigChest: this.testHooks ? (w: SpecialWeaponId) => void (this.riggedChest = w) : undefined,
      rigDrop: this.testHooks ? (item: ItemId) => void (this.riggedDrop = item) : undefined,
      clearSave: this.testHooks ? () => this.save.clear() : undefined,
      resetChests: this.testHooks
        ? () =>
            this.chests.forEach((c) => this.closeChest(c))
        : undefined,
      openedChests: this.openedChestIndexes(),
      backpack: this.save.get().weapons,
      chestsOpened: this.chestsOpened,
      lastChest: this.lastChest,
      items: this.pickups.length,
      spawn: this.testHooks ? (type: EnemyType, x: number, y?: number) => void this.spawnEnemy(type, x, y) : undefined,
      defeatAll: this.testHooks ? () => [...this.enemies].forEach((e) => this.defeatEnemy(e)) : undefined,
      warp: this.testHooks ? (x: number) => this.warp(x) : undefined,
      spawnGround: this.testHooks
        ? (type: EnemyType, x: number) => void this.spawnFrom({ type, from: 'ground', x, delayMs: 0 }, false)
        : undefined,
      arena: {
        locked: this.lockScrollX !== null,
        wave: this.encounters.active?.wave ?? 0,
        nextArena: this.encounters.nextArena,
      },
      enemies: this.enemies.map((e) => e.debug()),
      enemiesDefeated: this.enemiesDefeated,
      blockedShots: this.blockedShots,
      shieldsBroken: this.shieldsBroken,
      touch: this.touchControls !== null,
      level: this.level.id,
      meleeHits: this.meleeHits,
      meleeSwings: this.meleeSwings,
      bullets: this.projectiles.count(),
      targetsHit: this.targetsHit,
      cameraX: this.scrollX,
      sfx: { ...audio.counts },
      music: audio.currentTrack(),
      voices: audio.voicesStarted,
      musicSchedulers: audio.activeSchedulers,
      art: { loaded: artStatus.loaded, missing: [...artStatus.missing], disabled: artStatus.disabled },
      boss: this.boss
        ? {
            hp: this.boss.enemy.hp,
            maxHp: this.boss.maxHp,
            phase: aiPhase(this.boss.ai),
            mode: aiMode(this.boss.ai),
            type: this.boss.enemy.def.type,
            hidden: this.boss.enemy.emerging,
            armored: this.isArmored(this.boss.enemy),
            x: this.boss.enemy.x,
            y: this.boss.enemy.body.y,
          }
        : null,
      bossDefeated: this.bossDefeated,
      bossLockX: this.level.boss?.lockScrollX ?? null,
      riverFalls: this.riverFalls,
      volcano: { lavaBurns: this.lavaBurns, eruptions: this.eruption.count },
      vines: { grabs: this.vineGrabs, holding: [...this.holding] },
      stampede: { warnings: this.herdWarnings.length, herds: this.herdsReleased, beasts: this.beasts.length, hits: this.herdHits },
      wind: { strength: this.windNow(), gust: this.bossGust, pushes: this.windPushes },
      darkness: { alpha: this.darkAlpha, lights: this.lightCount, blackout: this.blackoutMs > 0 },
      w10: {
        stars: this.collectedStarIndexes().length,
        starsTotal: this.stars.length,
        reversed: this.reverseMs > 0,
        inhaling: this.inhaling,
        slowed: this.slowMs.map((ms) => ms > 0),
        mochiHits: this.mochiHits,
        pulls: this.pulls,
      },
      desert: this.desert.debug(),
      dropBlock: this.testHooks ? (x: number) => this.desert.dropBlock(x) : undefined,
      enemyShots: this.shots.count(),
      hurtBoss: this.testHooks
        ? (n: number) => {
            const e = this.boss?.enemy;
            if (e && e.hp > 0 && !this.isInvulnerable(e)) this.damageEnemy(e, n);
          }
        : undefined,
    };
  }
}
