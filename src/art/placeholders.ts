import Phaser from 'phaser';
import type { PlaceholderKey } from './sprites';

/**
 * 美術還沒畫的小頭目,先用程式畫簡單的造型(朝左、深紫外框、黑眼圈),
 * 看得出是什麼動物,不是小怪放大。美術畫好後在 sprites.ts 換成正式的圖,這個檔案就可以刪掉。
 */

const OUTLINE = 0x3a2a5a;
const BORDER = 3;

type Shape = (g: Phaser.GameObjects.Graphics, grow: number) => void;

const ellipse = (x: number, y: number, w: number, h: number): Shape => (g, k) => void g.fillEllipse(x, y, w + k * 2, h + k * 2);
const rect = (x: number, y: number, w: number, h: number): Shape => (g, k) => void g.fillRoundedRect(x - k, y - k, w + k * 2, h + k * 2, Math.min(4 + k, (h + k * 2) / 2));
const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Shape => (g, k) => {
  if (k === 0) g.fillTriangle(x1, y1, x2, y2, x3, y3);
  else {
    const cx = (x1 + x2 + x3) / 3;
    const cy = (y1 + y2 + y3) / 3;
    const out = (x: number, y: number): [number, number] => {
      const d = Math.hypot(x - cx, y - cy) || 1;
      return [x + ((x - cx) / d) * k * 1.6, y + ((y - cy) / d) * k * 1.6];
    };
    g.fillTriangle(...out(x1, y1), ...out(x2, y2), ...out(x3, y3));
  }
};

/** 先用外框色畫大一圈,再畫本體顏色,看起來像有描邊的貼紙。 */
function draw(g: Phaser.GameObjects.Graphics, parts: readonly [Shape, number][]): void {
  for (const [shape] of parts) {
    g.fillStyle(OUTLINE);
    shape(g, BORDER);
  }
  for (const [shape, color] of parts) {
    g.fillStyle(color);
    shape(g, 0);
  }
}

/** 半閉的眼睛加黑眼圈(醒著),或彎彎的閉眼(睡著)。 */
function eye(g: Phaser.GameObjects.Graphics, x: number, y: number, asleep: boolean): void {
  g.fillStyle(0x9a7ab0, 0.7).fillEllipse(x, y + 4, 12, 6);
  g.lineStyle(2, OUTLINE);
  if (asleep) {
    g.beginPath();
    g.arc(x, y - 1, 4, 0.2, Math.PI - 0.2, false);
    g.strokePath();
    return;
  }
  g.fillStyle(0xffffff).fillEllipse(x, y, 9, 7);
  g.fillStyle(OUTLINE).fillCircle(x - 1, y + 1, 2.2);
  g.fillStyle(0xd9a066).fillRect(x - 6, y - 5, 12, 4);
  g.lineBetween(x - 6, y - 1, x + 5, y - 1);
}

function camel(g: Phaser.GameObjects.Graphics, asleep: boolean): void {
  const fur = 0xd9a066;
  const dark = 0xb07a48;
  draw(g, [
    [rect(34, 64, 10, 36), dark],
    [rect(80, 64, 10, 36), dark],
    [ellipse(70, 30, 34, 34), fur],
    [ellipse(66, 56, 80, 42), fur],
    [rect(42, 64, 10, 36), fur],
    [rect(88, 64, 10, 36), fur],
    [tri(24, 22, 46, 50, 34, 58), fur],
    [ellipse(22, 24, 36, 22), fur],
    [ellipse(36, 12, 10, 12), dark],
    [ellipse(104, 52, 10, 18), dark],
    // 駝峰上綁著咖啡壺。
    [rect(60, 4, 18, 16), 0x7a4a3a],
    [rect(66, 0, 6, 6), 0x7a4a3a],
  ]);
  eye(g, 18, 22, asleep);
  g.fillStyle(OUTLINE).fillCircle(6, 28, 2);
  g.lineStyle(2, OUTLINE).lineBetween(8, 33, 16, 32);
}

function fennec(g: Phaser.GameObjects.Graphics, asleep: boolean): void {
  const fur = 0xf0c890;
  const pale = 0xfff0d8;
  draw(g, [
    [ellipse(76, 40, 30, 16), fur],
    [rect(36, 46, 8, 20), fur],
    [rect(56, 46, 8, 20), fur],
    [ellipse(50, 44, 46, 28), fur],
    // 大耳朵是耳廓狐的招牌。
    [tri(8, 26, 4, 0, 22, 20), fur],
    [tri(22, 18, 34, 0, 36, 24), fur],
    [ellipse(22, 32, 34, 28), fur],
    [ellipse(78, 42, 12, 10), pale],
  ]);
  g.fillStyle(0xf6a8b8).fillTriangle(10, 22, 8, 6, 18, 18).fillTriangle(25, 18, 32, 6, 33, 21);
  eye(g, 18, 31, asleep);
  g.fillStyle(OUTLINE).fillCircle(6, 38, 2.5);
}

function hermitCrab(g: Phaser.GameObjects.Graphics, asleep: boolean): void {
  const shell = 0xfff0d8;
  const crab = 0xe07050;
  draw(g, [
    // 背上的咖啡杯殼(杯口朝右後方)。
    [rect(40, 6, 52, 58), shell],
    [ellipse(96, 30, 18, 24), shell],
    [rect(42, 4, 48, 10), 0x7a4a3a],
    [rect(24, 52, 8, 22), crab],
    [rect(40, 54, 8, 20), crab],
    [ellipse(34, 50, 44, 30), crab],
    // 大鉗子朝玩家(左邊)。
    [ellipse(10, 40, 22, 18), crab],
    [rect(20, 18, 5, 18), crab],
    [rect(32, 16, 5, 18), crab],
    [ellipse(22, 16, 12, 12), 0xffffff],
    [ellipse(34, 14, 12, 12), 0xffffff],
  ]);
  g.fillStyle(0x9a7ab0, 0.7).fillEllipse(22, 22, 12, 5).fillEllipse(34, 20, 12, 5);
  g.lineStyle(2, OUTLINE);
  if (asleep) {
    g.lineBetween(18, 16, 26, 16);
    g.lineBetween(30, 14, 38, 14);
  } else {
    g.fillStyle(OUTLINE).fillCircle(21, 17, 2.5).fillCircle(33, 15, 2.5);
    g.fillStyle(0xe07050).fillRect(16, 9, 12, 4).fillRect(28, 7, 12, 4);
  }
  g.fillStyle(0xffffff, 0.8).fillCircle(66, 36, 5).fillCircle(78, 24, 3);
}

function eel(g: Phaser.GameObjects.Graphics, asleep: boolean): void {
  const skin = 0x4a7f9f;
  const belly = 0x9fd0e0;
  draw(g, [
    [ellipse(122, 24, 30, 16), skin],
    [ellipse(96, 24, 44, 26), skin],
    [ellipse(62, 24, 52, 32), skin],
    [ellipse(26, 24, 50, 34), skin],
    [ellipse(28, 32, 36, 12), belly],
  ]);
  // 身上的電光斑點。
  g.fillStyle(0xffe066);
  for (const [x, y] of [[50, 14], [72, 18], [94, 14], [112, 20]]) g.fillTriangle(x, y, x + 6, y + 4, x + 2, y + 10);
  eye(g, 16, 18, asleep);
  g.lineStyle(2, OUTLINE).lineBetween(4, 30, 14, 30);
}

const BUILDERS: Record<PlaceholderKey, { w: number; h: number; paint: (g: Phaser.GameObjects.Graphics) => void }> = {
  'gk-camel': { w: 112, h: 102, paint: (g) => camel(g, false) },
  'gk-camel-sleep': { w: 112, h: 102, paint: (g) => camel(g, true) },
  'gk-fennec': { w: 94, h: 68, paint: (g) => fennec(g, false) },
  'gk-fennec-sleep': { w: 94, h: 68, paint: (g) => fennec(g, true) },
  'gk-hermit-crab': { w: 108, h: 78, paint: (g) => hermitCrab(g, false) },
  'gk-hermit-crab-sleep': { w: 108, h: 78, paint: (g) => hermitCrab(g, true) },
  'gk-eel': { w: 140, h: 46, paint: (g) => eel(g, false) },
  'gk-eel-sleep': { w: 140, h: 46, paint: (g) => eel(g, true) },
};

/** 產生暫代的圖(只做一次)。 */
export function makePlaceholderArt(scene: Phaser.Scene): void {
  for (const [key, b] of Object.entries(BUILDERS)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({}, false);
    // 外框往外長 BORDER,整張往內縮一點避免被切掉。
    g.translateCanvas(BORDER, BORDER);
    b.paint(g);
    g.generateTexture(key, b.w + BORDER * 2, b.h + BORDER * 2);
    g.destroy();
  }
}
