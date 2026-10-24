import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { createSaveStore } from '../game/save';
import { WORLDS, WORLD_NAMES, isUnlocked, levelNumber, previousLevel } from '../game/progress';
import { formatDuration } from '../game/runStats';
import { LEVELS } from '../levels';
import type { LevelId } from '../levels/levelDef';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { TEST_TOOLS, setTestMode, testModeOn } from '../config/testTools';
import { menuButton, smallButton } from './menuButton';
import { pick, tr, type Text } from '../i18n/lang';

const CARD_W = 250;
const CARD_H = 230;
const CARD_Y = 290;
const CARD_GAP = 280;
/** 每個世界三小關的時段(一個世界玩完剛好過了一天)。 */
const TIME_OF_DAY: readonly Text[] = [
  { zh: '白天', en: 'Day' },
  { zh: '黃昏', en: 'Dusk' },
  { zh: '晚上 → 深夜', en: 'Night → Midnight' },
];
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
    this.add.text(480, 70, tr(`世界 ${world}  ${pick(WORLD_NAMES[world - 1])}`, `World ${world}  ${pick(WORLD_NAMES[world - 1])}`), { fontSize: '36px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5);
    const go = (w: number): void => {
      if (w >= 1 && w <= WORLDS.length && w !== world) this.scene.restart({ ...this.data_, world: w });
    };
    if (world > 1) smallButton(this, 100, 70, tr(`← 世界 ${world - 1}`, `← World ${world - 1}`) + (touch ? '' : '(Q)'), () => go(world - 1), 160);
    if (world < WORLDS.length) smallButton(this, 860, 70, tr(`世界 ${world + 1} →`, `World ${world + 1} →`) + (touch ? '' : '(E)'), () => go(world + 1), 160);

    const testMode = testModeOn();
    const levels = WORLDS[world - 1].map((id) => ({ id, unlocked: testMode || isUnlocked(id, cleared), best: cleared[id] ?? null }));
    levels.forEach((l, i) => {
      const x = 480 + (i - 1) * CARD_GAP;
      const card = this.textures.exists('ui-panel')
        ? this.add.nineslice(x, CARD_Y, 'ui-panel', undefined, CARD_W, CARD_H, 24, 24, 24, 24)
        : this.add.rectangle(x, CARD_Y, CARD_W, CARD_H, 0x3b3366);
      card.setAlpha(l.unlocked ? 1 : 0.5).setInteractive({ useHandCursor: l.unlocked });
      card.on('pointerdown', () => (l.unlocked ? this.play(l.id, true) : this.shake(card)));
      const ink = l.unlocked ? '#3a2a5a' : '#6f6a8a';
      this.add.text(x, CARD_Y - 75, levelNumber(l.id), { fontSize: '40px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y - 20, pick(LEVELS[l.id].name), { fontSize: '22px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y + 18, pick(TIME_OF_DAY[i]), { fontSize: '18px', color: ink }).setOrigin(0.5);
      const prev = previousLevel(l.id);
      const status = testMode
        ? tr('測試模式開放', 'Open in test mode')
        : !l.unlocked && prev
        ? tr(`鎖住:先通過 ${levelNumber(prev)}`, `Locked: clear ${levelNumber(prev)} first`)
        : l.best !== null
          ? tr(`最佳 ${formatDuration(l.best)}`, `Best ${formatDuration(l.best)}`)
          : tr('還沒通關', 'Not cleared yet');
      this.add.text(x, CARD_Y + 62, status, { fontSize: '18px', color: l.unlocked ? '#b0477a' : ink }).setOrigin(0.5);
      if (!touch) this.add.text(x, CARD_Y + CARD_H / 2 + 24, testMode ? tr(`按 ${i + 1}(Shift+${i + 1} 打關主)`, `Press ${i + 1} (Shift+${i + 1}: boss)`) : tr(`按 ${i + 1}`, `Press ${i + 1}`), { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);
      if (testMode && LEVELS[l.id].boss) smallButton(this, x, CARD_Y + 96, tr('直接打關主', 'Go to boss'), () => this.play(l.id, true, true), 150);
    });
    // 測試工具:公開上市前關掉(src/config/testTools.ts)。
    if (TEST_TOOLS) {
      const label = (on: boolean): string => tr(`測試模式:${on ? '開' : '關'}`, `Test mode: ${on ? 'on' : 'off'}`) + (touch ? '' : '(T)');
      smallButton(this, 110, 488, label(testMode), () => this.toggleTest(), 190);
    }
    // 手機沒有 Esc,一定要有按鈕回主頁。
    menuButton(this, 480, 488, tr('回到主頁', 'Main menu') + (touch ? '' : '(Esc)'), () => this.back());

    onMenuKey(this, (e) => {
      if (e.code === 'Escape') this.back();
      if (PREV_WORLD.has(e.code)) go(world - 1);
      if (NEXT_WORLD.has(e.code)) go(world + 1);
      if (e.code === 'KeyT' && TEST_TOOLS) this.toggleTest();
      const i = /^Digit([1-3])$/.exec(e.code);
      if (i) {
        const l = levels[Number(i[1]) - 1];
        this.play(l.id, l.unlocked, testMode && e.shiftKey);
      }
    });
    window.__GK__ = { ready: true, screen: 'level-select', levels, world, testMode };
  }

  /** atBoss(測試模式):從最後一個檢查點出發,戰鬥區當作已經清完,走幾步就是關主。 */
  private play(id: LevelId, unlocked: boolean, atBoss = false): void {
    if (!unlocked) return;
    const level = LEVELS[id];
    const boss = atBoss && level.boss ? { checkpointX: Math.max(...level.checkpoints), arenasCleared: level.arenas.length } : {};
    this.scene.start('TestRange', { ...this.data_, level: id, ...boss });
  }

  private toggleTest(): void {
    setTestMode(!testModeOn());
    this.scene.restart(this.data_);
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
