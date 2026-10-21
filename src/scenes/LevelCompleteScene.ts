import Phaser from 'phaser';
import { sessionData, type TestRangeData } from './TestRangeScene';
import { startLevel } from './LoadoutScene';

export interface LevelCompleteData extends TestRangeData {
  levelName: string;
  summary: string[];
}

const BUTTON_Y = 450;

/** 通關結算:統計與「再玩一次」「回到選單」。 */
export class LevelCompleteScene extends Phaser.Scene {
  private data_!: LevelCompleteData;

  constructor() {
    super('LevelComplete');
  }

  init(data: LevelCompleteData): void {
    this.data_ = data;
  }

  create(): void {
    const { levelName, summary } = this.data_;
    this.add.text(480, 90, `${levelName} 通關!`, { fontSize: '44px', color: '#ffe08a' }).setOrigin(0.5);
    summary.forEach((line, i) => {
      this.add.text(480, 170 + i * 44, line, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
    });

    const buttons = [
      { x: 330, label: '再玩一次(按 1)', code: 'Digit1', go: () => this.replay() },
      { x: 630, label: '回到選單(按 2)', code: 'Digit2', go: () => this.menu() },
    ];
    for (const b of buttons) {
      const bg = this.add.rectangle(b.x, BUTTON_Y, 240, 60, 0x3b3366).setInteractive({ useHandCursor: true });
      this.add.text(b.x, BUTTON_Y, b.label, { fontSize: '22px', color: '#f3e9d2' }).setOrigin(0.5);
      bg.on('pointerover', () => bg.setFillStyle(0x5a4f99));
      bg.on('pointerout', () => bg.setFillStyle(0x3b3366));
      bg.on('pointerdown', b.go);
    }
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => buttons.find((b) => b.code === e.code)?.go());

    window.__GK__ = { ready: true, screen: 'complete', summary: [...summary] };
  }

  private replay(): void {
    startLevel(this, sessionData(this.data_));
  }

  private menu(): void {
    const { mode: _mode, ...rest } = sessionData(this.data_);
    this.scene.start('ModeSelect', rest);
  }
}
