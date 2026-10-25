import Phaser from 'phaser';
import { tr } from '../i18n/lang';
import { online } from '../net/session';

/**
 * 線上雙人時,畫面左下角一直顯示房號(選關、關卡、結算都看得到;畫面也會傳給朋友)。
 * 朋友中途離開忘了號碼,看一下就能再加入。房間關掉時自己收起來。
 * 這個畫面最後才加進遊戲,所以畫在所有畫面上面。
 */
export class OnlineBadgeScene extends Phaser.Scene {
  private label!: Phaser.GameObjects.Text;

  constructor() {
    super('OnlineBadge');
  }

  create(): void {
    this.label = this.add
      .text(10, 532, '', { fontSize: '15px', color: '#f3e9d2', backgroundColor: 'rgba(13, 11, 36, 0.6)', padding: { x: 8, y: 4 } })
      .setOrigin(0, 1)
      .setAlpha(0.85);
    this.refresh();
  }

  update(): void {
    this.refresh();
  }

  private refresh(): void {
    if (!online.host || !online.code) {
      this.scene.stop();
      return;
    }
    const code = `${online.code.slice(0, 3)} ${online.code.slice(3)}`;
    this.label.setText(tr(`房號 ${code}`, `Room ${code}`));
  }
}
