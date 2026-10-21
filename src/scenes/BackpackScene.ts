import Phaser from 'phaser';
import { CHEST_RATES } from '../game/chest';
import { createSaveStore } from '../game/save';
import { MAX_STARS, SPECIAL_WEAPONS, WEAPONS, type SpecialWeaponId } from '../game/weapons';
import type { TestRangeData } from './TestRangeScene';

/** 每把武器擅長對付什麼(企劃 5.2)。 */
const BLURB: Record<SpecialWeaponId, string> = {
  sheepGun: '快速連射,掃蕩成群小怪',
  pillowCannon: '慢速大枕頭,穿透排成一列的魔物',
  milkSpray: '近距離扇形噴灑,對付貼身魔物',
  lullabyHarp: '音符自動追蹤,對付飛行魔物',
  blanketBoomerang: '飛出去再繞回來,打盾牌魔物的背後',
  moonLamp: '持續光束,連射會過熱',
};
const RARITY_COLOR: Record<string, string> = { R: '#ffffff', SR: '#7fb4ff', SSR: '#ffd24a' };
const LOCKED_COLOR = '#6f6a8a';

export class BackpackScene extends Phaser.Scene {
  private data_: TestRangeData = {};

  constructor() {
    super('Backpack');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
  }

  create(): void {
    const owned = (this.data_.save ?? createSaveStore(null)).get().weapons;
    const lines: string[] = [];
    this.add.text(480, 50, '背包', { fontSize: '36px', color: '#f3e9d2' }).setOrigin(0.5);

    SPECIAL_WEAPONS.forEach((id, i) => {
      const def = WEAPONS[id];
      const stars = owned[id] ?? 0;
      const y = 110 + i * 54;
      const line =
        stars > 0
          ? `${def.rarity} ${def.name} ${'★'.repeat(stars)}${'☆'.repeat(MAX_STARS - stars)}  ${BLURB[id]}`
          : `${def.rarity} ???`;
      lines.push(line);
      this.add.rectangle(480, y, 760, 44, 0x3b3366, stars > 0 ? 1 : 0.5);
      this.add.text(120, y, line, { fontSize: '20px', color: stars > 0 ? RARITY_COLOR[def.rarity] : LOCKED_COLOR }).setOrigin(0, 0.5);
    });

    const rates = `寶箱機率 R ${CHEST_RATES.R * 100}% / SR ${CHEST_RATES.SR * 100}% / SSR ${CHEST_RATES.SSR * 100}%`;
    lines.push(rates);
    this.add.text(480, 445, rates, { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);

    const back = this.add.rectangle(480, 495, 160, 44, 0x3b3366).setInteractive({ useHandCursor: true });
    this.add.text(480, 495, '返回(Esc)', { fontSize: '20px', color: '#f3e9d2' }).setOrigin(0.5);
    back.on('pointerdown', () => this.leave());
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Escape') this.leave();
    });

    window.__GK__ = { ready: true, screen: 'backpack', backpackText: lines };
  }

  private leave(): void {
    this.scene.start('ModeSelect', this.data_);
  }
}
