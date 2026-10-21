import type Phaser from 'phaser';
import { weaponIcon } from '../art/sprites';
import type { WeaponId } from '../game/weapons';

const ICON = 30;

/** 在選單列前面放武器小圖示;沒有圖就不放,回傳有沒有放。 */
export function iconOrNothing(scene: Phaser.Scene, x: number, y: number, id: WeaponId): boolean {
  const key = weaponIcon(id);
  if (!scene.textures.exists(key)) return false;
  const img = scene.add.image(x, y, key);
  img.setScale(Math.min(ICON / img.width, ICON / img.height));
  return true;
}
