import { test, expect } from 'vitest';
import { floodFill, type Pixels } from '../src/draw/fill';
import { contentBounds, fitHeight, isBlank } from '../src/draw/trim';

function blank(w: number, h: number): Pixels {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
}
function setPx(img: Pixels, x: number, y: number, c: [number, number, number, number]): void {
  img.data.set(c, (y * img.width + x) * 4);
}
function px(img: Pixels, x: number, y: number): number[] {
  const i = (y * img.width + x) * 4;
  return [...img.data.slice(i, i + 4)];
}

test('油漆桶填滿封閉區域,不越過邊框', () => {
  const img = blank(10, 10);
  for (let i = 0; i < 10; i++) setPx(img, 5, i, [0, 0, 0, 255]);
  const n = floodFill(img, 1, 1, [255, 0, 0, 255]);
  expect(n).toBe(50);
  expect(px(img, 0, 0)).toEqual([255, 0, 0, 255]);
  expect(px(img, 5, 5)).toEqual([0, 0, 0, 255]);
  expect(px(img, 8, 8)).toEqual([0, 0, 0, 0]);
});

test('填同樣的顏色什麼都不做', () => {
  const img = blank(4, 4);
  floodFill(img, 0, 0, [1, 2, 3, 255]);
  expect(floodFill(img, 0, 0, [1, 2, 3, 255])).toBe(0);
});

test('大面積也不會堆疊溢位', () => {
  const img = blank(600, 600);
  expect(floodFill(img, 300, 300, [10, 20, 30, 255])).toBe(360000);
});

test('容差內的顏色一起填(反鋸齒邊緣)', () => {
  const img = blank(3, 1);
  setPx(img, 0, 0, [250, 250, 250, 255]);
  setPx(img, 1, 0, [240, 240, 240, 255]);
  setPx(img, 2, 0, [0, 0, 0, 255]);
  expect(floodFill(img, 0, 0, [255, 0, 0, 255], 32)).toBe(2);
});

test('點在畫布外不做事', () => {
  expect(floodFill(blank(2, 2), 5, 5, [1, 1, 1, 255])).toBe(0);
});

test('找出有畫的範圍;全透明是空白', () => {
  const img = blank(20, 30);
  expect(isBlank(img)).toBe(true);
  expect(contentBounds(img)).toBeNull();
  setPx(img, 3, 4, [0, 0, 0, 255]);
  setPx(img, 10, 20, [0, 0, 0, 255]);
  expect(isBlank(img)).toBe(false);
  expect(contentBounds(img)).toEqual({ x: 3, y: 4, w: 8, h: 17 });
});

test('縮放到統一高度,寬度照比例,太寬的限制寬度', () => {
  expect(fitHeight(50, 100, 128)).toEqual({ w: 64, h: 128 });
  expect(fitHeight(400, 100, 128, 192)).toEqual({ w: 192, h: 48 });
});
