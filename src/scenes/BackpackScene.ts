import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { chestRatesText } from '../game/chest';
import { createSaveStore } from '../game/save';
import { MAX_STARS, SPECIAL_WEAPONS, WEAPONS, type SpecialWeaponId } from '../game/weapons';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { iconOrNothing } from './menuIcons';
import { pick, tr, type Text } from '../i18n/lang';
import { fitWidth } from '../ui/fitText';

const FIRST_ROW_Y = 92;
const ROW_PITCH = 34;
const RATES_Y = 445;

/** 每把武器擅長對付什麼(企劃 5.2)。 */
const BLURB: Record<SpecialWeaponId, Text> = {
  sheepGun: { zh: '快速連射,掃蕩成群小怪', en: 'Rapid fire that sweeps away crowds' },
  pillowCannon: { zh: '慢速大枕頭,穿透排成一列的魔物', en: 'A slow big pillow that pierces a whole line' },
  milkSpray: { zh: '近距離扇形噴灑,對付貼身魔物', en: 'A close-range spray for monsters up close' },
  lullabyHarp: { zh: '音符自動追蹤,對付飛行魔物', en: 'Homing notes, great against flyers' },
  blanketBoomerang: { zh: '飛出去再繞回來,打盾牌魔物的背後', en: 'Flies out and back to hit shields from behind' },
  moonLamp: { zh: '持續光束,連射會過熱', en: 'A steady beam that overheats if held too long' },
  yarnBall: { zh: '拋出去會彈跳,彈起來再打一次', en: 'Bounces and hits again on the rebound' },
  marshmallowBomb: { zh: '拋物線丟出,落地爆開打一群', en: 'Lobbed, then bursts to hit a whole group' },
  hypnoWatch: { zh: '按住集氣,放開射出穿牆的催眠波', en: 'Hold to charge, release a wave through walls' },
  wishingStar: { zh: '前方落下流星,爆開打一群', en: 'Calls down shooting stars that burst ahead' },
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
    audio.music('menu');
    const owned = (this.data_.save ?? createSaveStore(null)).get().weapons;
    const lines: string[] = [];
    this.add.text(480, 50, tr('背包', 'Backpack'), { fontSize: '36px', color: '#f3e9d2' }).setOrigin(0.5);

    // 十把武器一列一把,排到機率文字上面為止。
    const rowY = (i: number): number => FIRST_ROW_Y + i * ROW_PITCH;
    SPECIAL_WEAPONS.forEach((id, i) => {
      const def = WEAPONS[id];
      const stars = owned[id] ?? 0;
      const y = rowY(i);
      const line =
        stars > 0
          ? `${def.rarity} ${pick(def.name)} ${'★'.repeat(stars)}${'☆'.repeat(MAX_STARS - stars)}  ${pick(BLURB[id])}`
          : `${def.rarity} ???`;
      lines.push(line);
      this.add.rectangle(480, y, 760, ROW_PITCH - 4, 0x3b3366, stars > 0 ? 1 : 0.5);
      if (stars > 0) iconOrNothing(this, 130, y, id, ROW_PITCH - 6);
      fitWidth(this.add.text(160, y, line, { fontSize: '18px', color: stars > 0 ? RARITY_COLOR[def.rarity] : LOCKED_COLOR }).setOrigin(0, 0.5), 690);
    });

    const rates = tr(`寶箱${chestRatesText()}`, `Chest ${chestRatesText()}`);
    lines.push(rates);
    this.add.text(480, RATES_Y, rates, { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5);

    const back = this.add.rectangle(480, 495, 160, 44, 0x3b3366).setInteractive({ useHandCursor: true });
    this.add.text(480, 495, tr('返回(Esc)', 'Back (Esc)'), { fontSize: '20px', color: '#f3e9d2' }).setOrigin(0.5);
    back.on('pointerdown', () => this.leave());
    onMenuKey(this, (e) => {
      if (e.code === 'Escape') this.leave();
    });

    const lastRowBottom = rowY(SPECIAL_WEAPONS.length - 1) + (ROW_PITCH - 4) / 2;
    window.__GK__ = { ready: true, screen: 'backpack', backpackText: lines, backpackLayout: { lastRowBottom, ratesY: RATES_Y } };
  }

  private leave(): void {
    this.scene.start('ModeSelect', this.data_);
  }
}
