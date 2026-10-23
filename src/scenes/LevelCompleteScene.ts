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
  /** 打倒最終魔王夢貘:結算畫面變成結局。 */
  ending?: boolean;
}

const BUTTON_Y = 450;
/** 結局的話(企劃 6.4)。 */
export const ENDING_LINES = ['夢貘終於睡著了,睡意回到晚安王國,', '大家都可以好好睡覺了。晚安!'] as const;

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
    const { levelName, summary, ending } = this.data_;
    if (ending) {
      // 結局:標題、結局的話,下面小一點的統計。
      this.add.text(480, 56, '破關!晚安王國', { fontSize: '44px', color: '#ffe08a' }).setOrigin(0.5);
      ENDING_LINES.forEach((line, i) => {
        this.add.text(480, 116 + i * 34, line, { fontSize: '24px', color: '#ffd0e0' }).setOrigin(0.5);
      });
      summary.forEach((line, i) => {
        this.add.text(480, 196 + i * 32, line, { fontSize: '20px', color: '#f3e9d2' }).setOrigin(0.5);
      });
    } else {
      this.add.text(480, 90, `${levelName} 通關!`, { fontSize: '44px', color: '#ffe08a' }).setOrigin(0.5);
      summary.forEach((line, i) => {
        // 最多 7 行(有星星、有連續哄睡)也不會碰到按鈕。
        this.add.text(480, 150 + i * 38, line, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
      });
    }

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

    window.__GK__ = { ready: true, screen: 'complete', summary: [...summary], ending: ending ?? false };
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
