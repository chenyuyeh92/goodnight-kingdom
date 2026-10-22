import type Phaser from 'phaser';
import { audio } from '../audio/audio';

/**
 * 選單用的按鍵監聽。Phaser 在同一格收到多個按鍵時,會把同一個按鍵事件再送一次;
 * 這裡記住處理過的事件,每次按鍵只處理一次。按住不放的重複事件也略過。
 */
/** 選單會用到的鍵才發出「選擇」的聲音。 */
const MENU_KEYS = /^(Digit\d|Enter|Space|Escape|Arrow\w+|Key[WASDC]|Comma)$/;

export function onMenuKey(scene: Phaser.Scene, handler: (e: KeyboardEvent) => void): void {
  const seen = new WeakSet<KeyboardEvent>();
  scene.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
    if (e.repeat || seen.has(e)) return;
    seen.add(e);
    // 在輸入框打字(守衛的名字、注音組字)時不處理,也不發出聲音。
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (MENU_KEYS.test(e.code)) audio.sfx('select');
    handler(e);
  });
}
