import Phaser from 'phaser';
import { createTuningStore, type StorageLike } from './config/tuning';
import { createSaveStore } from './game/save';
import type { EnemyPhase, EnemyType } from './game/enemies';
import type { Aim, Facing } from './game/playerMotor';
import type { SpecialWeaponId, WeaponId } from './game/weapons';
import type { ItemId } from './game/items';
import { parseLevelId, type LevelId } from './levels/levelDef';
import type { OwlMode } from './game/owl';
import { parsePlayMode, type PlayMode } from './input/playMode';
import { BackpackScene } from './scenes/BackpackScene';
import { BootScene } from './scenes/BootScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { LoadoutScene } from './scenes/LoadoutScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { TestRangeScene, type TestRangeData } from './scenes/TestRangeScene';
import { mountKeyTest } from './ui/keyTest';
import { isTouchDevice } from './ui/touchControls';
import { mountTuningPanel } from './ui/tuningPanel';
import { installTextDefaults } from './ui/textDefaults';

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
  screen?: 'boot' | 'mode-select' | 'level-select' | 'range' | 'backpack' | 'complete' | 'loadout';
  /** 選關畫面:每一關是否解鎖、最佳時間。 */
  levels?: { id: LevelId; unlocked: boolean; best: number | null }[];
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
  boss?: { hp: number; maxHp: number; phase: 1 | 2 | 3; mode: OwlMode } | null;
  bossDefeated?: boolean;
  /** 場上魔物子彈(羽毛)數。 */
  enemyShots?: number;
  hurtBoss?: (amount: number) => void;
  /** 這一關關主戰的鏡頭鎖定位置(沒有關主為 null)。 */
  bossLockX?: number | null;
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
  });
  // 測試用:讓 e2e 可以檢查畫面上的物件。
  if (testHooks) (window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;

  const save = createSaveStore(safeLocalStorage());
  const touch = params.get('touch') === '1' || isTouchDevice();
  const level = parseLevelId(params.get('level'));
  const data: TestRangeData = { getTuning: () => store.get(), testHooks, save, touch, level };
  game.scene.add('TestRange', TestRangeScene, false);
  game.scene.add('ModeSelect', ModeSelectScene, false);
  game.scene.add('Backpack', BackpackScene, false);
  game.scene.add('LevelComplete', LevelCompleteScene, false);
  game.scene.add('Loadout', LoadoutScene, false);
  game.scene.add('LevelSelect', LevelSelectScene, false);
  game.scene.add('Boot', BootScene, false);
  const noArt = params.get('noart') === '1';
  if (mode) game.scene.start('Boot', { next: 'TestRange', data: { ...data, mode }, noArt });
  else game.scene.start('Boot', { next: 'ModeSelect', data, noArt });
}
