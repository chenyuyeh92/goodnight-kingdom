import Phaser from 'phaser';
import type { PlayMode } from '../input/playMode';
import type { TestRangeData } from './TestRangeScene';
import { startLevel } from './LoadoutScene';
import { onMenuKey } from './menuKeys';

type Choice = PlayMode | 'backpack';

const BUTTONS: ReadonlyArray<{ choice: Choice; x: number; label: string; code: string }> = [
  { choice: 'single', x: 240, label: '單人(按 1)', code: 'Digit1' },
  { choice: 'duo', x: 480, label: '雙人(按 2)', code: 'Digit2' },
  { choice: 'backpack', x: 720, label: '背包(按 3)', code: 'Digit3' },
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
      bg.on('pointerdown', () => this.choose(b.choice));
    }
    onMenuKey(this, (e) => {
      const b = BUTTONS.find((x) => x.code === e.code);
      if (b) this.choose(b.choice);
    });
    const saveOk = this.data_.save?.ok() ?? false;
    if (!saveOk) {
      this.add
        .text(480, 470, '注意:這個瀏覽器無法存檔(例如無痕模式),背包重新整理後會不見。', { fontSize: '16px', color: '#ffb3c7' })
        .setOrigin(0.5);
    }
    window.__GK__ = { ready: true, screen: 'mode-select', saveOk };
  }

  private choose(choice: Choice): void {
    if (choice === 'backpack') this.scene.start('Backpack', this.data_);
    else startLevel(this, { ...this.data_, mode: choice });
  }
}
