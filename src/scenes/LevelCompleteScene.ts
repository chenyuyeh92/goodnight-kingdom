import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { sessionData, type TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { menuButton } from './menuButton';
import type { LevelId } from '../levels/levelDef';
import { pick, tr, type Text } from '../i18n/lang';
import { isNativeApp } from '../platform/native';
import { FREE_WORLDS } from '../config/edition';

export interface LevelCompleteData extends TestRangeData {
  levelName: string;
  /** 下一關;最後一關或練習場為 null。 */
  next: LevelId | null;
  summary: string[];
  /** 打倒最終魔王夢貘:結算畫面變成結局。 */
  ending?: boolean;
  /** 免費版玩完世界 3:下面加一句完整版的介紹。 */
  fullTeaser?: boolean;
}

const BUTTON_Y = 450;
const INPUT_LOCK_MS = 500;
/** 結局的話(企劃 6.4)。 */
export const ENDING_LINES: readonly Text[] = [
  { zh: '夢貘終於睡著了,睡意回到晚安王國,', en: 'The Dream Tapir is finally asleep, and sleep has come back to the Goodnight Kingdom.' },
  { zh: '大家都可以好好睡覺了。晚安!', en: 'Everyone can sleep soundly now. Good night!' },
];

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
      this.add.text(480, 56, tr('破關!晚安王國', 'You did it! Goodnight Kingdom'), { fontSize: '44px', color: '#ffe08a' }).setOrigin(0.5);
      ENDING_LINES.forEach((line, i) => {
        this.add.text(480, 116 + i * 34, pick(line), { fontSize: '24px', color: '#ffd0e0' }).setOrigin(0.5);
      });
      summary.forEach((line, i) => {
        this.add.text(480, 196 + i * 32, line, { fontSize: '20px', color: '#f3e9d2' }).setOrigin(0.5);
      });
    } else {
      this.add.text(480, 90, tr(`${levelName} 通關!`, `${levelName} cleared!`), { fontSize: '44px', color: '#ffe08a' }).setOrigin(0.5);
      summary.forEach((line, i) => {
        // 最多 7 行(有星星、有連續哄睡)也不會碰到按鈕。
        this.add.text(480, 150 + i * 38, line, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
      });
    }

    // App 版可以直接去買(選關的世界 4 有購買按鈕);網頁版說即將推出。
    const unlockInApp = (this.data_.fullTeaser ?? false) && isNativeApp();
    if (this.data_.fullTeaser) {
      const text = unlockInApp
        ? tr('免費版到這裡結束!解鎖完整版,就能玩世界 4–10 和結局。', 'That is the end of the free version! Unlock the full version to play Worlds 4–10 and the ending.')
        : tr('免費版到這裡結束!完整版還有世界 4–10 和結局,即將推出。', 'That is the end of the free version! The full version adds Worlds 4–10 and the ending. Coming soon.');
      this.add
        .text(480, 405, text, {
          fontSize: '18px',
          color: '#ffe08a',
          align: 'center',
          wordWrap: { width: 860 },
        })
        .setOrigin(0.5);
    }

    // 從結局的故事進來時,一小段時間不收按鍵與點擊(看故事的連點不會直接按到按鈕)。
    const readyAt = ending ? this.time.now + INPUT_LOCK_MS : 0;
    const guard = (go: () => void) => () => void (this.time.now >= readyAt && go());
    const next = this.data_.next;
    const buttons = [
      { label: tr('再玩一次(1)', 'Play again (1)'), code: 'Digit1', go: () => this.replay() },
      { label: tr('回到選單(2)', 'Menu (2)'), code: 'Digit2', go: () => this.menu() },
      ...(next ? [{ label: tr('下一關(3)', 'Next level (3)'), code: 'Digit3', go: () => this.playNext(next) }] : []),
      ...(unlockInApp ? [{ label: tr('解鎖完整版(3)', 'Unlock all (3)'), code: 'Digit3', go: () => this.toStore() }] : []),
    ];
    const gap = 260;
    const left = 480 - ((buttons.length - 1) * gap) / 2;
    buttons.forEach((b, i) => menuButton(this, left + i * gap, BUTTON_Y, b.label, guard(b.go)));
    onMenuKey(this, (e) => {
      const b = buttons.find((x) => x.code === e.code);
      if (b) guard(b.go)();
    });

    window.__GK__ = { ready: true, screen: 'complete', summary: [...summary], ending: ending ?? false, fullTeaser: this.data_.fullTeaser ?? false, buttons: buttons.map((b) => b.label) };
  }

  private replay(): void {
    this.scene.start('TestRange', sessionData(this.data_));
  }

  private playNext(next: LevelId): void {
    this.scene.start('TestRange', { ...sessionData(this.data_), level: next });
  }

  /** 到選關的世界 4,那裡有「解鎖完整版」按鈕。 */
  private toStore(): void {
    const { mode: _mode, ...rest } = sessionData(this.data_);
    this.scene.start('LevelSelect', { ...rest, world: FREE_WORLDS + 1 });
  }

  private menu(): void {
    const { mode: _mode, ...rest } = sessionData(this.data_);
    this.scene.start('ModeSelect', rest);
  }
}
