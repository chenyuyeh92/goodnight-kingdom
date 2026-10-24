import type { Buffs } from './items';
import { activeWeapon, type Loadout } from './weapons';
import { pick, tr } from '../i18n/lang';

const HEAT_CELLS = 10;

/** HUD 上的武器狀態:名稱、彈藥(∞)或熱度條、道具效果圖示。 */
export function weaponHud(l: Loadout, b: Buffs): string {
  const def = activeWeapon(l);
  let text = pick(def.name);
  if (def.overheat) {
    const filled = Math.min(HEAT_CELLS, Math.floor((l.heat / def.overheat.maxHeat) * HEAT_CELLS));
    text += ` ${'▮'.repeat(filled)}${'▯'.repeat(HEAT_CELLS - filled)}`;
    if (l.overheated) text += tr(' 過熱!', ' Overheated!');
  } else {
    text += ` ${l.ammo === null ? '∞' : l.ammo}`;
  }
  // ☕ 在部分 Android 會變成彩色表情符號,改用文字。
  const icons = (b.cocoaMs > 0 ? tr('可可', 'Cocoa') : '') + (b.starMs > 0 ? '★' : '');
  return icons ? `${text} ${icons}` : text;
}
