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
  root.innerHTML = `<video playsinline autoplay></video><div id="guest-status"></div><button id="guest-leave">${tr('離開', 'Leave')}</button>`;
  document.body.append(root);
  const video = root.querySelector('video') as HTMLVideoElement;
  const status = root.querySelector('#guest-status') as HTMLElement;
  (root.querySelector('#guest-leave') as HTMLElement).addEventListener('click', () => {
    link.close();
    location.reload();
  });

  // 瀏覽器不讓網頁自己出聲:播不出來時請朋友點一下。
  const play = (): void => {
    void video.play().then(
      () => {
        if (status.dataset.tap) {
          status.textContent = statusText(link.state);
          delete status.dataset.tap;
        }
      },
      () => {
        status.textContent = tr('點一下畫面開始', 'Tap the screen to start');
        status.dataset.tap = '1';
      },
    );
  };
  root.addEventListener('pointerdown', () => {
    if (video.paused) play();
  });
  link.onStream = (stream) => {
    video.srcObject = stream;
    play();
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
      return { state: link.state, videoWidth: video.videoWidth, playing: !video.paused };
    },
  };
}
