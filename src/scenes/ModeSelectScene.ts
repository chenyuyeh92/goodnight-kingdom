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
  /** 「故事」的選擇(開場/結局)正在顯示。 */
  private storyChoice = false;
  private closeStoryChoice: (() => void) | null = null;

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
    this.storyChoice = false;
    this.closeStoryChoice = null;
    onMenuKey(this, (e) => {
      if (this.storyChoice) {
        const back = { scene: 'ModeSelect', data: this.data_ };
        if (e.code === 'KeyO') this.playStory(back, 'opening');
        else if (e.code === 'KeyE') this.playStory(back, 'ending');
        else if (e.code === 'Escape' || e.code === 'Digit6') this.closeStoryChoice?.();
        return;
      }
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
    else if (choice === 'story') this.storyMenu();
    else {
      const next = { scene: 'LevelSelect', data: { ...this.data_, mode: choice } };
      // 第一次開始遊戲先播開場。
      const seen = this.data_.save?.get().story.opening ?? false;
      if (this.data_.stories !== false && !seen) this.playStory(next);
      else this.scene.start(next.scene, next.data);
    }
  }

  private playStory(then: StoryData['then'], story: StoryData['story'] = 'opening'): void {
    const data: StoryData = { ...this.data_, story, then };
    this.scene.start('Story', data);
  }

  /** 「故事」:看過結局後可以選開場或結局;還沒看過就直接播開場。 */
  private storyMenu(): void {
    const back = { scene: 'ModeSelect', data: this.data_ };
    if (!(this.data_.save?.get().story.ending ?? false)) {
      this.playStory(back);
      return;
    }
    if (this.storyChoice) return;
    const shade = this.add.rectangle(480, 270, 960, 540, 0x0d0b24, 0.75).setDepth(20).setInteractive();
    const title = this.add.text(480, 200, '要看哪一段故事?', { fontSize: '28px', color: '#f3e9d2' }).setOrigin(0.5).setDepth(21);
    const option = (x: number, label: string, story: StoryData['story']): Phaser.GameObjects.Text =>
      this.add
        .text(x, 290, label, { fontSize: '26px', color: '#3a2a5a', backgroundColor: '#f3e9d2', padding: { x: 18, y: 10 } })
        .setOrigin(0.5)
        .setDepth(21)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.playStory(back, story));
    const hint = this.add.text(480, 370, '點旁邊或按 Esc 關掉', { fontSize: '18px', color: '#f3e9d2' }).setOrigin(0.5).setDepth(21);
    const objs = [shade, title, hint, option(380, '開場(O)', 'opening'), option(580, '結局(E)', 'ending')];
    this.closeStoryChoice = () => {
      objs.forEach((o) => o.destroy());
      this.storyChoice = false;
      this.closeStoryChoice = null;
      window.__GK__ = { ...window.__GK__, ready: true, storyChoice: false };
    };
    shade.on('pointerup', () => this.closeStoryChoice?.());
    this.storyChoice = true;
    window.__GK__ = { ...window.__GK__, ready: true, storyChoice: true };
  }
}
