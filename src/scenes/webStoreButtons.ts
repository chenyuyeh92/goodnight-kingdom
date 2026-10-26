import Phaser from 'phaser';
import { smallButton } from './menuButton';
import { pick, tr } from '../i18n/lang';
import { fitWidth } from '../ui/fitText';
import { PRICE_TEXT, openBuyPage, redeemCode, redeemMessage } from '../platform/webShop';

/** 網頁版(綠界):「解鎖完整版」到小商店的購買頁;「輸入解鎖碼」給已經買過的人(換裝置、換瀏覽器)。App 裡不會有這兩個按鈕。 */
export function webStoreButtons(scene: Phaser.Scene, banner: Phaser.GameObjects.Text, touch: boolean): { buy(): void; restore(): void } {
  const buy = (): void => openBuyPage();
  let busy = false;
  const enter = (): void => {
    if (busy) return;
    const code = window.prompt(tr('請輸入解鎖碼(12 個英文字母和數字,在付款完成頁和信裡)', 'Enter your unlock code (12 letters and numbers, from the receipt page or email)'));
    if (!code) return;
    busy = true;
    banner.setText(tr('正在檢查解鎖碼…', 'Checking your code…'));
    publish(banner);
    void redeemCode(code).then((r) => {
      busy = false;
      if (r === 'ok' || r === 'test') return; // onWebShop 會重新整理這一頁
      if (!scene.scene.isActive()) return;
      banner.setText(pick(redeemMessage(r)));
      fitWidth(banner, 900);
      publish(banner);
    });
  };
  smallButton(scene, 355, 146, tr(`解鎖完整版 ${PRICE_TEXT}`, `Unlock full version ${PRICE_TEXT}`) + (touch ? '' : '(B)'), buy, 290);
  smallButton(scene, 630, 146, tr('輸入解鎖碼', 'Enter code') + (touch ? '' : '(R)'), enter, 200);
  return { buy, restore: enter };
}

function publish(banner: Phaser.GameObjects.Text): void {
  const gk = window.__GK__;
  if (gk?.webStore) gk.webStore = { ...gk.webStore, banner: banner.text };
}
