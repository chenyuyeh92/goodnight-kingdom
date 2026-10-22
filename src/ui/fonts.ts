/** 遊戲字型:粉圓子集(tools/build_web_assets.py 產生),依 OFL 改名為 GK Huninn。 */
export const GAME_FONT = 'GK Huninn';

const FONT_TIMEOUT_MS = 3000;

/** 載入遊戲字型;失敗或太久就用系統字型,不卡住遊戲。 */
export async function loadGameFont(): Promise<boolean> {
  if (typeof FontFace === 'undefined' || !document.fonts) return false;
  try {
    const face = new FontFace(GAME_FONT, `url(${import.meta.env.BASE_URL}web/fonts/gk-huninn.woff2)`);
    const loaded = face.load().then((f) => {
      (document.fonts as unknown as { add(f: FontFace): void }).add(f);
      return true;
    });
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), FONT_TIMEOUT_MS));
    return await Promise.race([loaded, timeout]);
  } catch {
    return false;
  }
}
