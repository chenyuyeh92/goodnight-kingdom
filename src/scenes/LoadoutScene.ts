import Phaser from 'phaser';
import { createSaveStore } from '../game/save';
import { BASE_LOADOUT, SPECIAL_WEAPONS, WEAPONS, ammoCapacity, equip, type Loadout, type WeaponId } from '../game/weapons';
import type { TestRangeData } from './TestRangeScene';
import { onMenuKey } from './menuKeys';
import { iconOrNothing } from './menuIcons';

const RARITY_COLOR: Record<string, string> = { R: '#ffffff', SR: '#7fb4ff', SSR: '#ffd24a', base: '#f3e9d2' };
const ROW_H = 50;
const FIRST_ROW_Y = 140;
const ROW_W = 680;
const UP = new Set(['KeyW', 'ArrowUp']);
const DOWN = new Set(['KeyS', 'ArrowDown']);
const CONFIRM = new Set(['KeyC', 'Comma', 'Enter', 'Space']);

interface Option {
  id: WeaponId;
  label: string;
  color: string;
  loadout: Loadout;
}

/** 背包裡有特殊武器時先選武器;沒有就直接進關卡。 */
export function startLevel(scene: Phaser.Scene, data: TestRangeData): void {
  const owned = (data.save ?? createSaveStore(null)).get().weapons;
  const hasWeapon = SPECIAL_WEAPONS.some((id) => (owned[id] ?? 0) > 0);
  scene.scene.start(hasWeapon ? 'Loadout' : 'TestRange', data);
}

/** 出發前選武器:雙人時 A 先選、B 再選,可以選同一把。 */
export class LoadoutScene extends Phaser.Scene {
  private data_: TestRangeData = {};
  private options: Option[] = [];
  private picks: Loadout[] = [];
  private cursor = 0;
  private title!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('Loadout');
  }

  init(data: TestRangeData): void {
    this.data_ = data ?? {};
    this.picks = [];
    this.cursor = 0;
  }

  create(): void {
    const owned = (this.data_.save ?? createSaveStore(null)).get().weapons;
    this.options = [
      { id: 'yawnBubble', label: '只帶哈欠泡泡', color: RARITY_COLOR.base, loadout: { ...BASE_LOADOUT } },
      ...SPECIAL_WEAPONS.flatMap((id) => {
        const stars = owned[id] ?? 0;
        if (stars <= 0) return [];
        const def = WEAPONS[id];
        const ammo = ammoCapacity(id, stars);
        const label = `${def.rarity} ${def.name} ${'★'.repeat(stars)}  ${ammo === null ? '不限彈藥,連射會過熱' : `彈藥 ${ammo}`}`;
        return [{ id, label, color: RARITY_COLOR[def.rarity], loadout: equip(id, stars) }];
      }),
    ];

    this.title = this.add.text(480, 70, '', { fontSize: '34px', color: '#f3e9d2' }).setOrigin(0.5);
    this.rows = this.options.map((o, i) => {
      const y = FIRST_ROW_Y + i * ROW_H;
      const bg = this.add.rectangle(480, y, ROW_W, ROW_H - 8, 0x3b3366).setInteractive({ useHandCursor: true });
      const left = 480 - ROW_W / 2 + 20;
      const hasIcon = iconOrNothing(this, left + 16, y, o.id);
      this.add.text(hasIcon ? left + 40 : left, y, `${i + 1}. ${o.label}`, { fontSize: '22px', color: o.color }).setOrigin(0, 0.5);
      bg.on('pointerdown', () => this.pick(i));
      return bg;
    });
    this.add
      .text(480, 510, '上下移動、C / 逗號 / Enter 確認,或按數字鍵、直接點選', { fontSize: '16px', color: '#f3e9d2' })
      .setOrigin(0.5);

    onMenuKey(this, (e) => {
      if (UP.has(e.code)) this.move(-1);
      else if (DOWN.has(e.code)) this.move(1);
      else if (CONFIRM.has(e.code)) this.pick(this.cursor);
      else if (/^Digit[1-9]$/.test(e.code)) {
        const i = Number(e.code.slice(5)) - 1;
        if (i < this.options.length) this.pick(i);
      }
    });
    this.refresh();
  }

  private playerCount(): number {
    return this.data_.mode === 'duo' ? 2 : 1;
  }

  private who(): 'A' | 'B' {
    return this.picks.length === 0 ? 'A' : 'B';
  }

  private move(d: number): void {
    this.cursor = (this.cursor + d + this.options.length) % this.options.length;
    this.refresh();
  }

  private pick(i: number): void {
    this.picks.push({ ...this.options[i].loadout });
    if (this.picks.length >= this.playerCount()) {
      this.scene.start('TestRange', { ...this.data_, loadouts: this.picks });
      return;
    }
    this.cursor = 0;
    this.refresh();
  }

  private refresh(): void {
    this.title.setText(this.playerCount() === 1 ? '選武器' : `玩家 ${this.who()} 選武器`);
    this.rows.forEach((r, i) => r.setFillStyle(i === this.cursor ? 0x5a4f99 : 0x3b3366).setStrokeStyle(i === this.cursor ? 2 : 0, 0xffe08a));
    window.__GK__ = {
      ready: true,
      screen: 'loadout',
      loadoutFor: this.who(),
      loadoutOptions: this.options.map((o) => o.label),
    };
  }
}
