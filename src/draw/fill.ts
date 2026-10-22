/** 跟 ImageData 一樣的像素資料(測試時不需要瀏覽器)。 */
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export type Rgba = readonly [number, number, number, number];

/**
 * 油漆桶:把點到的那一塊相連的同色區域填成新顏色,回傳改了幾個像素。
 * 用迭代(不用遞迴),大面積不會堆疊溢位;容差讓反鋸齒的邊緣也一起填。
 * 透明的地方不管原本的 RGB,只看透明度。
 */
export function floodFill(img: Pixels, x: number, y: number, color: Rgba, tolerance = 32): number {
  const { width: w, height: h, data } = img;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return 0;
  const start = (y * w + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  if (target.every((v, i) => v === color[i])) return 0;
  const transparent = target[3] <= tolerance;
  const matches = (i: number): boolean => {
    if (transparent) return data[i + 3] <= tolerance;
    return (
      Math.abs(data[i] - target[0]) <= tolerance &&
      Math.abs(data[i + 1] - target[1]) <= tolerance &&
      Math.abs(data[i + 2] - target[2]) <= tolerance &&
      Math.abs(data[i + 3] - target[3]) <= tolerance
    );
  };
  const seen = new Uint8Array(w * h);
  const stack = [y * w + x];
  let changed = 0;
  while (stack.length > 0) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!matches(i)) continue;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
    changed++;
    const px = p % w;
    if (px > 0) stack.push(p - 1);
    if (px < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  return changed;
}
