import type Phaser from 'phaser';
import { audio } from '../audio/audio';

const W = 240;
const H = 64;
/** 美術按鈕按下時按鈕面往下 6px,文字跟著移。 */
const PRESS_DY = 6;

/**
 * 選單按鈕:有美術「帶字按鈕」(art-hover / art-pressed)就用;否則用空白按鈕加文字;都沒有就用色塊。
 * 回傳按鈕底下的可點物件。
 */
export function menuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  art: string | null = null,
): Phaser.GameObjects.GameObject {
  const tex = scene.textures;
  const withText = art !== null && tex.exists(art);
  const base = withText ? art! : tex.exists('btn') ? 'btn' : null;
  if (base) {
    const img = scene.add.image(x, y, base).setInteractive({ useHandCursor: true });
    const text = withText ? null : scene.add.text(x, y - 3, label, { fontSize: '24px', color: '#3a2a5a' }).setOrigin(0.5);
    const set = (state: '' | '-hover' | '-pressed'): void => {
      const key = `${base}${state}`;
      img.setTexture(tex.exists(key) ? key : base);
      text?.setY(y - 3 + (state === '-pressed' ? PRESS_DY : 0));
    };
    img.on('pointerover', () => set('-hover'));
    img.on('pointerout', () => set(''));
    img.on('pointerdown', () => set('-pressed'));
    img.on('pointerup', () => {
      set('-hover');
      audio.sfx('select');
      onClick();
    });
    return img;
  }
  const bg = scene.add.rectangle(x, y, W, H, 0x3b3366).setInteractive({ useHandCursor: true });
  scene.add.text(x, y, label, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
  bg.on('pointerover', () => bg.setFillStyle(0x5a4f99));
  bg.on('pointerout', () => bg.setFillStyle(0x3b3366));
  bg.on('pointerdown', () => {
    audio.sfx('select');
    onClick();
  });
  return bg;
}

/** 小按鈕(沒有美術圖):奶油色圓角底、深紫字。回傳可以改文字的物件。 */
export function smallButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  w = 150,
): { setLabel(text: string): void; setEnabled(on: boolean): void } {
  const bg = scene.add.rectangle(x, y, w, 44, 0xfff6e5).setStrokeStyle(3, 0x3a2a5a).setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, { fontSize: '18px', color: '#3a2a5a' }).setOrigin(0.5);
  let enabled = true;
  bg.on('pointerover', () => enabled && bg.setFillStyle(0xf8e08e));
  bg.on('pointerout', () => bg.setFillStyle(0xfff6e5));
  bg.on('pointerdown', () => {
    if (!enabled) return;
    audio.sfx('select');
    onClick();
  });
  return {
    setLabel: (t) => void text.setText(t),
    setEnabled(on) {
      enabled = on;
      bg.setAlpha(on ? 1 : 0.45);
      text.setAlpha(on ? 1 : 0.45);
    },
  };
}
