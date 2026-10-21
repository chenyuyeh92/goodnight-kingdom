import Phaser from 'phaser';
import { createTuningStore, type StorageLike } from './config/tuning';
import { createSaveStore } from './game/save';
import type { EnemyPhase, EnemyType } from './game/enemies';
import type { Aim, Facing } from './game/playerMotor';
import type { SpecialWeaponId, WeaponId } from './game/weapons';
import type { ItemId } from './game/items';
import { parsePlayMode, type PlayMode } from './input/playMode';
import { BackpackScene } from './scenes/BackpackScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { TestRangeScene, type TestRangeData } from './scenes/TestRangeScene';
import { mountKeyTest } from './ui/keyTest';
import { mountTuningPanel } from './ui/tuningPanel';

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
}

export interface GkDebug {
  ready: boolean;
  screen?: 'mode-select' | 'range' | 'backpack';
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

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game',
    backgroundColor: '#2a2550',
    pixelArt: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  });

  const save = createSaveStore(safeLocalStorage());
  const data: TestRangeData = { getTuning: () => store.get(), testHooks, save };
  game.scene.add('TestRange', TestRangeScene, false);
  game.scene.add('ModeSelect', ModeSelectScene, false);
  game.scene.add('Backpack', BackpackScene, false);
  if (mode) game.scene.start('TestRange', { ...data, mode });
  else game.scene.start('ModeSelect', data);
}
