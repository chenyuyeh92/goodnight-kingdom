import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { VOLUME_STEPS, type AudioSettings } from '../audio/settings';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { smallButton } from './menuButton';
import { safeLocalStorage } from '../config/storage';
import { lang, pick, setLang, tr, type Text } from '../i18n/lang';
import { isNativeApp, openPage } from '../platform/native';
import { downloadBackup, parseBackup, pickBackupFile, restoreBackup, type BackupStorage } from '../game/backup';

type Row = 'music' | 'sfx' | 'muted' | 'lang' | 'export' | 'import' | 'clear' | 'back';
const ROW_Y: Record<Row, number> = { music: 120, sfx: 175, muted: 230, lang: 285, export: 340, import: 340, clear: 395, back: 460 };
/** 匯出/匯入存檔(換電腦時帶走進度,2026-10-26):網頁版、電腦版有;App 版的 WebView 不能下載檔案,先不放。 */
const BACKUP_X = { export: 380, import: 580 } as const;
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
  private rows: readonly Row[] = [];

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
      this.add.text(200, y, kind === 'music' ? tr('音樂', 'Music') : tr('音效', 'Sound FX'), { fontSize: '24px', color: '#f3e9d2', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0, 0.5);
      smallButton(this, 340, y, '−', () => this.adjust(kind, -1), 60);
      this.bars[kind] = this.add.text(380, y, '', { fontSize: '24px', color: '#f8e08e', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0, 0.5);
      smallButton(this, 700, y, '+', () => this.adjust(kind, 1), 60);
    }
    this.mutedButton = smallButton(this, 480, ROW_Y.muted, '', () => this.toggleMute(), 240);
    smallButton(this, 480, ROW_Y.lang, tr('語言:中文', 'Language: English'), () => this.toggleLang(), 240);
    const backup = !isNativeApp() && safeLocalStorage() !== null;
    this.rows = backup ? ['music', 'sfx', 'muted', 'lang', 'export', 'import', 'clear', 'back'] : ['music', 'sfx', 'muted', 'lang', 'clear', 'back'];
    if (backup) {
      smallButton(this, BACKUP_X.export, ROW_Y.export, tr('匯出存檔', 'Export save'), () => this.exportSave(), 180);
      smallButton(this, BACKUP_X.import, ROW_Y.import, tr('匯入存檔', 'Import save'), () => this.importSave(), 180);
    }
    this.clearButton = smallButton(this, 480, ROW_Y.clear, tr('清除所有存檔', 'Erase all saves'), () => this.clearSaves(), 240);
    this.message = this.add.text(480, ROW_Y.clear + 34, '', { fontSize: '16px', color: '#ffb3c7', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);
    smallButton(this, 480, ROW_Y.back, tr('返回(Esc)', 'Back (Esc)'), () => this.back(), 200);
    PAGES.forEach((p, i) => {
      smallButton(this, 300 + i * 180, 515, pick(p.label), () => openPage(p.file), 160);
    });

    onMenuKey(this, (e) => {
      const rows = this.rows;
      const i = rows.indexOf(this.row);
      if (e.code === 'Escape') this.back();
      else if (UP.has(e.code)) this.row = rows[(i + rows.length - 1) % rows.length];
      else if (DOWN.has(e.code)) this.row = rows[(i + 1) % rows.length];
      else if ((LEFT.has(e.code) || RIGHT.has(e.code)) && (this.row === 'export' || this.row === 'import')) this.row = this.row === 'export' ? 'import' : 'export';
      else if ((LEFT.has(e.code) || RIGHT.has(e.code)) && (this.row === 'music' || this.row === 'sfx')) this.adjust(this.row, LEFT.has(e.code) ? -1 : 1);
      else if (OK.has(e.code)) this.activate();
      this.refresh();
    });
    this.refresh();
  }

  private activate(): void {
    if (this.row === 'muted') this.toggleMute();
    else if (this.row === 'lang') this.toggleLang();
    else if (this.row === 'export') this.exportSave();
    else if (this.row === 'import') this.importSave();
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

  /** 匯出:把通關紀錄、背包、畫的守衛存成一個檔案(換電腦時到新電腦按「匯入存檔」)。 */
  private exportSave(): void {
    const s = safeLocalStorage() as BackupStorage | null;
    if (!s) return;
    downloadBackup(s);
    this.message.setText(tr('存檔已下載。換電腦時,在新電腦按「匯入存檔」選這個檔案', 'Save downloaded. On your new computer, press "Import save" and choose this file'));
  }

  /** 匯入:選一個匯出的存檔,確定後整份換掉這台裝置的進度,重新打開遊戲。 */
  private importSave(): void {
    const s = safeLocalStorage() as BackupStorage | null;
    if (!s) return;
    pickBackupFile((text) => {
      const b = parseBackup(text);
      if (!b) {
        this.message.setText(tr('這不是晚安王國的存檔檔案', 'That is not a Goodnight Kingdom save file'));
        return;
      }
      if (!window.confirm(tr('匯入以後,這台裝置現在的進度會被換掉。確定要匯入嗎?', 'Importing replaces the progress on this device. Import now?'))) return;
      if (!restoreBackup(s, b)) {
        this.message.setText(tr('匯入失敗(這台裝置的空間不夠),原本的進度沒有改', 'Import failed (not enough space on this device). Your progress was not changed'));
        return;
      }
      window.location.reload();
    });
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
    const x = this.row === 'music' || this.row === 'sfx' ? 170 : this.row === 'export' || this.row === 'import' ? BACKUP_X[this.row] - 110 : 330;
    this.cursor.setY(ROW_Y[this.row]).setX(x);
    window.__GK__ = { ready: true, screen: 'settings', settings: { ...this.settings }, settingsRow: this.row, lang: lang() };
  }

  private back(): void {
    this.scene.start('ModeSelect', this.data_);
  }
}
