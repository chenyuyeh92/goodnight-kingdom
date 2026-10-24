import Phaser from 'phaser';
import { audio } from '../audio/audio';
import type { PlayMode } from '../input/playMode';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { menuButton } from './menuButton';
import type { StoryData } from './StoryScene';

type Choice = PlayMode | 'backpack' | 'draw' | 'settings' | 'story';

const BUTTONS: ReadonlyArray<{ choice: Choice; label: string; art: string; code: string }> = [
  { choice: 'single', label: '開始遊戲', art: 'btn-start', code: 'Digit1' },
  { choice: 'duo', label: '雙人遊戲', art: 'btn-duo', code: 'Digit2' },
  { choice: 'draw', label: '畫你的守衛', art: 'btn-draw', code: 'Digit3' },
  { choice: 'backpack', label: '背包', art: 'btn-backpack', code: 'Digit4' },
  { choice: 'settings', label: '設定', art: 'btn-settings', code: 'Digit5' },
];
const FIRST_BUTTON_Y = 226;
const BUTTON_GAP = 62;
/** 五顆按鈕排得下:按鈕縮成 0.9 倍。 */
const BUTTON_SCALE = 0.9;
/** 主頁右下角睡著的魔物(裝飾),輕輕上下飄。 */
const SLEEPERS = [
  { key: 'clockbug-sleep', x: 700, y: 500 },
  { key: 'coffee-bean-sleep', x: 770, y: 500 },
  { key: 'night-bat-sleep', x: 850, y: 440 },
] as const;

export class ModeSelectScene extends Phaser.Scene {
  private data_: TestRangeData = {};

  constructor() {
    super('ModeSelect');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
  }

  create(): void {
    audio.music('menu');
    const tex = this.textures;
    if (tex.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540);
    if (tex.exists('ui-logo')) this.add.image(480, 110, 'ui-logo').setScale(0.3);
    else this.add.text(480, 110, '晚安王國', { fontSize: '56px', color: '#f3e9d2' }).setOrigin(0.5);
    if (tex.exists('ui-guard')) this.add.image(150, 545, 'ui-guard').setOrigin(0.5, 1).setScale(0.5);
    for (const z of SLEEPERS) {
      if (!tex.exists(z.key)) continue;
      const img = this.add.image(z.x, z.y, z.key).setOrigin(0.5, 1).setScale(1.3);
      this.tweens.add({ targets: img, y: z.y - 6, duration: 1400 + z.x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    BUTTONS.forEach((b, i) => {
      const y = FIRST_BUTTON_Y + i * BUTTON_GAP;
      (menuButton(this, 480, y, b.label, () => this.choose(b.choice), b.art) as Phaser.GameObjects.Image).setScale(BUTTON_SCALE);
      this.add.text(620, y, `${i + 1}`, { fontSize: '18px', color: '#f3e9d2', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);
    });
    // 右上角小小的「故事」:重看開場。
    (menuButton(this, 860, 40, '故事', () => this.choose('story')) as Phaser.GameObjects.Image).setScale(0.55);
    this.add.text(930, 40, '6', { fontSize: '18px', color: '#f3e9d2', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);
    onMenuKey(this, (e) => {
      if (e.code === 'Digit6') this.choose('story');
      const b = BUTTONS.find((x) => x.code === e.code);
      if (b) this.choose(b.choice);
    });
    const saveOk = this.data_.save?.ok() ?? false;
    if (!saveOk) {
      this.add
        .text(480, 520, '注意:這個瀏覽器無法存檔(例如無痕模式),背包重新整理後會不見。', { fontSize: '16px', color: '#ffb3c7', stroke: '#2b2a6b', strokeThickness: 4 })
        .setOrigin(0.5);
    }
    window.__GK__ = { ready: true, screen: 'mode-select', saveOk };
  }

  private choose(choice: Choice): void {
    if (choice === 'backpack') this.scene.start('Backpack', this.data_);
    else if (choice === 'draw') this.scene.start('GuardRoom', this.data_);
    else if (choice === 'settings') this.scene.start('Settings', this.data_);
    else if (choice === 'story') this.playStory({ scene: 'ModeSelect', data: this.data_ });
    else {
      const next = { scene: 'LevelSelect', data: { ...this.data_, mode: choice } };
      // 第一次開始遊戲先播開場。
      const seen = this.data_.save?.get().story.opening ?? false;
      if (this.data_.stories !== false && !seen) this.playStory(next);
      else this.scene.start(next.scene, next.data);
    }
  }

  private playStory(then: StoryData['then']): void {
    const data: StoryData = { ...this.data_, story: 'opening', then };
    this.scene.start('Story', data);
  }
}
