import Phaser from 'phaser';
import { SPRITE_KEYS, artStatus, assetPath, isLevelAsset } from '../art/sprites';
import type { TestRangeData } from './TestRangeScene';
import { loadGameFont } from '../ui/fonts';
import { ensureGuardTexture } from '../draw/guardTextures';

export interface BootData {
  next: 'ModeSelect' | 'TestRange';
  data: TestRangeData;
  /** 不載入任何圖片,全部用色塊(測試用 ?noart=1)。 */
  noArt: boolean;
}

/** 載入美術素材並顯示進度;載入失敗的圖記下來,遊戲改用色塊照樣進行。 */
export class BootScene extends Phaser.Scene {
  private boot!: BootData;
  private fontReady: Promise<boolean> = Promise.resolve(false);

  constructor() {
    super('Boot');
  }

  init(data: BootData): void {
    this.boot = data;
  }

  preload(): void {
    artStatus.disabled = this.boot.noArt;
    this.fontReady = loadGameFont();
    if (this.boot.noArt) return;
    const label = this.add.text(480, 250, '載入中 0%', { fontSize: '24px', color: '#f3e9d2' }).setOrigin(0.5);
    this.add.rectangle(480, 290, 300, 10).setStrokeStyle(2, 0xf3e9d2);
    const bar = this.add.rectangle(330, 290, 0, 10, 0xf8e08e).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => {
      label.setText(`載入中 ${Math.round(v * 100)}%`);
      bar.width = 300 * v;
    });
    this.load.on('filecomplete', () => (artStatus.loaded += 1));
    this.load.on('loaderror', (file: Phaser.Loader.File) => artStatus.missing.push(file.key));
    const base = import.meta.env.BASE_URL;
    // 背景與世界 2 起的魔物,進關卡時才載入那一關用到的(TestRangeScene.preload)。
    for (const k of SPRITE_KEYS) if (!isLevelAsset(k)) this.load.image(k, `${base}${assetPath(k)}`);
    window.__GK__ = { ready: false, screen: 'boot' };
  }

  create(): void {
    // 字型與選用的守衛圖好了才進下一個畫面。
    const guards = this.boot.data.guards?.get();
    const chosen = guards ? guards.guards.filter((g) => g.id === guards.selected.A || g.id === guards.selected.B) : [];
    void Promise.all([this.fontReady, ...chosen.map((g) => ensureGuardTexture(this, g))]).then(() =>
      this.scene.start(this.boot.next, this.boot.data),
    );
  }
}
