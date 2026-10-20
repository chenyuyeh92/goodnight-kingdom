import Phaser from 'phaser';
import { createTuningStore, type StorageLike } from './config/tuning';
import { TestRangeScene, type TestRangeData } from './scenes/TestRangeScene';
import { mountTuningPanel } from './ui/tuningPanel';

export interface GkDebug {
  ready: boolean;
  player?: { x: number; y: number; crouching: boolean; aim: 'forward' | 'up' | 'down'; facing: 1 | -1 };
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

const tuneMode = new URLSearchParams(location.search).get('tune') === '1';
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

const data: TestRangeData = { getTuning: () => store.get() };
game.scene.add('TestRange', TestRangeScene, true, data);
