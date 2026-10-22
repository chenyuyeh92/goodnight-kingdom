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
import { ENEMY_DEFS, SPIT_GRAVITY, bulletEffect, pufferHit, type EnemyType } from '../game/enemies';
import { EnemyEntity } from '../game/enemyEntity';
import { EnemyShotSystem } from '../game/enemyShots';
import { addWeapon, newRunStats, summaryLines, type RunStats } from '../game/runStats';
import type { LevelCompleteData } from './LevelCompleteScene';
import { ENEMY_ART_TINT, artStatus, assetPath, enemySprite, itemSprite, weaponIcon, worldSpriteKeys } from '../art/sprites';
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
import { SHALLOW_SPEED, fellIntoRiver, groundSegments, inShallow, respawnX } from '../game/water';
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
const BOSS_SHORT_NAME: Partial<Record<BossType, string>> = { nightOwl: '貓頭鷹', sphinx: '人面獅身', nessie: '尼斯湖水怪', yeti: '雪怪' };
/** 冰柱:玩家走到左右這麼近就掉下來。 */
const ICICLE_TRIGGER_X = 100;
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
  | { kind: 'fennec'; brain: FennecBrain; mound: Phaser.GameObjects.Ellipse | null }
  | { kind: 'sphinx'; brain: SphinxBrain }
  | { kind: 'crab'; brain: CrabBrain; armored: boolean }
  | { kind: 'eel'; brain: EelBrain }
  | { kind: 'nessie'; brain: NessieBrain }
  | { kind: 'bear'; brain: BearBrain }
  | { kind: 'yeti'; brain: YetiBrain };

/** 由 updateBoss 控制移動的魔物(不跑 stepEnemy)。 */
const SCRIPTED_BOSSES: ReadonlySet<EnemyType> = new Set(['nightOwl', 'squirrel', 'beaver', 'camel', 'fennec', 'sphinx', 'hermitCrab', 'eel', 'nessie', 'polarBear', 'narwhal', 'yeti']);

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
      return { kind: 'fennec', brain: initialFennecBrain(), mound: null };
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
      return { kind: 'fennec', brain: initialFennecBrain(), mound: null };
    case 'yeti':
      return { kind: 'yeti', brain: initialYetiBrain() };
  }
}

/** 有三階段的關主回傳目前階段,其他回傳 1。 */
function aiPhase(ai: BossAi): 1 | 2 | 3 {
  return ai.kind === 'owl' || ai.kind === 'sphinx' || ai.kind === 'nessie' || ai.kind === 'yeti' ? ai.brain.phase : 1;
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
    const wanted = [...sceneKeys(this.level.scenes.map((s) => s.scene)), ...worldSpriteKeys(this.level.world)];
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
    const solid = (_a: unknown, e: unknown): boolean => !this.enemyFor(e)?.emerging;
    for (const p of this.players) {
      this.physics.add.overlap(p.zone, this.enemyGroup, () => this.hurtPlayer(p, true), solid);
    }

    this.projectiles = new ProjectileSystem(this, this.terrain, (target, hit) => this.onProjectileHit(target, hit));
    this.projectiles.addTargets(this.enemyGroup);
    this.projectiles.addTargets(this.targetGroup);

    this.shots = new EnemyShotSystem(this, this.terrain);
    for (const p of this.players) {
      this.shots.addVictim(p.zone, () => {
        if (p.health.down) return false;
        this.hurtPlayer(p, false);
        return true;
      });
    }

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
    const intents = intentsForMode(this.keyboard.pressed(), this.mode, this.touchControls?.intent());

    const playerTuning = this.level.underwater ? waterTuning(t) : t;
    this.players.forEach((p, i) => {
      p.health = tickHealth(p.health, dtMs);
      const prevVx = p.body().velocity.x;
      const r = p.update(intents[i], dtMs, playerTuning, (reach) => this.findMeleeTarget(reach) !== null);
      this.applyIce(p, prevVx, dtMs);
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
      const drop = this.add.circle(x + (i - 2.5) * 6, GROUND_Y + 6, 4, COLOR.water).setDepth(5);
      this.tweens.add({ targets: drop, y: GROUND_Y - 30 - (i % 3) * 12, alpha: 0, duration: 500, ease: 'Quad.easeOut', onComplete: () => drop.destroy() });
    }
  }

  /** 河溝畫成水面、淺水區畫成半透明的水、荷葉畫成綠色橢圓。 */
  private drawWater(water: NonNullable<LevelDef['water']>): void {
    const g = this.add.graphics().setDepth(-2);
    for (const gap of water.gaps) {
      g.fillStyle(COLOR.water).fillRect(gap.x, GROUND_Y + 12, gap.w, WORLD_H - GROUND_Y - 12);
      g.fillStyle(COLOR.waterLight).fillRect(gap.x, GROUND_Y + 12, gap.w, 4);
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
  private hurtPlayer(p: PlayerEntity, bounce: boolean): void {
    if (this.bossDefeated) return;
    const r = applyHit(p.health);
    p.health = r.health;
    if (r.hit) audio.sfx('hurt');
    if (r.hit && bounce && !r.health.down) p.body().setVelocityY(THORN_BOUNCE_VY);
  }

  private handleTeam(): void {
    // 打倒關主後就算全員睡著也不重來,直接進結算。
    if (this.restarting || this.bossDefeated) return;
    const action = decideTeam(this.players.map((p) => p.health));
    if (action.kind === 'revive') {
      const p = this.players[action.index];
      const partner = this.players.find((q) => !q.health.down)!;
      p.teleport(partner.x, REVIVE_DROP_Y);
      p.health = freshHealth(REVIVE_INVULN_MS);
    } else if (action.kind === 'restart') {
      this.restarting = true;
      this.scene.restart({
        ...this.initData,
        checkpointX: reachedCheckpoint(this.level.checkpoints, this.maxReachedX),
        restarts: this.restarts + 1,
        loadouts: this.players.map((p) => p.loadout),
        openedChests: this.openedChestIndexes(),
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
      const x = spec.from === 'left' ? this.scrollX - SIDE_SPAWN_MARGIN : this.scrollX + VIEW_W + SIDE_SPAWN_MARGIN;
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
      dtMs,
    });
    ai.brain = step.brain;
    enemy.brain = { ...enemy.brain, facing: step.brain.facing, phase: step.vx !== 0 ? 'walk' : 'idle' };
    const icy = enemy.def.type === 'narwhal';
    if (step.teleportX !== null) pb.reset(step.teleportX, enemy.body.y);
    if (was !== 'burrow' && step.brain.mode === 'burrow') this.puffAt(enemy.x, icy);
    enemy.emerging = step.hidden;
    enemy.body.setAlpha(step.hidden ? 0 : 1);
    pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (step.brain.mode === 'under' && !ai.mound) {
      // 耳廓狐冒出沙堆;獨角鯨是冰面的裂痕。
      ai.mound = this.add.ellipse(step.brain.moundX, GROUND_Y - MOUND_H / 4, MOUND_W, MOUND_H, icy ? 0xd8f0ff : COLOR.dirt).setDepth(3);
      if (icy) ai.mound.setStrokeStyle(2, 0x6fa8d8);
      this.tweens.add({ targets: ai.mound, scaleX: 1.15, duration: 90, yoyo: true, repeat: -1 });
    }
    if (step.brain.mode !== 'under' && ai.mound) {
      ai.mound.destroy();
      ai.mound = null;
      this.puffAt(enemy.x, icy);
    }
    for (const c of step.clumps) this.shots.fire(enemy.x, enemy.body.y - 10, c.vx, c.vy, icy ? 'ice' : 'sand', SPIT_GRAVITY);
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

  /** 失眠雪怪:丟雪球、跺腳掉冰柱、跳過來落地震出雪浪;第二階段起叫企鵝。 */
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
      dtMs,
    });
    ai.brain = step.brain;
    boss.invulnerable = step.invulnerable;
    enemy.setArt(enemySprite('yeti', 'awake', ai.brain.phase));
    enemy.bossPhase = ai.brain.phase;
    this.angryTint(boss, step.brain.mode === 'angry', step.enteredPhase);
    enemy.brain = { ...enemy.brain, facing: pb.velocity.x > 50 ? 1 : -1, phase: step.brain.mode === 'leap' ? 'hop' : 'idle' };
    if (step.vx !== null) pb.setVelocityX(step.vx);
    if (step.vy !== null) pb.setVelocityY(step.vy);
    if (was !== 'windup' && step.brain.mode === 'windup') this.tell(enemy);
    for (const b of step.snowballs) this.shots.fire(handX, handY, b.vx, b.vy, 'snow', SNOWBALL_GRAVITY);
    for (const x of step.icicles) this.desert.dropBlock(x, 'icicle');
    for (const dir of step.waves) this.desert.sendWave(enemy.x + dir * (enemy.def.w / 2), dir, 0, 'snow');
    if (step.icicles.length + step.waves.length > 0) {
      audio.sfx('bossPhase');
      this.cameras.main.shake(220, 0.007);
    }
    if (step.summon) boss.minions.add(this.spawnFrom({ type: 'penguin', from: 'left', delayMs: 0 }, false));
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

  /** 小頭目出招前頭上冒一個「!」。 */
  private tell(e: EnemyEntity): void {
    const mark = this.add
      .text(e.x, e.body.y - e.def.h / 2 - 12, '!', { fontSize: '30px', color: '#ffe08a', stroke: '#3a2a5a', strokeThickness: 5 })
      .setOrigin(0.5, 1)
      .setDepth(6);
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
    const flyingY: Partial<Record<BossType, number>> = { nightOwl: OWL_HOVER_Y, eel: 200, nessie: NESSIE_HOME_Y };
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
    return (ai?.kind === 'crab' || ai?.kind === 'squirrel') && ai.armored;
  }

  private isInvulnerable(e: EnemyEntity): boolean {
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
      if (bulletEffect(target.def, target.brain.facing, reach.facing, 0, this.isArmored(target)) === 'blocked') {
        this.blockedShots += 1;
        audio.sfx('blocked');
        return;
      }
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

  /** 子彈命中:刺盾擋下、扣血、打倒;正在冒出的魔物與已倒下的靶不算。 */
  private onProjectileHit(obj: Phaser.GameObjects.GameObject, hit: ProjectileHit): HitResult {
    const enemy = this.enemyFor(obj);
    if (enemy) {
      if (enemy.emerging || enemy.hp <= 0 || this.isInvulnerable(enemy)) return 'ignored';
      if (bulletEffect(enemy.def, enemy.brain.facing, hit.vx, hit.vy, this.isArmored(enemy)) === 'blocked') {
        this.blockedShots += 1;
        audio.sfx('blocked');
        return 'blocked';
      }
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
    if (stay) return;
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
