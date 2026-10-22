import type { Pixels } from './fill';

/** 透明度超過這個值才算有畫。 */
const ALPHA_MIN = 8;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 有畫的地方的最小外框;全空白回傳 null。 */
export function contentBounds(img: Pixels): Box | null {
  const { width: w, height: h, data } = img;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] <= ALPHA_MIN) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function isBlank(img: Pixels): boolean {
  return contentBounds(img) === null;
}

/** 縮放到統一高度,寬度照比例;太寬時改用寬度上限縮小。 */
export function fitHeight(w: number, h: number, targetH: number, maxW = targetH * 1.5): { w: number; h: number } {
  let scale = targetH / h;
  if (w * scale > maxW) scale = maxW / w;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}
