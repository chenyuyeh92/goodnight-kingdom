import Phaser from 'phaser';
import { createTuningStore, type StorageLike } from './config/tuning';
import type { Aim, Facing } from './game/playerMotor';
import { parsePlayMode, type PlayMode } from './input/playMode';
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
}

export interface GkDebug {
  ready: boolean;
  screen?: 'mode-select' | 'range';
  mode?: PlayMode;
  /** 等於 players[0],保留給第一步的測試。 */
  player?: PlayerDebug;
  players?: PlayerDebug[];
  checkpointX?: number;
  restarts?: number;
  hurt?: (index: number) => void;
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

  const data: TestRangeData = { getTuning: () => store.get(), testHooks };
  game.scene.add('TestRange', TestRangeScene, false);
  game.scene.add('ModeSelect', ModeSelectScene, false);
  if (mode) game.scene.start('TestRange', { ...data, mode });
  else game.scene.start('ModeSelect', data);
}
