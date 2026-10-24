import type Phaser from 'phaser';

/** 英文比中文長:文字超過 maxWidth 就等比例縮小,不超過就維持原本大小。 */
export function fitWidth<T extends Phaser.GameObjects.Text>(text: T, maxWidth: number): T {
  return text.setScale(Math.min(1, maxWidth / Math.max(1, text.width)));
}
