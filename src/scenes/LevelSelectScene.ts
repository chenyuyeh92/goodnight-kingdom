import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { createSaveStore } from '../game/save';
import { WORLDS, WORLD_NAMES, isUnlocked, levelNumber, previousLevel } from '../game/progress';
import { formatDuration } from '../game/runStats';
import { LEVELS } from '../levels';
import type { LevelId } from '../levels/levelDef';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { TEST_TOOLS, setTestMode, testModeOn } from '../config/testTools';
import { menuButton, smallButton } from './menuButton';
import { pick, tr, type Text } from '../i18n/lang';
import { FREE_WORLDS, needsFullVersion } from '../config/edition';
import { fitWidth } from '../ui/fitText';
import { isNativeApp, nativeState, onNativeMessage, requestPurchase, type PurchaseResult } from '../platform/native';
import { PRICE_TEXT, openBuyPage, webShopVisible } from '../platform/webShop';

const CARD_W = 250;
const CARD_H = 230;
const CARD_Y = 290;
const CARD_GAP = 280;
/** 每個世界三小關的時段(一個世界玩完剛好過了一天)。 */
const TIME_OF_DAY: readonly Text[] = [
  { zh: '白天', en: 'Day' },
  { zh: '黃昏', en: 'Dusk' },
  { zh: '晚上 → 深夜', en: 'Night → Midnight' },
];
const PREV_WORLD = new Set(['KeyQ', 'ArrowLeft']);
const NEXT_WORLD = new Set(['KeyE', 'ArrowRight']);

export interface LevelSelectData extends TestRangeData {
  /** 要顯示第幾個世界(1 起算);沒有時顯示最後一個已開放的世界。 */
  world?: number;
  /** App 版剛買到完整版:顯示謝謝。 */
  justUnlocked?: boolean;
}

/** App 版購買沒有成功時的說明。 */
const PURCHASE_TEXT: Record<Exclude<PurchaseResult, 'ok' | 'restored'>, Text> = {
  pending: { zh: '已經請家長同意了。家長同意後,完整版會自動打開。', en: 'Waiting for a parent to approve. The full version opens as soon as they do.' },
  cancelled: { zh: '沒有購買。想玩的時候再按一次就好。', en: 'Not purchased. Tap again whenever you are ready.' },
  failed: { zh: '購買沒有完成,請檢查網路後再試一次。', en: 'The purchase did not go through. Check your connection and try again.' },
  nothingToRestore: { zh: '這個 Apple 帳號還沒有買過完整版。', en: 'This Apple Account has not bought the full version yet.' },
};

/** 選關:可以切換世界;所有小關依序解鎖,顯示最佳時間。 */
export class LevelSelectScene extends Phaser.Scene {
  private data_: LevelSelectData = {};

  constructor() {
    super('LevelSelect');
  }

  init(data: LevelSelectData): void {
    this.data_ = data ?? {};
  }

  create(): void {
    audio.music('menu');
    const cleared = (this.data_.save ?? createSaveStore(null)).get().cleared;
    const touch = this.data_.touch ?? false;
    if (this.textures.exists('ui-cover-bg')) this.add.image(0, 0, 'ui-cover-bg').setOrigin(0, 0).setDisplaySize(960, 540).setAlpha(0.45);
    const opened = WORLDS.filter((w) => isUnlocked(w[0], cleared)).length;
    const world = Math.min(Math.max(this.data_.world ?? opened, 1), WORLDS.length);
    // 左右換世界的按鈕在 180 與 780,標題不能碰到。
    fitWidth(this.add.text(480, 70, tr(`世界 ${world}  ${pick(WORLD_NAMES[world - 1])}`, `World ${world}  ${pick(WORLD_NAMES[world - 1])}`), { fontSize: '36px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 6 }).setOrigin(0.5), 570);
    const go = (w: number): void => {
      if (w >= 1 && w <= WORLDS.length && w !== world) this.scene.restart({ ...this.data_, world: w });
    };
    if (world > 1) smallButton(this, 100, 70, tr(`← 世界 ${world - 1}`, `← World ${world - 1}`) + (touch ? '' : '(Q)'), () => go(world - 1), 160);
    if (world < WORLDS.length) smallButton(this, 860, 70, tr(`世界 ${world + 1} →`, `World ${world + 1} →`) + (touch ? '' : '(E)'), () => go(world + 1), 160);

    const testMode = testModeOn();
    // 免費版:世界 4–10 鎖住。App 版用 Apple 內購買;網頁版(免費試玩)開賣後有「買 Windows 電腦版」(還沒開賣時說即將推出)。
    const fullOnly = needsFullVersion(WORLDS[world - 1][0]);
    const app = isNativeApp();
    // App 打包(VITE_APP=1)時整段是 false:網頁版的按鈕和文字不會進 App。
    const web = import.meta.env.VITE_APP !== '1' && !app && webShopVisible();
    const banner = this.add
      .text(480, (app || web) && fullOnly ? 104 : 116, '', { fontSize: '18px', color: '#ffe08a', stroke: '#2b2a6b', strokeThickness: 4, align: 'center' })
      .setOrigin(0.5);
    if (fullOnly) {
      banner.setText(
        web
          ? tr(`網頁版可以免費玩世界 1–${FREE_WORLDS}。世界 ${FREE_WORLDS + 1}–${WORLDS.length} 和結局在 Windows 電腦版,買一次就能全部玩。`, `The web version is free for Worlds 1–${FREE_WORLDS}. Worlds ${FREE_WORLDS + 1}–${WORLDS.length} and the ending are in the Windows version. Buy once, play them all.`)
          : app
          ? tr(`世界 ${FREE_WORLDS + 1}–${WORLDS.length} 和結局在完整版,買一次就能全部玩。`, `Worlds ${FREE_WORLDS + 1}–${WORLDS.length} and the ending are in the full version. Buy once, play them all.`)
          : tr(`免費版可以玩世界 1–${FREE_WORLDS}。世界 ${FREE_WORLDS + 1}–${WORLDS.length} 在完整版,即將推出!`, `The free version has Worlds 1–${FREE_WORLDS}. Worlds ${FREE_WORLDS + 1}–${WORLDS.length} are in the full version, coming soon!`),
      );
      fitWidth(banner, 900);
    } else if (this.data_.justUnlocked) {
      banner.setText(tr('謝謝你!完整版打開了,十個世界都可以玩。', 'Thank you! The full version is unlocked. All ten worlds are open.'));
    }
    const store = app && fullOnly ? this.storeButtons(banner, touch) : web && fullOnly ? this.webStoreButton(touch) : null;
    const levels = WORLDS[world - 1].map((id) => ({ id, unlocked: testMode || (!fullOnly && isUnlocked(id, cleared)), best: cleared[id] ?? null }));
    levels.forEach((l, i) => {
      const x = 480 + (i - 1) * CARD_GAP;
      const card = this.textures.exists('ui-panel')
        ? this.add.nineslice(x, CARD_Y, 'ui-panel', undefined, CARD_W, CARD_H, 24, 24, 24, 24)
        : this.add.rectangle(x, CARD_Y, CARD_W, CARD_H, 0x3b3366);
      card.setAlpha(l.unlocked ? 1 : 0.5).setInteractive({ useHandCursor: l.unlocked });
      card.on('pointerdown', () => (l.unlocked ? this.play(l.id, true) : this.shake(card)));
      const ink = l.unlocked ? '#3a2a5a' : '#6f6a8a';
      this.add.text(x, CARD_Y - 75, levelNumber(l.id), { fontSize: '40px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y - 20, pick(LEVELS[l.id].name), { fontSize: '22px', color: ink }).setOrigin(0.5);
      this.add.text(x, CARD_Y + 18, pick(TIME_OF_DAY[i]), { fontSize: '18px', color: ink }).setOrigin(0.5);
      const prev = previousLevel(l.id);
      const status = testMode
        ? tr('測試模式開放', 'Open in test mode')
        : fullOnly
        ? tr('完整版', 'Full version')
        : !l.unlocked && prev
        ? tr(`鎖住:先通過 ${levelNumber(prev)}`, `Locked: clear ${levelNumber(prev)} first`)
        : l.best !== null
          ? tr(`最佳 ${formatDuration(l.best)}`, `Best ${formatDuration(l.best)}`)
          : tr('還沒通關', 'Not cleared yet');
      this.add.text(x, CARD_Y + 62, status, { fontSize: '18px', color: l.unlocked ? '#b0477a' : ink }).setOrigin(0.5);
      if (!touch) this.add.text(x, CARD_Y + CARD_H / 2 + 24, testMode ? tr(`按 ${i + 1}(Shift+${i + 1} 打關主)`, `Press ${i + 1} (Shift+${i + 1}: boss)`) : tr(`按 ${i + 1}`, `Press ${i + 1}`), { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);
      if (testMode && LEVELS[l.id].boss) smallButton(this, x, CARD_Y + 96, tr('直接打關主', 'Go to boss'), () => this.play(l.id, true, true), 150);
    });
    // 測試工具:公開上市前關掉(src/config/testTools.ts)。
    if (TEST_TOOLS) {
      const label = (on: boolean): string => tr(`測試模式:${on ? '開' : '關'}`, `Test mode: ${on ? 'on' : 'off'}`) + (touch ? '' : '(T)');
      smallButton(this, 110, 488, label(testMode), () => this.toggleTest(), 190);
    }
    // 手機沒有 Esc,一定要有按鈕回主頁。
    menuButton(this, 480, 488, tr('回到主頁', 'Main menu') + (touch ? '' : '(Esc)'), () => this.back());

    onMenuKey(this, (e) => {
      if (e.code === 'Escape') this.back();
      if (PREV_WORLD.has(e.code)) go(world - 1);
      if (NEXT_WORLD.has(e.code)) go(world + 1);
      if (e.code === 'KeyT' && TEST_TOOLS) this.toggleTest();
      if (store && e.code === 'KeyB') store.buy();
      if (store && e.code === 'KeyR') store.restore();
      const i = /^Digit([1-3])$/.exec(e.code);
      if (i) {
        const l = levels[Number(i[1]) - 1];
        this.play(l.id, l.unlocked, testMode && e.shiftKey);
      }
    });
    window.__GK__ = {
      ready: true,
      screen: 'level-select',
      levels,
      world,
      testMode,
      store: app ? { ...nativeState, shown: store !== null, banner: banner.text } : null,
      webStore: web ? { shown: store !== null, banner: banner.text } : null,
    };
  }

  /** App 版:「解鎖完整版」與「恢復購買」。買到後重新整理這一頁(卡片打開)。 */
  private storeButtons(banner: Phaser.GameObjects.Text, touch: boolean): { buy(): void; restore(): void } {
    const buyLabel = (): string => (nativeState.price ? tr(`解鎖完整版 ${nativeState.price}`, `Unlock full version ${nativeState.price}`) : tr('解鎖完整版', 'Unlock full version')) + (touch ? '' : '(B)');
    const buyButton = smallButton(this, 355, 146, buyLabel(), () => send('buy'), 290);
    const restoreButton = smallButton(this, 630, 146, tr('恢復購買', 'Restore purchase') + (touch ? '' : '(R)'), () => send('restore'), 200);
    const setBusy = (busy: boolean): void => {
      buyButton.setEnabled(!busy);
      restoreButton.setEnabled(!busy);
    };
    const send = (kind: 'buy' | 'restore'): void => {
      if (nativeState.busy) return;
      requestPurchase(kind);
      setBusy(true);
      banner.setText(tr('正在連線到 App Store…', 'Connecting to the App Store…'));
      this.publishStore(banner);
    };
    setBusy(nativeState.busy);
    const off = onNativeMessage((m) => {
      if (nativeState.full) {
        this.scene.restart({ ...this.data_, justUnlocked: true });
        return;
      }
      if (m.type === 'store') buyButton.setLabel(buyLabel());
      else if (m.result !== 'ok' && m.result !== 'restored') {
        setBusy(false);
        banner.setText(pick(PURCHASE_TEXT[m.result]));
        fitWidth(banner, 900);
      }
      this.publishStore(banner);
    });
    this.events.once('shutdown', off);
    return { buy: () => send('buy'), restore: () => send('restore') };
  }

  /** 網頁版(免費試玩):「買 Windows 電腦版」開小商店的購買頁(新分頁)。App、電腦版裡不會有這個按鈕。 */
  private webStoreButton(touch: boolean): { buy(): void; restore(): void } {
    if (import.meta.env.VITE_APP === '1') return { buy: () => {}, restore: () => {} }; // App/電腦版打包:下面的字整段拿掉(Apple 3.1.1)
    const buy = (): void => openBuyPage();
    smallButton(this, 480, 146, tr(`買 Windows 電腦版 ${PRICE_TEXT}`, `Get the Windows version ${PRICE_TEXT}`) + (touch ? '' : '(B)'), buy, 360);
    return { buy, restore: () => {} };
  }

  private publishStore(banner: Phaser.GameObjects.Text): void {
    const gk = window.__GK__;
    if (gk?.store) gk.store = { ...nativeState, shown: true, banner: banner.text };
  }

  /** atBoss(測試模式):從最後一個檢查點出發,戰鬥區當作已經清完,走幾步就是關主。 */
  private play(id: LevelId, unlocked: boolean, atBoss = false): void {
    if (!unlocked) return;
    const level = LEVELS[id];
    const boss = atBoss && level.boss ? { checkpointX: Math.max(...level.checkpoints), arenasCleared: level.arenas.length } : {};
    this.scene.start('TestRange', { ...this.data_, level: id, ...boss });
  }

  private toggleTest(): void {
    setTestMode(!testModeOn());
    this.scene.restart(this.data_);
  }

  /** 點到鎖住的關卡:左右晃一下。 */
  private shake(card: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    this.tweens.add({ targets: card, x: card.x + 8, duration: 50, yoyo: true, repeat: 2 });
  }

  private back(): void {
    const { mode: _mode, world: _world, ...rest } = this.data_;
    this.scene.start('ModeSelect', rest);
  }
}
