import type Phaser from 'phaser';
import type { Guard, GuardData, GuardPlayer } from './guards';

/** 預設守衛(美術的小綿羊)的貼圖。 */
export const DEFAULT_GUARD_KEY = 'guard';

export function guardTextureKey(id: string): string {
  return `guard-${id}`;
}

/** 把畫好的守衛 PNG 載成 Phaser 貼圖;已經有就直接回傳;失敗回傳 null(遊戲改用小綿羊)。 */
export function ensureGuardTexture(scene: Phaser.Scene, guard: Guard): Promise<string | null> {
  const key = guardTextureKey(guard.id);
  if (scene.textures.exists(key)) return Promise.resolve(key);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (!scene.textures.exists(key)) scene.textures.addImage(key, img);
      resolve(key);
    };
    img.onerror = () => resolve(null);
    img.src = guard.png;
  });
}

/** 某位玩家選用的守衛貼圖;沒選或還沒載入就是小綿羊。 */
export function guardKeyFor(scene: Phaser.Scene, data: GuardData, player: GuardPlayer): string {
  const id = data.selected[player];
  if (id) {
    const key = guardTextureKey(id);
    if (scene.textures.exists(key)) return key;
  }
  return DEFAULT_GUARD_KEY;
}
