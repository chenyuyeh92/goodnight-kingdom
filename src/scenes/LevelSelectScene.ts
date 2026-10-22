import Phaser from 'phaser';
import { createSaveStore } from '../game/save';
import { WORLD1, isUnlocked, levelNumber } from '../game/progress';
import { formatDuration } from '../game/runStats';
import { LEVELS } from '../levels';
import type { LevelId } from '../levels/levelDef';
import type { TestRangeData } from './TestRangeScene';
import { startLevel } from './LoadoutScene';
import { onMenuKey } from './menuKeys';

const CARD_W = 250;
const CARD_H = 230;
const CARD_Y = 290;
const CARD_GAP = 280;
/** 每一關的時段(一個世界玩完剛好過了一天)。 */
const TIME_OF_DAY: Partial<Record<LevelId, string>> = { 'w1-1': '白天', 'w1-2': '黃昏', forest: '晚上 → 深夜' };

/** 世界 1 選關:依序解鎖,顯示最佳時間。 */
export class LevelSelectScene extends Phaser.Scene {
  private data_: TestRangeData = {};

  constructor() {
    super('LevelSelect');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
  }

  create(): void {
    const cleared = (this.data_.save ?? createSaveStore(null)).get().cleared;
    if (this.textures.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540).setAlpha(0.45);
    this.add.text(480, 70, '世界 1  失眠森林', { fontSize: '36px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5);

    const levels = WORLD1.map((id) => ({ id, unlocked: isUnlocked(id, cleared), best: cleared[id] ?? null }));
    levels.forEach((l, i) => {
      const x = 480 + (i - 1) * CARD_GAP;
      const card = this.textures.exists('ui-panel')
        ? this.add.nineslice(x, CARD_Y, 'ui-panel', undefined, CARD_W, CARD_H, 24, 24, 24, 24)
        : this.add.rectangle(x, CARD_Y, CARD_W, CARD_H, 0x3b3366);
      card.setAlpha(l.unlocked ? 1 : 0.5).setInteractive({ useHandCursor: l.unlocked });
      card.on('pointerdown', () => this.play(l.id, l.unlocked));
      const ink = l.unlocked ? '#3a2a5a' : '#6f6a8a';
      this.add.text(x, CARD_Y - 75, levelNumber(l.id), { fontSize: '40px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y - 20, LEVELS[l.id].name, { fontSize: '22px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y + 18, TIME_OF_DAY[l.id] ?? '', { fontSize: '18px', color: ink }).setOrigin(0.5);
      const status = !l.unlocked
        ? `鎖住:先通過 ${levelNumber(WORLD1[i - 1])}`
        : l.best !== null
          ? `最佳 ${formatDuration(l.best)}`
          : '還沒通關';
      this.add.text(x, CARD_Y + 62, status, { fontSize: '18px', color: l.unlocked ? '#b0477a' : ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y + CARD_H / 2 + 24, `按 ${i + 1}`, { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);
    });
    this.add.text(480, 505, 'Esc 回到主頁', { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);

    onMenuKey(this, (e) => {
      if (e.code === 'Escape') this.back();
      const i = /^Digit([1-3])$/.exec(e.code);
      if (i) {
        const l = levels[Number(i[1]) - 1];
        this.play(l.id, l.unlocked);
      }
    });
    window.__GK__ = { ready: true, screen: 'level-select', levels };
  }

  private play(id: LevelId, unlocked: boolean): void {
    if (unlocked) startLevel(this, { ...this.data_, level: id });
  }

  private back(): void {
    const { mode: _mode, ...rest } = this.data_;
    this.scene.start('ModeSelect', rest);
  }
}
