import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { MAX_GUARDS, createGuardStore, guardFileName, type GuardPlayer, type GuardStore } from '../draw/guards';
import { DEFAULT_GUARD_KEY, ensureGuardTexture, guardTextureKey } from '../draw/guardTextures';
import { mountDrawStudio, type DrawMode, type DrawStudio } from '../ui/drawStudio';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { smallButton } from './menuButton';
import { tr } from '../i18n/lang';

const COLS = 5;
const CARD = 140;
const GAP_X = 165;
const GAP_Y = 168;
const FIRST_Y = 215;
const THUMB = 100;
/** 刪除要按兩次,避免誤刪。 */
const CONFIRM_MS = 3000;

interface Card {
  id: string | null;
  name: string;
  key: string;
}

/** 守衛房間:挑選 A、B 用的守衛,畫新的、下載、刪除。 */
export class GuardRoomScene extends Phaser.Scene {
  private data_: TestRangeData = {};
  private store!: GuardStore;
  private target: GuardPlayer = 'A';
  private studio: DrawStudio | null = null;
  private cards: Phaser.GameObjects.GameObject[] = [];
  private confirmDeleteUntil = 0;
  private deleteButton!: ReturnType<typeof smallButton>;
  private downloadButton!: ReturnType<typeof smallButton>;
  private targetButtons!: Record<GuardPlayer, ReturnType<typeof smallButton>>;
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('GuardRoom');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
    this.store = this.data_.guards ?? createGuardStore(null);
    this.target = 'A';
    this.studio = null;
    this.cards = [];
    this.confirmDeleteUntil = 0;
  }

  create(): void {
    audio.music('menu');
    if (this.textures.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540).setAlpha(0.4);
    this.add.text(480, 40, tr('畫你的守衛', 'Draw Your Guard'), { fontSize: '32px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5);
    this.targetButtons = {
      A: smallButton(this, 400, 95, tr('幫 A 選', 'Pick for A'), () => this.setTarget('A'), 140),
      B: smallButton(this, 560, 95, tr('幫 B 選', 'Pick for B'), () => this.setTarget('B'), 140),
    };
    this.message = this.add.text(480, 128, '', { fontSize: '16px', color: '#ffb3c7', stroke: '#2b2a6b', strokeThickness: 4 }).setOrigin(0.5);
    smallButton(this, 110, 495, tr('畫新的(輪廓)', 'New (outline)'), () => this.openStudio('outline'), 170);
    smallButton(this, 295, 495, tr('畫新的(空白)', 'New (blank)'), () => this.openStudio('free'), 170);
    this.downloadButton = smallButton(this, 470, 495, tr('下載圖片', 'Download'), () => this.download(), 150);
    this.deleteButton = smallButton(this, 640, 495, tr('刪除', 'Delete'), () => this.remove(), 150);
    smallButton(this, 840, 495, tr('返回(Esc)', 'Back (Esc)'), () => this.back(), 150);

    onMenuKey(this, (e) => {
      if (this.studio) return;
      if (e.code === 'Escape') this.back();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.closeStudio());

    this.renderCards();
    void Promise.all(this.store.get().guards.map((g) => ensureGuardTexture(this, g))).then(() => {
      if (this.scene.isActive()) this.renderCards();
    });
  }

  private setTarget(p: GuardPlayer): void {
    this.target = p;
    this.renderCards();
  }

  private renderCards(): void {
    for (const o of this.cards) o.destroy();
    this.cards = [];
    const data = this.store.get();
    const items: Card[] = [
      { id: null, name: tr('小綿羊', 'Little Sheep'), key: DEFAULT_GUARD_KEY },
      ...data.guards.map((g) => ({ id: g.id, name: g.name, key: guardTextureKey(g.id) })),
    ];
    items.forEach((c, i) => {
      const x = 480 + ((i % COLS) - (COLS - 1) / 2) * GAP_X;
      const y = FIRST_Y + Math.floor(i / COLS) * GAP_Y;
      const mine = data.selected[this.target] === c.id;
      const bg = this.add
        .rectangle(x, y, CARD, CARD + 10, 0xfff6e5, 0.92)
        .setStrokeStyle(mine ? 5 : 2, mine ? 0xf8e08e : 0x3a2a5a)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.choose(c.id));
      this.cards.push(bg);
      if (this.textures.exists(c.key)) {
        const img = this.add.image(x, y - 10, c.key);
        img.setScale(Math.min(THUMB / img.width, THUMB / img.height));
        this.cards.push(img);
      }
      this.cards.push(this.add.text(x, y + CARD / 2 - 12, c.name, { fontSize: '16px', color: '#3a2a5a' }).setOrigin(0.5));
      const badges = (['A', 'B'] as const).filter((p) => data.selected[p] === c.id).join(' ');
      if (badges) {
        this.cards.push(
          this.add.text(x + CARD / 2 - 8, y - CARD / 2 + 4, badges, { fontSize: '16px', color: '#fff6e5', backgroundColor: '#b0477a', padding: { x: 4, y: 0 } }).setOrigin(1, 0),
        );
      }
    });
    const chosen = data.selected[this.target];
    this.downloadButton.setEnabled(chosen !== null);
    this.deleteButton.setEnabled(chosen !== null);
    this.deleteButton.setLabel(tr('刪除', 'Delete'));
    this.confirmDeleteUntil = 0;
    (['A', 'B'] as const).forEach((p) => this.targetButtons[p].setLabel((p === this.target ? '▶ ' : '') + tr(`幫 ${p} 選`, `Pick for ${p}`)));
    window.__GK__ = {
      ready: true,
      screen: 'guard-room',
      guardList: data.guards.map((g) => ({ id: g.id, name: g.name })),
      guardSelected: { ...data.selected },
      guardTarget: this.target,
    };
  }

  private choose(id: string | null): void {
    if (this.studio) return;
    this.store.select(this.target, id);
    this.message.setText('');
    this.renderCards();
  }

  private openStudio(mode: DrawMode): void {
    if (this.studio) return;
    // 存滿了先告訴玩家,不要讓人畫完才發現存不了。
    if (this.store.get().guards.length >= MAX_GUARDS) {
      this.message.setText(tr(`最多存 ${MAX_GUARDS} 個守衛,請先刪掉一個再畫`, `You can keep up to ${MAX_GUARDS} guards. Delete one before drawing a new one.`));
      return;
    }
    this.message.setText('');
    const outline = this.textures.exists('pajama-outline') ? (this.textures.get('pajama-outline').getSourceImage() as HTMLImageElement) : null;
    this.studio = mountDrawStudio(document.body, {
      mode,
      outline,
      outlineUrl: `${import.meta.env.BASE_URL}assets/characters/pajama-outline.png`,
      onSave: (name, png) => {
        const r = this.store.add(name, png);
        if (!r.ok) return r.reason === 'full' ? tr(`最多存 ${MAX_GUARDS} 個守衛,請先刪掉一個`, `You can keep up to ${MAX_GUARDS} guards. Delete one first.`) : tr('這個瀏覽器存不了檔(例如無痕模式)', 'This browser cannot save (e.g. private mode).');
        this.store.select(this.target, r.guard.id);
        this.closeStudio();
        void ensureGuardTexture(this, r.guard).then(() => {
          if (this.scene.isActive()) this.renderCards();
        });
        return null;
      },
      onCancel: () => this.closeStudio(),
    });
    window.__GK__ = { ...window.__GK__, ready: true, screen: 'draw' };
  }

  private closeStudio(): void {
    this.studio?.destroy();
    this.studio = null;
    if (this.scene.isActive()) this.renderCards();
  }

  private download(): void {
    const id = this.store.get().selected[this.target];
    const g = this.store.get().guards.find((x) => x.id === id);
    if (!g) return;
    const name = guardFileName(g.name);
    void fetch(g.png)
      .then((r) => r.blob())
      .then(async (blob) => {
        // 手機上用系統的分享選單(可以存到相簿或傳到社群);不支援時下載檔案。
        const file = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: tr('晚安王國', 'Goodnight Kingdom') }).catch(() => undefined);
          return;
        }
        // 用 Blob 網址下載,瀏覽器才會用我們給的檔名(data: 網址會被當成「download」)。
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      })
      .catch(() => this.message.setText(tr('下載失敗,請再試一次', 'Download failed. Please try again.')));
  }

  /** 按一次變成「再按一次刪除」,3 秒內再按才真的刪。 */
  private remove(): void {
    const id = this.store.get().selected[this.target];
    if (!id) return;
    if (this.time.now > this.confirmDeleteUntil) {
      this.confirmDeleteUntil = this.time.now + CONFIRM_MS;
      this.deleteButton.setLabel(tr('再按一次刪除', 'Press again to delete'));
      this.time.delayedCall(CONFIRM_MS, () => {
        if (this.time.now >= this.confirmDeleteUntil) this.deleteButton.setLabel(tr('刪除', 'Delete'));
      });
      return;
    }
    this.store.remove(id);
    if (this.textures.exists(guardTextureKey(id))) this.textures.remove(guardTextureKey(id));
    this.renderCards();
  }

  private back(): void {
    if (this.studio) return;
    this.scene.start('ModeSelect', this.data_);
  }
}
