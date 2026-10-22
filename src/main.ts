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
import { LoadoutScene } from './scenes/LoadoutScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GuardRoomScene } from './scenes/GuardRoomScene';
import { SettingsScene } from './scenes/SettingsScene';
import { audio } from './audio/audio';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { TestRangeScene, type TestRangeData } from './scenes/TestRangeScene';
import { mountKeyTest } from './ui/keyTest';
import { isTouchDevice } from './ui/touchControls';
import { mountTuningPanel } from './ui/tuningPanel';
import { installTextDefaults } from './ui/textDefaults';
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
  cocoa: boolean;
  star: boolean;
  /** 角色用的圖(小綿羊 'guard' 或玩家畫的守衛),沒有圖為 null。 */
  art: string | null;
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
}

export interface GkDebug {
  ready: boolean;
  screen?: 'boot' | 'mode-select' | 'level-select' | 'range' | 'backpack' | 'complete' | 'loadout' | 'guard-room' | 'draw' | 'settings';
  /** 設定畫面的音量與目前選到的列。 */
  settings?: { music: number; sfx: number; muted: boolean };
  settingsRow?: string;
  /** 每種音效觸發的次數、目前的配樂。 */
  sfx?: Partial<Record<string, number>>;
  music?: string | null;
  /** 實際發出聲音的音效次數、正在排程的配樂數。 */
  voices?: number;
  musicSchedulers?: number;
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
  /** 選武器畫面:正在選的玩家與選項文字。 */
  loadoutFor?: 'A' | 'B';
  loadoutOptions?: string[];
  /** 背包畫面上的文字列,供測試讀取。 */
  backpackText?: string[];
  mode?: PlayMode;
  /** 等於 players[0],保留給第一步的測試。 */
  player?: PlayerDebug;
  players?: PlayerDebug[];
  checkpointX?: number;
  restarts?: number;
  hurt?: (index: number) => void;
  enemies?: EnemyDebug[];
  enemiesDefeated?: number;
  blockedShots?: number;
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
  boss?: { hp: number; maxHp: number; phase: 1 | 2 | 3; mode: string; type: EnemyType; hidden: boolean } | null;
  bossDefeated?: boolean;
  /** 場上魔物子彈(羽毛)數。 */
  enemyShots?: number;
  hurtBoss?: (amount: number) => void;
  /** 這一關關主戰的鏡頭鎖定位置(沒有關主為 null)。 */
  bossLockX?: number | null;
  /** 掉進河溝的次數。 */
  riverFalls?: number;
  /** 沙漠機關:場上的沙磚與沙浪數、每位玩家陷進流沙的時間、壓力板觸發次數。 */
  desert?: { blocks: number; landed: number; bottoms: number[]; waves: number; sink: number[]; sinks: number; platesFired: number };
  /** 測試用:在 x 掉一塊沙磚。 */
  dropBlock?: (x: number) => void;
  backpack?: Partial<Record<SpecialWeaponId, number>>;
  chestsOpened?: number;
  lastChest?: 'new' | 'starUp' | 'maxed' | null;
  /** 場上的道具數。 */
  items?: number;
  arena?: { locked: boolean; wave: number; nextArena: number };
  spawn?: (type: EnemyType, x: number, y?: number) => void;
  defeatAll?: () => void;
  /** 測試用:讓魔物從地面冒出。 */
  spawnGround?: (type: EnemyType, x: number) => void;
  /** 測試用:把醒著的角色移到 x(站在地面上)。 */
  warp?: (x: number) => void;
  bullets?: number;
  targetsHit?: number;
  cameraX?: number;
}

declare global {
  interface Window {
    __GK__?: GkDebug;
  }
}

function safeLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
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
  const level = parseLevelId(params.get('level'));
  const guards = createGuardStore(safeLocalStorage());
  audio.init(safeLocalStorage(), `${import.meta.env.BASE_URL}assets/music/tracks.json`);
  const data: TestRangeData = { getTuning: () => store.get(), testHooks, save, touch, level, guards };
  game.scene.add('TestRange', TestRangeScene, false);
  game.scene.add('ModeSelect', ModeSelectScene, false);
  game.scene.add('Backpack', BackpackScene, false);
  game.scene.add('LevelComplete', LevelCompleteScene, false);
  game.scene.add('Loadout', LoadoutScene, false);
  game.scene.add('LevelSelect', LevelSelectScene, false);
  game.scene.add('GuardRoom', GuardRoomScene, false);
  game.scene.add('Settings', SettingsScene, false);
  game.scene.add('Boot', BootScene, false);
  const noArt = params.get('noart') === '1';
  if (mode) game.scene.start('Boot', { next: 'TestRange', data: { ...data, mode }, noArt });
  else game.scene.start('Boot', { next: 'ModeSelect', data, noArt });
}
