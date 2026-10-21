import type Phaser from 'phaser';

/**
 * 選單用的按鍵監聽。Phaser 在同一格收到多個按鍵時,會把同一個按鍵事件再送一次;
 * 這裡記住處理過的事件,每次按鍵只處理一次。按住不放的重複事件也略過。
 */
export function onMenuKey(scene: Phaser.Scene, handler: (e: KeyboardEvent) => void): void {
  const seen = new WeakSet<KeyboardEvent>();
  scene.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
    if (e.repeat || seen.has(e)) return;
    seen.add(e);
    handler(e);
  });
}
