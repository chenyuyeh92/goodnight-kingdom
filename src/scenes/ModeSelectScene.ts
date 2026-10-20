import Phaser from 'phaser';
import type { PlayMode } from '../input/playMode';
import type { TestRangeData } from './TestRangeScene';

const BUTTONS: ReadonlyArray<{ mode: PlayMode; x: number; label: string; code: string }> = [
  { mode: 'single', x: 340, label: '單人(按 1)', code: 'Digit1' },
  { mode: 'duo', x: 620, label: '雙人(按 2)', code: 'Digit2' },
];
const BUTTON_Y = 330;

export class ModeSelectScene extends Phaser.Scene {
  private data_: TestRangeData = {};

  constructor() {
    super('ModeSelect');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
  }

  create(): void {
    this.add.text(480, 180, '晚安王國', { fontSize: '56px', color: '#f3e9d2' }).setOrigin(0.5);
    for (const b of BUTTONS) {
      const bg = this.add.rectangle(b.x, BUTTON_Y, 220, 70, 0x3b3366).setInteractive({ useHandCursor: true });
      this.add.text(b.x, BUTTON_Y, b.label, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
      bg.on('pointerover', () => bg.setFillStyle(0x5a4f99));
      bg.on('pointerout', () => bg.setFillStyle(0x3b3366));
      bg.on('pointerdown', () => this.choose(b.mode));
    }
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const b = BUTTONS.find((x) => x.code === e.code);
      if (b) this.choose(b.mode);
    });
    window.__GK__ = { ready: true, screen: 'mode-select' };
  }

  private choose(mode: PlayMode): void {
    this.scene.start('TestRange', { ...this.data_, mode });
  }
}
