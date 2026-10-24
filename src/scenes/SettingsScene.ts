import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { VOLUME_STEPS, type AudioSettings } from '../audio/settings';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { smallButton } from './menuButton';
import { safeLocalStorage } from '../config/storage';
import { lang, pick, setLang, tr, type Text } from '../i18n/lang';

type Row = 'music' | 'sfx' | 'muted' | 'lang' | 'clear' | 'back';
const ROWS: readonly Row[] = ['music', 'sfx', 'muted', 'lang', 'clear', 'back'];
const ROW_Y: Record<Row, number> = { music: 130, sfx: 190, muted: 250, lang: 310, clear: 370, back: 455 };
const UP = new Set(['KeyW', 'ArrowUp']);
const DOWN = new Set(['KeyS', 'ArrowDown']);
const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const OK = new Set(['Enter', 'Space', 'KeyC', 'Comma']);
/** 說明頁(跟遊戲放在同一個網站,開新分頁)。 */
const PAGES: readonly { label: Text; file: string }[] = [
  { label: { zh: '支援與說明', en: 'Help' }, file: 'support.html' },
  { label: { zh: '隱私權政策', en: 'Privacy' }, file: 'privacy.html' },
  { label: { zh: '授權', en: 'Licenses' }, file: 'licenses.html' },
];
/** 換語言後回到設定畫面時,游標停在語言那一列。 */
let rowAfterRestart: Row | null = null;
/** 清除存檔要按兩次。 */
const CONFIRM_MS = 3000;

/** 設定:音樂與音效音量、全部靜音、清除存檔。鍵盤上下選、左右調;手機點按鈕。 */
export class SettingsScene extends Phaser.Scene {
  private data_: TestRangeData = {};
  private settings!: AudioSettings;
  private row: Row = 'music';
  private bars: Partial<Record<'music' | 'sfx', Phaser.GameObjects.Text>> = {};
  private mutedButton!: ReturnType<typeof smallButton>;
  private clearButton!: ReturnType<typeof smallButton>;
  private cursor!: Phaser.GameObjects.Text;
  private confirmClearUntil = 0;
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('Settings');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
    this.row = rowAfterRestart ?? 'music';
    rowAfterRestart = null;
    this.confirmClearUntil = 0;
  }

  create(): void {
    audio.music('menu');
    this.settings = audio.getSettings();
    if (this.textures.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540).setAlpha(0.35);
    this.add.text(480, 60, tr('設定', 'Settings'), { fontSize: '36px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5);
    this.cursor = this.add.text(150, 0, '▶', { fontSize: '24px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);

    for (const kind of ['music', 'sfx'] as const) {
      const y = ROW_Y[kind];
      this.add.text(200, y, kind === 'music' ? tr('音樂', 'Music') : tr('音效', 'Sound'), { fontSize: '24px', color: '#f3e9d2', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0, 0.5);
      smallButton(this, 340, y, '−', () => this.adjust(kind, -1), 60);
      this.bars[kind] = this.add.text(380, y, '', { fontSize: '24px', color: '#f8e08e', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0, 0.5);
      smallButton(this, 700, y, '+', () => this.adjust(kind, 1), 60);
    }
    this.mutedButton = smallButton(this, 480, ROW_Y.muted, '', () => this.toggleMute(), 240);
    smallButton(this, 480, ROW_Y.lang, tr('語言:中文', 'Language: English'), () => this.toggleLang(), 240);
    this.clearButton = smallButton(this, 480, ROW_Y.clear, tr('清除所有存檔', 'Erase all saves'), () => this.clearSaves(), 240);
    this.message = this.add.text(480, ROW_Y.clear + 34, '', { fontSize: '16px', color: '#ffb3c7', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);
    smallButton(this, 480, ROW_Y.back, tr('返回(Esc)', 'Back (Esc)'), () => this.back(), 200);
    PAGES.forEach((p, i) => {
      smallButton(this, 300 + i * 180, 515, pick(p.label), () => window.open(`${import.meta.env.BASE_URL}${p.file}`, '_blank', 'noopener'), 160);
    });

    onMenuKey(this, (e) => {
      const i = ROWS.indexOf(this.row);
      if (e.code === 'Escape') this.back();
      else if (UP.has(e.code)) this.row = ROWS[(i + ROWS.length - 1) % ROWS.length];
      else if (DOWN.has(e.code)) this.row = ROWS[(i + 1) % ROWS.length];
      else if ((LEFT.has(e.code) || RIGHT.has(e.code)) && (this.row === 'music' || this.row === 'sfx')) this.adjust(this.row, LEFT.has(e.code) ? -1 : 1);
      else if (OK.has(e.code)) this.activate();
      this.refresh();
    });
    this.refresh();
  }

  private activate(): void {
    if (this.row === 'muted') this.toggleMute();
    else if (this.row === 'lang') this.toggleLang();
    else if (this.row === 'clear') this.clearSaves();
    else if (this.row === 'back') this.back();
  }

  private adjust(kind: 'music' | 'sfx', d: number): void {
    this.settings = { ...this.settings, [kind]: Math.min(VOLUME_STEPS, Math.max(0, this.settings[kind] + d)) };
    audio.setSettings(this.settings);
    audio.preview();
    this.refresh();
  }

  private toggleMute(): void {
    this.settings = { ...this.settings, muted: !this.settings.muted };
    audio.setSettings(this.settings);
    this.refresh();
  }

  /** 中文 ⇄ 英文:記在這台裝置,畫面重新畫一次。 */
  private toggleLang(): void {
    setLang(lang() === 'zh' ? 'en' : 'zh', safeLocalStorage());
    document.documentElement.lang = lang() === 'zh' ? 'zh-Hant' : 'en';
    rowAfterRestart = 'lang';
    this.scene.restart(this.data_);
  }

  private clearSaves(): void {
    if (this.time.now > this.confirmClearUntil) {
      this.confirmClearUntil = this.time.now + CONFIRM_MS;
      this.clearButton.setLabel(tr('再按一次清除', 'Press again to erase'));
      this.message.setText(tr('背包、通關紀錄、畫的守衛都會刪掉', 'Your backpack, cleared levels and drawn guards will be deleted'));
      this.time.delayedCall(CONFIRM_MS, () => {
        if (this.time.now < this.confirmClearUntil) return;
        this.confirmClearUntil = 0;
        this.clearButton.setLabel(tr('清除所有存檔', 'Erase all saves'));
        this.message.setText('');
      });
      return;
    }
    this.data_.save?.clear();
    this.data_.guards?.clear();
    this.confirmClearUntil = 0;
    this.clearButton.setLabel(tr('清除所有存檔', 'Erase all saves'));
    this.message.setText(tr('已清除', 'Erased'));
    this.refresh();
  }

  private refresh(): void {
    for (const kind of ['music', 'sfx'] as const) {
      const v = this.settings[kind];
      this.bars[kind]?.setText(`${'▮'.repeat(v)}${'▯'.repeat(VOLUME_STEPS - v)}  ${v}`);
    }
    this.mutedButton.setLabel(this.settings.muted ? tr('全部靜音:開', 'Mute all: on') : tr('全部靜音:關', 'Mute all: off'));
    if (this.time.now > this.confirmClearUntil && this.confirmClearUntil !== 0) {
      this.confirmClearUntil = 0;
      this.clearButton.setLabel(tr('清除所有存檔', 'Erase all saves'));
    }
    this.cursor.setY(ROW_Y[this.row]).setX(this.row === 'music' || this.row === 'sfx' ? 170 : 330);
    window.__GK__ = { ready: true, screen: 'settings', settings: { ...this.settings }, settingsRow: this.row, lang: lang() };
  }

  private back(): void {
    this.scene.start('ModeSelect', this.data_);
  }
}
