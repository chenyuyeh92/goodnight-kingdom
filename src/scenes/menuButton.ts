import type Phaser from 'phaser';

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
      onClick();
    });
    return img;
  }
  const bg = scene.add.rectangle(x, y, W, H, 0x3b3366).setInteractive({ useHandCursor: true });
  scene.add.text(x, y, label, { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
  bg.on('pointerover', () => bg.setFillStyle(0x5a4f99));
  bg.on('pointerout', () => bg.setFillStyle(0x3b3366));
  bg.on('pointerdown', onClick);
  return bg;
}
