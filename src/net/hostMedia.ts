import Phaser from 'phaser';
import { audio } from '../audio/audio';

/** 每秒傳幾張畫面給朋友。 */
const STREAM_FPS = 30;

export interface HostMedia {
  stream: MediaStream;
  stop(): void;
}

/**
 * 房主要傳給朋友的畫面與聲音(每個房間錄一份,換朋友時沿用)。
 * 遊戲畫面每一格畫完就複製到一張普通畫布再錄:直接錄 WebGL 畫布在部分瀏覽器(Safari)會錄到黑畫面。
 * 瀏覽器不支援錄畫面時回傳 null。
 */
export function captureGame(game: Phaser.Game): HostMedia | null {
  const src = game.canvas;
  const copy = document.createElement('canvas');
  copy.width = src.width;
  copy.height = src.height;
  const ctx = copy.getContext('2d');
  if (!ctx || typeof copy.captureStream !== 'function') return null;
  let last = -Infinity;
  const onFrame = (): void => {
    const t = performance.now();
    if (t - last < 1000 / STREAM_FPS - 2) return;
    last = t;
    ctx.drawImage(src, 0, 0, copy.width, copy.height);
  };
  game.events.on(Phaser.Core.Events.POST_RENDER, onFrame);
  const stream = copy.captureStream(STREAM_FPS);
  audio.streamOut()?.getAudioTracks().forEach((t) => stream.addTrack(t));
  return {
    stream,
    stop() {
      game.events.off(Phaser.Core.Events.POST_RENDER, onFrame);
      // 只停畫面;聲音的軌道是遊戲共用的,不能停。
      stream.getVideoTracks().forEach((t) => t.stop());
    },
  };
}
