import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { sessionData, type TestRangeData } from './TestRangeScene';
import { startLevel } from './LoadoutScene';
import { onMenuKey } from './menuKeys';
import { menuButton } from './menuButton';
import type { LevelId } from '../levels/levelDef';

export interface LevelCompleteData extends TestRangeData {
  levelName: string;
  /** 下一關;最後一關或練習場為 null。 */
  next: LevelId | null;
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
    audio.music(null);
    audio.sfx('complete');
    const { levelName, summary } = this.data_;
    this.add.text(480, 90, `${levelName} 通關!`, { fontSize: '44px', color: '#ffe08a' }).setOrigin(0.5);
    summary.forEach((line, i) => {
      this.add.text(480, 170 + i * 44, line, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
    });

    const next = this.data_.next;
    const buttons = [
      { label: '再玩一次(1)', code: 'Digit1', go: () => this.replay() },
      { label: '回到選單(2)', code: 'Digit2', go: () => this.menu() },
      ...(next ? [{ label: '下一關(3)', code: 'Digit3', go: () => this.playNext(next) }] : []),
    ];
    const gap = 260;
    const left = 480 - ((buttons.length - 1) * gap) / 2;
    buttons.forEach((b, i) => menuButton(this, left + i * gap, BUTTON_Y, b.label, b.go));
    onMenuKey(this, (e) => buttons.find((b) => b.code === e.code)?.go());

    window.__GK__ = { ready: true, screen: 'complete', summary: [...summary] };
  }

  private replay(): void {
    startLevel(this, sessionData(this.data_));
  }

  private playNext(next: LevelId): void {
    startLevel(this, { ...sessionData(this.data_), level: next });
  }

  private menu(): void {
    const { mode: _mode, ...rest } = sessionData(this.data_);
    this.scene.start('ModeSelect', rest);
  }
}
