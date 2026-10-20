import Phaser from 'phaser';
import { TestRangeScene } from './scenes/TestRangeScene';

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

new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game',
  backgroundColor: '#2a2550',
  pixelArt: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scene: [TestRangeScene],
});
