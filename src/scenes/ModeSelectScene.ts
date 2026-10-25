import Phaser from 'phaser';
import { audio } from '../audio/audio';
import type { PlayMode } from '../input/playMode';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { menuButton } from './menuButton';
import type { StoryData } from './StoryScene';
import { lang, pick, tr, type Text } from '../i18n/lang';
import { endOnline } from '../net/session';
import { fitWidth } from '../ui/fitText';

type Choice = PlayMode | 'backpack' | 'draw' | 'settings';

/** 按鈕圖上的字是中文;英文版用一般按鈕加上英文字。 */
const BUTTONS: ReadonlyArray<{ choice: Choice; label: Text; art: string; code: string }> = [
  { choice: 'single', label: { zh: '開始遊戲', en: 'Start' }, art: 'btn-start', code: 'Digit1' },
  { choice: 'duo', label: { zh: '雙人遊戲', en: 'Two Players' }, art: 'btn-duo', code: 'Digit2' },
  { choice: 'draw', label: { zh: '畫你的守衛', en: 'Draw Your Guard' }, art: 'btn-draw', code: 'Digit3' },
  { choice: 'backpack', label: { zh: '背包', en: 'Backpack' }, art: 'btn-backpack', code: 'Digit4' },
  { choice: 'settings', label: { zh: '設定', en: 'Settings' }, art: 'btn-settings', code: 'Digit5' },
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
  /** 正在顯示的「雙人遊戲」選擇(同一台或連線):按鍵對應的動作與關掉的方法。 */
  private choice: { keys: Map<string, () => void>; close: () => void } | null = null;

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
    else this.add.text(480, 110, tr('晚安王國', 'Goodnight Kingdom'), { fontSize: '56px', color: '#f3e9d2' }).setOrigin(0.5);
    if (tex.exists('ui-guard')) this.add.image(150, 545, 'ui-guard').setOrigin(0.5, 1).setScale(0.5);
    for (const z of SLEEPERS) {
      if (!tex.exists(z.key)) continue;
      const img = this.add.image(z.x, z.y, z.key).setOrigin(0.5, 1).setScale(1.3);
      this.tweens.add({ targets: img, y: z.y - 6, duration: 1400 + z.x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    BUTTONS.forEach((b, i) => {
      const y = FIRST_BUTTON_Y + i * BUTTON_GAP;
      (menuButton(this, 480, y, pick(b.label), () => this.choose(b.choice), lang() === 'zh' ? b.art : null) as Phaser.GameObjects.Image).setScale(BUTTON_SCALE);
      this.add.text(620, y, `${i + 1}`, { fontSize: '18px', color: '#f3e9d2', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);
    });
    this.choice = null;
    // 回到主選單就結束線上房間(朋友那邊會顯示連線中斷)。
    endOnline();
    onMenuKey(this, (e) => {
      if (this.choice) {
        if (e.code === 'Escape') this.choice.close();
        else this.choice.keys.get(e.code)?.();
        return;
      }
      const b = BUTTONS.find((x) => x.code === e.code);
      if (b) this.choose(b.choice);
    });
    const saveOk = this.data_.save?.ok() ?? false;
    if (!saveOk) {
      this.add
        .text(480, 520, tr('注意:這個瀏覽器無法存檔(例如無痕模式),背包重新整理後會不見。', 'Note: this browser cannot save (e.g. private mode). Progress is lost when you reload.'), { fontSize: '16px', color: '#ffb3c7', stroke: '#2b2a6b', strokeThickness: 4 })
        .setOrigin(0.5);
    }
    window.__GK__ = {
      ready: true,
      screen: 'mode-select',
      saveOk,
      lang: lang(),
      music: audio.currentTrack(),
      // 錄音檔是非同步載入,用 getter 讓測試讀到最新狀態。
      get musicSource() {
        return audio.musicSource;
      },
    };
  }

  private choose(choice: Choice): void {
    if (choice === 'backpack') this.scene.start('Backpack', this.data_);
    else if (choice === 'draw') this.scene.start('GuardRoom', this.data_);
    else if (choice === 'settings') this.scene.start('Settings', this.data_);
    else if (choice === 'duo') this.duoMenu();
    else this.startPlaying(choice);
  }

  private startPlaying(mode: PlayMode): void {
    const next = { scene: 'LevelSelect', data: { ...this.data_, mode } };
    // 第一次開始遊戲先播開場。
    const seen = this.data_.save?.get().story.opening ?? false;
    if (this.data_.stories !== false && !seen) this.playStory(next);
    else this.scene.start(next.scene, next.data);
  }

  private playStory(then: StoryData['then'], story: StoryData['story'] = 'opening'): void {
    const data: StoryData = { ...this.data_, story, then };
    this.scene.start('Story', data);
  }

  /** 「雙人遊戲」:同一台裝置一起玩,或兩支手機連線(一台開房間、一台加入)。 */
  private duoMenu(): void {
    const online = (role: 'host' | 'guest'): void => void this.scene.start('Online', { ...this.data_, role });
    this.showChoice(tr('怎麼一起玩?', 'How do you want to play together?'), [
      { label: tr('同一台裝置(1)', 'Same device (1)'), code: 'Digit1', run: () => this.startPlaying('duo') },
      { label: tr('開房間(2)', 'Open a room (2)'), code: 'Digit2', run: () => online('host') },
      { label: tr('加入房間(3)', 'Join a room (3)'), code: 'Digit3', run: () => online('guest') },
    ]);
  }

  /** 蓋在主選單上的選擇:點選項或按對應的鍵;點旁邊或按 Esc 關掉。 */
  private showChoice(heading: string, options: readonly { label: string; code: string; run: () => void }[]): void {
    if (this.choice) return;
    const shade = this.add.rectangle(480, 270, 960, 540, 0x0d0b24, 0.75).setDepth(20).setInteractive();
    const title = this.add.text(480, 200, heading, { fontSize: '28px', color: '#f3e9d2' }).setOrigin(0.5).setDepth(21);
    const hint = this.add.text(480, 370, tr('點旁邊或按 Esc 關掉', 'Tap outside or press Esc to close'), { fontSize: '18px', color: '#f3e9d2' }).setOrigin(0.5).setDepth(21);
    const gap = options.length > 2 ? 250 : 200;
    const buttons = options.map((o, i) =>
      fitWidth(
        this.add
          .text(480 + (i - (options.length - 1) / 2) * gap, 290, o.label, { fontSize: '26px', color: '#3a2a5a', backgroundColor: '#f3e9d2', padding: { x: 18, y: 10 } })
          .setOrigin(0.5)
          .setDepth(21)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', o.run),
        gap - 16,
      ),
    );
    const close = (): void => {
      [shade, title, hint, ...buttons].forEach((o) => o.destroy());
      this.choice = null;
      window.__GK__ = { ...window.__GK__, ready: true, onlineChoice: false };
    };
    shade.on('pointerup', close);
    this.choice = { keys: new Map(options.map((o) => [o.code, o.run])), close };
    window.__GK__ = { ...window.__GK__, ready: true, onlineChoice: true };
  }
}
