import Phaser from 'phaser';
import { audio } from '../audio/audio';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { smallButton } from './menuButton';
import { tr } from '../i18n/lang';
import { CODE_LEN, cleanCode, makeRoomCode } from '../net/room';
import { openSignal } from '../net/signal';
import { GuestLink, HostLink, type HostState } from '../net/link';
import { endOnline, online } from '../net/session';
import { mountGuestView } from '../net/guestView';

export interface OnlineData extends TestRangeData {
  role: 'host' | 'guest';
}

/** 號碼剛好有人用時換號碼,最多試幾次。 */
const MAX_CODE_TRIES = 5;
/** 遊戲畫面每秒傳幾張給朋友。 */
const STREAM_FPS = 30;
const TEXT = { color: '#f3e9d2', stroke: '#2b2a6b', strokeThickness: 4 };

/** 測試用:網址加 ?net=local 時,同一個瀏覽器的分頁直接互傳,不連外部網路。 */
function localNet(): boolean {
  return new URLSearchParams(location.search).get('net') === 'local';
}

/**
 * 線上雙人:
 * 房主開房間 → 顯示 4 位數號碼,等朋友加入 → 連上後進選關,房主這台跑遊戲,畫面傳給朋友。
 * 朋友加入房間 → 輸入號碼 → 整個畫面換成房主傳來的遊戲畫面,自己的按鈕操控玩家 B。
 */
export class OnlineScene extends Phaser.Scene {
  private data_!: OnlineData;
  private status!: Phaser.GameObjects.Text;
  private code: string | null = null;
  private state = '';
  private typed = '';
  private codeText: Phaser.GameObjects.Text | null = null;
  private left = false;
  /** 朋友已經按了加入(之後畫面交給 guestView)。 */
  private joined = false;

  constructor() {
    super('Online');
  }

  init(data: OnlineData): void {
    this.data_ = data;
    this.code = null;
    this.state = '';
    this.typed = '';
    this.codeText = null;
    this.left = false;
    this.joined = false;
  }

  create(): void {
    audio.music('menu');
    if (this.textures.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540).setAlpha(0.35);
    const host = this.data_.role === 'host';
    this.add.text(480, 60, host ? tr('開房間', 'Open a Room') : tr('加入房間', 'Join a Room'), { fontSize: '36px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5);
    this.status = this.add.text(480, 440, '', { fontSize: '20px', align: 'center', wordWrap: { width: 760 }, ...TEXT }).setOrigin(0.5);
    smallButton(this, 110, 500, tr('返回(Esc)', 'Back (Esc)'), () => this.back(), 180);
    onMenuKey(this, (e) => {
      if (this.joined) return;
      if (e.code === 'Escape') this.back();
      else if (host) return;
      else if (/^(Digit|Numpad)\d$/.test(e.code)) this.press(e.code.slice(-1));
      else if (e.code === 'Backspace') this.press('⌫');
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') this.press('OK');
    });
    // 換到別的畫面後,還在跑的開房間流程不能再改測試狀態或畫面。
    this.events.once('shutdown', () => (this.left = true));
    if (host) void this.openRoom();
    else this.showKeypad();
    this.publish();
  }

  private back(): void {
    this.left = true;
    endOnline();
    this.scene.start('ModeSelect', this.data_);
  }

  // ---------- 房主 ----------

  private async openRoom(): Promise<void> {
    this.setStatus(tr('準備房間中…', 'Opening a room…'));
    for (let i = 0; i < MAX_CODE_TRIES && !this.left; i++) {
      const code = makeRoomCode();
      const link = new HostLink(openSignal(code, localNet()), () => this.media());
      const ok = await link.open();
      if (this.left) {
        link.close();
        return;
      }
      if (ok) {
        online.host = link;
        this.code = code;
        this.showCode(code);
        link.onState = (s) => this.onHostState(s);
        this.onHostState(link.state);
        return;
      }
      link.close();
      if (link.state === 'error') break;
    }
    this.setStatus(tr('連不上網路,請確認有連上網路後再試一次。', "Can't connect. Check your internet connection and try again."));
  }

  /** 給朋友的畫面與聲音:遊戲畫布錄成影片,加上遊戲的聲音。 */
  private media(): MediaStream | null {
    const canvas = this.game.canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream };
    if (!canvas.captureStream) return null;
    const stream = canvas.captureStream(STREAM_FPS);
    audio.streamOut()?.getAudioTracks().forEach((t) => stream.addTrack(t));
    return stream;
  }

  private showCode(code: string): void {
    this.add.text(480, 150, tr('房間號碼', 'Room number'), { fontSize: '24px', ...TEXT }).setOrigin(0.5);
    this.add.text(480, 235, code.split('').join(' '), { fontSize: '96px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 8 }).setOrigin(0.5);
    this.add
      .text(480, 335, tr('請朋友打開晚安王國,選「雙人遊戲 → 加入房間」,輸入這個號碼。', 'Ask your friend to open Goodnight Kingdom, choose "Two Players → Join a room" and enter this number.'), {
        fontSize: '20px',
        align: 'center',
        wordWrap: { width: 760 },
        ...TEXT,
      })
      .setOrigin(0.5);
  }

  private onHostState(s: HostState): void {
    this.state = s;
    if (s === 'waiting') this.setStatus(tr('等朋友加入…', 'Waiting for your friend…'));
    else if (s === 'connecting') this.setStatus(tr('朋友來了,連線中…', 'Your friend is here. Connecting…'));
    else if (s === 'lost') this.setStatus(tr('連線中斷了,等朋友重新加入…', 'Connection lost. Waiting for your friend to rejoin…'));
    else if (s === 'connected') {
      // 之後的斷線、重新連上交給關卡畫面的 HUD 顯示,這個畫面不再管。
      if (online.host) online.host.onState = () => undefined;
      this.scene.start('LevelSelect', { ...this.data_, mode: 'duo' });
      return;
    }
    this.publish();
  }

  // ---------- 朋友 ----------

  private showKeypad(): void {
    this.add.text(480, 130, tr('輸入朋友給你的房間號碼', 'Enter the room number from your friend'), { fontSize: '24px', ...TEXT }).setOrigin(0.5);
    this.codeText = this.add.text(480, 195, '', { fontSize: '64px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 8 }).setOrigin(0.5);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];
    keys.forEach((k, i) => {
      const x = 400 + (i % 3) * 80;
      const y = 265 + Math.floor(i / 3) * 52;
      const label = k === 'OK' ? tr('加入', 'Join') : k;
      smallButton(this, x, y, label, () => this.press(k), 72);
    });
    this.renderTyped();
  }

  private press(k: string): void {
    if (this.joined) return;
    if (k === '⌫') this.typed = this.typed.slice(0, -1);
    else if (k === 'OK') return this.join();
    else if (this.typed.length < CODE_LEN) this.typed += k;
    this.renderTyped();
  }

  private renderTyped(): void {
    this.codeText?.setText(this.typed.padEnd(CODE_LEN, '_').split('').join(' '));
    this.publish();
  }

  private join(): void {
    const code = cleanCode(this.typed);
    if (!code) {
      this.setStatus(tr('號碼是 4 位數字。', 'The room number has 4 digits.'));
      return;
    }
    this.joined = true;
    const link = new GuestLink(openSignal(code, localNet()));
    // 朋友這台不跑遊戲了:停掉遊戲畫面省電,換成房主傳來的畫面。
    this.game.loop.sleep();
    mountGuestView(link, this.data_.touch ?? false);
    void link.join();
  }

  // ---------- 共用 ----------

  private setStatus(text: string): void {
    this.status?.setText(text);
    this.publish();
  }

  private publish(): void {
    if (this.left || window.__GK__?.screen === 'guest') return;
    window.__GK__ = { ready: true, screen: 'online', online: { role: this.data_.role, state: this.state, code: this.data_.role === 'host' ? this.code : this.typed } };
  }
}
