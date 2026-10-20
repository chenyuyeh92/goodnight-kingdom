import Phaser from 'phaser';

export class TestRangeScene extends Phaser.Scene {
  constructor() {
    super('TestRange');
  }

  create(): void {
    this.add.text(24, 24, '晚安王國 測試靶場', { fontSize: '24px', color: '#f3e9d2' });
    window.__GK__ = { ready: true };
  }
}
