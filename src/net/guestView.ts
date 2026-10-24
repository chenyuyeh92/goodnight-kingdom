import { KeyboardSource } from '../input/keyboardSource';
import { intentsForMode } from '../input/playMode';
import { tr } from '../i18n/lang';
import { mountTouchControls } from '../ui/touchControls';
import type { GuestLink, GuestState } from './link';

const CSS = `
#guest-view { position: fixed; inset: 0; z-index: 15; background: #0d0b24; display: flex; align-items: center; justify-content: center; }
#guest-view video { width: 100%; height: 100%; object-fit: contain; background: #0d0b24; }
#guest-status { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); max-width: 80%; text-align: center;
  color: #f3e9d2; font: 600 22px system-ui, sans-serif; background: rgba(13, 11, 36, 0.85); padding: 14px 20px; border-radius: 12px; }
#guest-status:empty { display: none; }
#guest-sound { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 25; color: #3a2a5a;
  font: 600 18px system-ui, sans-serif; background: #ffe08a; padding: 8px 16px; border-radius: 10px; pointer-events: none; }
#guest-sound[hidden] { display: none; }
#guest-leave { position: absolute; right: 12px; top: 10px; z-index: 25; font: 600 16px system-ui, sans-serif; color: #3a2a5a;
  background: #f3e9d2; border: 0; border-radius: 10px; padding: 8px 14px; }
`;

/** 斷線後隔多久自動再敲門。 */
const RETRY_MS = 1500;

function statusText(s: GuestState): string {
  switch (s) {
    case 'joining':
    case 'connecting':
      return tr('連線中…', 'Connecting…');
    case 'connected':
      return '';
    case 'lost':
      return tr('連線中斷了,重新連線中…', 'Connection lost. Reconnecting…');
    case 'notFound':
      return tr('找不到這個房間。請確認號碼,或請朋友重新開房間。', "Can't find that room. Check the number, or ask your friend to open a new room.");
    case 'full':
      return tr('這個房間已經有兩個人在玩了。', 'This room already has two players.');
    case 'error':
      return tr('連不上網路,請確認手機有連上網路。', "Can't connect. Please check your internet connection.");
  }
}

/**
 * 朋友那台:整個畫面是房主傳來的遊戲畫面,上面疊自己的觸控按鈕(電腦上用鍵盤),操作傳給房主當玩家 B。
 * 「離開」重新載入網頁,回到主選單。
 */
export function mountGuestView(link: GuestLink, touch: boolean): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const root = document.createElement('div');
  root.id = 'guest-view';
  root.innerHTML = `<video playsinline autoplay muted></video><div id="guest-status"></div><div id="guest-sound" hidden>${tr('點一下畫面(或按任意鍵)打開聲音', 'Tap the screen (or press a key) for sound')}</div><button id="guest-leave">${tr('離開', 'Leave')}</button>`;
  document.body.append(root);
  const video = root.querySelector('video') as HTMLVideoElement;
  const status = root.querySelector('#guest-status') as HTMLElement;
  (root.querySelector('#guest-leave') as HTMLElement).addEventListener('click', () => {
    link.close();
    location.reload();
  });

  const sound = root.querySelector('#guest-sound') as HTMLElement;
  // 先靜音播放(手機瀏覽器允許靜音自動播放),再請朋友點一下打開聲音。
  video.muted = true;
  const unmute = (): void => {
    if (!video.srcObject) return;
    video.muted = false;
    void video.play().then(
      () => {
        sound.hidden = true;
        document.removeEventListener('pointerdown', unmute, true);
        document.removeEventListener('keydown', unmute, true);
      },
      () => {
        video.muted = true;
        void video.play().catch(() => undefined);
      },
    );
  };
  // 用 capture:點觸控按鈕(蓋在畫面上)或按鍵盤也算。
  document.addEventListener('pointerdown', unmute, true);
  document.addEventListener('keydown', unmute, true);
  link.onStream = (stream) => {
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    if (video.muted) sound.hidden = false;
  };
  link.onState = (s) => {
    status.textContent = statusText(s);
    if (s === 'lost') setTimeout(() => link.retry(), RETRY_MS);
  };
  status.textContent = statusText(link.state);

  const keyboard = new KeyboardSource(window, document);
  const pad = touch ? mountTouchControls(document.body) : null;
  const tick = (): void => {
    // 鍵盤兩組按鍵都可以用(朋友不用記自己是 B)。
    link.sendIntent(intentsForMode(keyboard.pressed(), 'single', pad?.intent())[0]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.__GK__ = {
    ready: true,
    screen: 'guest',
    get guest() {
      return { state: link.state, videoWidth: video.videoWidth, playing: !video.paused, bits: link.sentBits };
    },
  };
}
