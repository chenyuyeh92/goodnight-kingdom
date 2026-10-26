import Phaser from 'phaser';
import { createTuningStore, type StorageLike } from './config/tuning';
import { createSaveStore } from './game/save';
import { createGuardStore } from './draw/guards';
import type { EnemyPhase, EnemyType } from './game/enemies';
import type { Aim, Facing } from './game/playerMotor';
import type { SpecialWeaponId, WeaponId } from './game/weapons';
import type { ItemId } from './game/items';
import { parseLevelId, type LevelId } from './levels/levelDef';
import { parsePlayMode, type PlayMode } from './input/playMode';
import { BackpackScene } from './scenes/BackpackScene';
import { BootScene } from './scenes/BootScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GuardRoomScene } from './scenes/GuardRoomScene';
import { SettingsScene } from './scenes/SettingsScene';
import { OnlineScene } from './scenes/OnlineScene';
import { E2E_BUILD, needsFullVersion, setTestFull } from './config/edition';
import { initNativeBridge } from './platform/native';
import { TEST_TOOLS } from './config/testTools';
import { OnlineBadgeScene } from './scenes/OnlineBadgeScene';
import { StoryScene } from './scenes/StoryScene';
import { audio } from './audio/audio';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { TestRangeScene, type TestRangeData } from './scenes/TestRangeScene';
import { mountKeyTest } from './ui/keyTest';
import { isTouchDevice } from './ui/touchControls';
import { mountTuningPanel } from './ui/tuningPanel';
import { installTextDefaults } from './ui/textDefaults';
import { safeLocalStorage } from './config/storage';
import { initLang, lang, tr } from './i18n/lang';
import { preventZoom } from './ui/noZoom';

export interface PlayerDebug {
  x: number;
  y: number;
  crouching: boolean;
  aim: Aim;
  facing: Facing;
  hearts: number;
  down: boolean;
  invuln: boolean;
  weapon: WeaponId;
  ammo: number | null;
  heat: number;
  overheated: boolean;
  /** 懷錶集氣中:集了多久(ms);沒在集氣是 0。 */
  chargeMs: number;
  cocoa: boolean;
  star: boolean;
  /** 角色用的圖(小綿羊 'guard' 或玩家畫的守衛),沒有圖為 null。 */
  art: string | null;
  /** 手上的武器圖(位置是槍口);睡著或沒有圖時為 null。 */
  held: { key: string; angle: number; x: number; y: number; left: number; right: number } | null;
  /** 畫角色圖用的腳底 y(手上武器要跟著它)。 */
  artFeetY?: number;
}

export interface EnemyDebug {
  type: EnemyType;
  hp: number;
  x: number;
  y: number;
  facing: 1 | -1;
  phase: EnemyPhase;
  arena: boolean;
  /** 美術圖的水平中心與底部;沒有圖時為 null。 */
  artX: number | null;
  artBottom: number | null;
  /** 目前畫的是哪一張圖(關主的階段、動畫格)。 */
  artKey: string | null;
  /** 盾牌還剩多少(沒有盾或破掉了是 0)。 */
  shieldHp: number;
}

export interface GkDebug {
  ready: boolean;
  screen?: 'boot' | 'mode-select' | 'level-select' | 'range' | 'backpack' | 'complete' | 'guard-room' | 'draw' | 'settings' | 'story' | 'online' | 'guest';
  /** 線上雙人:房主開房間的狀態、號碼;朋友那台的連線狀態與畫面。 */
  online?: { role: 'host' | 'guest'; state: string; code: string | null; badge?: boolean };
  guest?: { state: string; videoWidth: number; playing: boolean; bits: number };
  onlineChoice?: boolean;
  /** 故事畫面:哪個故事、第幾幕、這一幕打出來的字、打完了沒。 */
  story?: { id: string; beat: number; beats: number; beatId: string; text: string[]; done: boolean; skippable: boolean };
  /** 主選單「故事」的選擇(開場/結局)正在顯示。 */
  /** 世界第一關的開頭句(正在顯示時)。 */
  intro?: string | null;
  /** 開頭句還沒結束(跳過後等按鍵放開時也算),遊戲停著。 */
  introPaused?: boolean;
  /** 魔王頭上的對話框(正在顯示時)。 */
  bossSay?: string | null;
  /** 設定畫面的音量與目前選到的列。 */
  settings?: { music: number; sfx: number; muted: boolean };
  settingsRow?: string;
  /** 目前的語言。 */
  lang?: 'zh' | 'en';
  /** 每種音效觸發的次數、目前的配樂。 */
  sfx?: Partial<Record<string, number>>;
  music?: string | null;
  musicSource?: 'recorded' | 'synth' | 'loading' | null;
  /** 實際發出聲音的音效次數、正在排程的配樂數。 */
  voices?: number;
  musicSchedulers?: number;
  musicTracks?: number;
  /** 守衛房間:已存的守衛、A/B 選用、正在幫誰選。 */
  guardList?: { id: string; name: string }[];
  guardSelected?: { A: string | null; B: string | null };
  guardTarget?: 'A' | 'B';
  /** 選關畫面:每一關是否解鎖、最佳時間。 */
  levels?: { id: LevelId; unlocked: boolean; best: number | null }[];
  /** 選關畫面正在看第幾個世界、測試模式是否開著。 */
  world?: number;
  testMode?: boolean;
  /** 美術素材載入狀態。 */
  art?: { loaded: number; missing: string[]; disabled: boolean };
  /** 通關結算的文字列。 */
  summary?: string[];
  /** 結算畫面是不是破關結局(打倒夢貘)。 */
  ending?: boolean;
  fullTeaser?: boolean;
  /** 結算畫面的按鈕文字。 */
  buttons?: string[];
  /** App 版(選關):商店狀態與購買按鈕。 */
  store?: { full: boolean; price: string | null; busy: boolean; lastResult: string | null; shown: boolean; banner: string } | null;
  /** 選武器畫面:正在選的玩家與選項文字。 */
  /** 背包畫面上的文字列,供測試讀取。 */
  backpackText?: string[];
  backpackLayout?: { lastRowBottom: number; ratesY: number };
  mode?: PlayMode;
  /** 等於 players[0],保留給第一步的測試。 */
  player?: PlayerDebug;
  players?: PlayerDebug[];
  checkpointX?: number;
  restarts?: number;
  hurt?: (index: number) => void;
  /** 測試用:直接睡著。 */
  knockOut?: (index: number) => void;
  enemies?: EnemyDebug[];
  enemiesDefeated?: number;
  blockedShots?: number;
  /** 打破的盾牌數。 */
  shieldsBroken?: number;
  meleeHits?: number;
  meleeSwings?: number;
  giveWeapon?: (index: number, id: SpecialWeaponId, stars?: number) => void;
  giveItem?: (index: number, item: ItemId) => void;
  rigChest?: (weapon: SpecialWeaponId) => void;
  rigDrop?: (item: ItemId) => void;
  clearSave?: () => void;
  resetChests?: () => void;
  openedChests?: number[];
  saveOk?: boolean;
  /** 是否顯示觸控操作。 */
  touch?: boolean;
  level?: LevelId;
  boss?: { hp: number; maxHp: number; phase: 1 | 2 | 3; mode: string; type: EnemyType; hidden: boolean; armored: boolean; x: number; y: number } | null;
  bossDefeated?: boolean;
  /** 場上魔物子彈(羽毛)數。 */
  enemyShots?: number;
  hurtBoss?: (amount: number) => void;
  /** 這一關關主戰的鏡頭鎖定位置(沒有關主為 null)。 */
  bossLockX?: number | null;
  /** 掉進河溝的次數。 */
  riverFalls?: number;
  /** 世界 5:踩到熔岩被燙到的次數、火山噴發次數。 */
  volcano?: { lavaBurns: number; eruptions: number };
  /** 世界 6:抓住藤蔓的次數、每位玩家抓著哪一條(沒抓是 null)。 */
  vines?: { grabs: number; holding: (number | null)[] };
  /** 世界 7:正在預告的獸群、放出過幾群、場上的角馬數、被撞到的次數。 */
  stampede?: { warnings: number; herds: number; beasts: number; hits: number };
  /** 世界 8:風區現在的風有多強(0–1)、雷鳥正在颳強風、被風推過的格數。 */
  wind?: { strength: number; gust: boolean; pushes: number };
  /** 世界 9:黑暗多濃(0–1)、這一格有幾個光源、火螢女王閃光後的全黑中。 */
  darkness?: { alpha: number; lights: number; blackout: boolean };
  /** 世界 10:收集到的星星與總數、孔雀開屏後左右顛倒中、夢貘正在吸、每位玩家被麻糬黏住變慢中、夢貘大惡夢的月光(集氣中才有)與打中幾次。 */
  /** 手感:噴過幾次火花、槍口閃光幾次、魔物被打退幾次、連續哄睡(現在與最多)、畫面中央的大字。 */
  feel?: { sparks: number; flashes: number; knocks: number; combo: number; bestCombo: number; banner: string | null };
  /** 雜魚:魔王叫的還在場上的數量、魔王叫了幾次、零星雜魚多生了幾隻跟班。 */
  fodder?: { bossAlive: number; bossCalls: number; echoes: number; ambientAlive: number; ambientCalls: number };
  setAmbient?: (on: boolean) => void;
  /** 機關:移動平台現在的左上角、會掉的平台的狀態、彈跳次數、被移動平台載的次數。 */
  gadgets?: { movers: { x: number; y: number; w: number }[]; crumbles: ('solid' | 'shaking' | 'fallen')[]; bounces: number };
  w10?: { stars: number; starsTotal: number; reversed: boolean; inhaling: boolean; slowed: boolean[]; mochiHits: number; pulls: number; nightmare: { safeX: number; halfW: number } | null; nightmareHits: number };
  /** 沙漠機關:場上的沙磚與沙浪數、每位玩家陷進流沙的時間、壓力板觸發次數。 */
  desert?: { blocks: number; landed: number; bottoms: number[]; waves: number; sink: number[]; sinks: number; platesFired: number };
  /** 測試用:在 x 掉一塊沙磚。 */
  dropBlock?: (x: number) => void;
  backpack?: Partial<Record<SpecialWeaponId, number>>;
  chestsOpened?: number;
  /** 最後一次開寶箱:新拿到、升星、已滿三星,或魔王區寶箱重來後再開(again,同一把)。 */
  lastChest?: 'new' | 'starUp' | 'maxed' | 'again' | null;
  /** 場上的道具數。 */
  items?: number;
  arena?: { locked: boolean; wave: number; nextArena: number };
  spawn?: (type: EnemyType, x: number, y?: number) => void;
  defeatAll?: () => void;
  /** 測試用:讓魔物從地面冒出。 */
  spawnGround?: (type: EnemyType, x: number) => void;
  /** 測試用:把醒著的角色移到 x(站在地面上)。 */
  warp?: (x: number, feetY?: number) => void;
  bullets?: number;
  shots?: { id: string; x: number; y: number; damage: number; bouncesLeft: number; size: number }[];
  blasts?: { count: number; last: { x: number; y: number; hits: number } | null };
  targetsHit?: number;
  cameraX?: number;
}

declare global {
  interface Window {
    __GK__?: GkDebug;
  }
}

const params = new URLSearchParams(location.search);

preventZoom();

if (params.get('keytest') === '1') {
  mountKeyTest(document.body);
} else {
  startGame(params.get('tune') === '1', parsePlayMode(params.get('mode')), params.get('test') === '1');
}

function startGame(tuneMode: boolean, mode: PlayMode | null, testHooks: boolean): void {
  initLang(safeLocalStorage(), navigator.languages ?? [navigator.language], params.get('lang'));
  document.documentElement.lang = lang() === 'zh' ? 'zh-Hant' : 'en';
  document.title = tr('晚安王國 Goodnight Kingdom', 'Goodnight Kingdom');
  const store = createTuningStore(tuneMode ? safeLocalStorage() : null);
  if (tuneMode) mountTuningPanel(store, document.body);

  installTextDefaults();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game',
    backgroundColor: '#2a2550',
    pixelArt: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // 物理由關卡場景自己推進,才能和遊戲邏輯一樣把每格時間限制在 MAX_DT_MS。
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, customUpdate: true } },
    // 不平滑每格的時間:畫面掉格時遊戲照實際時間前進,不會變慢動作。
    fps: { smoothStep: false },
    // 聲音由 src/audio/audio.ts 自己管理,不讓 Phaser 再開一個 AudioContext。
    audio: { noAudio: true },
  });
  // 測試用:讓 e2e 可以檢查畫面上的物件。
  if (testHooks) (window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;

  const save = createSaveStore(safeLocalStorage());
  const touch = params.get('touch') === '1' || isTouchDevice();
  // 測試用網址(?test=1)可以玩全部(加 free=1 測免費版);一般網址不能直接跳到免費版沒有的世界。
  setTestFull((TEST_TOOLS || E2E_BUILD) && testHooks && params.get('free') !== '1');
  // App 版(iPhone、iPad):接上 App 的購買與分享;網頁版什麼都不做。
  initNativeBridge(safeLocalStorage());
  const asked = parseLevelId(params.get('level'));
  const level = asked && !needsFullVersion(asked) ? asked : undefined;
  const guards = createGuardStore(safeLocalStorage());
  audio.init(safeLocalStorage(), `${import.meta.env.BASE_URL}assets/music/tracks.json`);
  // 測試模式預設不播故事(開場、世界開頭句),故事的測試加 ?story=1。
  const stories = !testHooks || params.get('story') === '1';
  const data: TestRangeData = { getTuning: () => store.get(), testHooks, save, touch, level, guards, stories };
  game.scene.add('TestRange', TestRangeScene, false);
  game.scene.add('ModeSelect', ModeSelectScene, false);
  game.scene.add('Backpack', BackpackScene, false);
  game.scene.add('LevelComplete', LevelCompleteScene, false);
  game.scene.add('LevelSelect', LevelSelectScene, false);
  game.scene.add('GuardRoom', GuardRoomScene, false);
  game.scene.add('Settings', SettingsScene, false);
  game.scene.add('Online', OnlineScene, false);
  game.scene.add('Story', StoryScene, false);
  game.scene.add('Boot', BootScene, false);
  // 最後加:畫在所有畫面上面。
  game.scene.add('OnlineBadge', OnlineBadgeScene, false);
  const noArt = params.get('noart') === '1';
  if (mode) game.scene.start('Boot', { next: 'TestRange', data: { ...data, mode }, noArt });
  else game.scene.start('Boot', { next: 'ModeSelect', data, noArt });
}
