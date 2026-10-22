import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { createSaveStore } from '../game/save';
import { WORLDS, WORLD_NAMES, isUnlocked, levelNumber, previousLevel } from '../game/progress';
import { formatDuration } from '../game/runStats';
import { LEVELS } from '../levels';
import type { LevelId } from '../levels/levelDef';
import type { TestRangeData } from './TestRangeScene';
import { startLevel } from './LoadoutScene';
import { onMenuKey } from './menuKeys';
import { menuButton, smallButton } from './menuButton';

const CARD_W = 250;
const CARD_H = 230;
const CARD_Y = 290;
const CARD_GAP = 280;
/** 每個世界三小關的時段(一個世界玩完剛好過了一天)。 */
const TIME_OF_DAY = ['白天', '黃昏', '晚上 → 深夜'] as const;
const PREV_WORLD = new Set(['KeyQ', 'ArrowLeft']);
const NEXT_WORLD = new Set(['KeyE', 'ArrowRight']);

export interface LevelSelectData extends TestRangeData {
  /** 要顯示第幾個世界(1 起算);沒有時顯示最後一個已開放的世界。 */
  world?: number;
}

/** 選關:可以切換世界;所有小關依序解鎖,顯示最佳時間。 */
export class LevelSelectScene extends Phaser.Scene {
  private data_: LevelSelectData = {};

  constructor() {
    super('LevelSelect');
  }

  init(data: LevelSelectData): void {
    this.data_ = data ?? {};
  }

  create(): void {
    audio.music('menu');
    const cleared = (this.data_.save ?? createSaveStore(null)).get().cleared;
    const touch = this.data_.touch ?? false;
    if (this.textures.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540).setAlpha(0.45);
    const opened = WORLDS.filter((w) => isUnlocked(w[0], cleared)).length;
    const world = Math.min(Math.max(this.data_.world ?? opened, 1), WORLDS.length);
    this.add.text(480, 70, `世界 ${world}  ${WORLD_NAMES[world - 1]}`, { fontSize: '36px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5);
    const go = (w: number): void => {
      if (w >= 1 && w <= WORLDS.length && w !== world) this.scene.restart({ ...this.data_, world: w });
    };
    if (world > 1) smallButton(this, 100, 70, touch ? `← 世界 ${world - 1}` : `← 世界 ${world - 1}(Q)`, () => go(world - 1), 160);
    if (world < WORLDS.length) smallButton(this, 860, 70, touch ? `世界 ${world + 1} →` : `世界 ${world + 1} →(E)`, () => go(world + 1), 160);

    const levels = WORLDS[world - 1].map((id) => ({ id, unlocked: isUnlocked(id, cleared), best: cleared[id] ?? null }));
    levels.forEach((l, i) => {
      const x = 480 + (i - 1) * CARD_GAP;
      const card = this.textures.exists('ui-panel')
        ? this.add.nineslice(x, CARD_Y, 'ui-panel', undefined, CARD_W, CARD_H, 24, 24, 24, 24)
        : this.add.rectangle(x, CARD_Y, CARD_W, CARD_H, 0x3b3366);
      card.setAlpha(l.unlocked ? 1 : 0.5).setInteractive({ useHandCursor: l.unlocked });
      card.on('pointerdown', () => (l.unlocked ? this.play(l.id, true) : this.shake(card)));
      const ink = l.unlocked ? '#3a2a5a' : '#6f6a8a';
      this.add.text(x, CARD_Y - 75, levelNumber(l.id), { fontSize: '40px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y - 20, LEVELS[l.id].name, { fontSize: '22px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y + 18, TIME_OF_DAY[i], { fontSize: '18px', color: ink }).setOrigin(0.5);
      const prev = previousLevel(l.id);
      const status = !l.unlocked && prev
        ? `鎖住:先通過 ${levelNumber(prev)}`
        : l.best !== null
          ? `最佳 ${formatDuration(l.best)}`
          : '還沒通關';
      this.add.text(x, CARD_Y + 62, status, { fontSize: '18px', color: l.unlocked ? '#b0477a' : ink }).setOrigin(0.5);
      if (!touch) this.add.text(x, CARD_Y + CARD_H / 2 + 24, `按 ${i + 1}`, { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);
    });
    // 手機沒有 Esc,一定要有按鈕回主頁。
    menuButton(this, 480, 488, touch ? '回到主頁' : '回到主頁(Esc)', () => this.back());

    onMenuKey(this, (e) => {
      if (e.code === 'Escape') this.back();
      if (PREV_WORLD.has(e.code)) go(world - 1);
      if (NEXT_WORLD.has(e.code)) go(world + 1);
      const i = /^Digit([1-3])$/.exec(e.code);
      if (i) {
        const l = levels[Number(i[1]) - 1];
        this.play(l.id, l.unlocked);
      }
    });
    window.__GK__ = { ready: true, screen: 'level-select', levels, world };
  }

  private play(id: LevelId, unlocked: boolean): void {
    if (unlocked) startLevel(this, { ...this.data_, level: id });
  }

  /** 點到鎖住的關卡:左右晃一下。 */
  private shake(card: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    this.tweens.add({ targets: card, x: card.x + 8, duration: 50, yoyo: true, repeat: 2 });
  }

  private back(): void {
    const { mode: _mode, world: _world, ...rest } = this.data_;
    this.scene.start('ModeSelect', rest);
  }
}
