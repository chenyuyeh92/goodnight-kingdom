import { floodFill, type Rgba } from '../draw/fill';
import { contentBounds, fitHeight } from '../draw/trim';
import { GAME_FONT } from './fonts';

export type DrawMode = 'outline' | 'free';

export interface DrawStudioOptions {
  mode: DrawMode;
  /** 輪廓模式的睡衣小人輪廓圖網址。 */
  outlineUrl: string;
  /** 儲存;回傳錯誤訊息(例如存滿了),成功回傳 null。 */
  onSave(name: string, png: string): string | null;
  onCancel(): void;
}

export interface DrawStudio {
  destroy(): void;
}

/** 畫布大小(輪廓圖 289×512 置中)。 */
const CANVAS_W = 320;
const CANVAS_H = 512;
/** 存檔時裁掉空白、縮放到這個高度。 */
export const GUARD_PNG_H = 128;
const UNDO_LIMIT = 20;
const SIZES = { thin: 4, mid: 10, thick: 20 } as const;
type Size = keyof typeof SIZES;
type Tool = 'brush' | 'eraser' | 'bucket';

/** 10 個溫暖柔和的顏色(第一個是外框深紫,適合畫線)。 */
export const PALETTE = ['#3a2a5a', '#ffffff', '#f7a8c4', '#f8e08e', '#ffb27a', '#a6d36b', '#7fd1c7', '#7fb4ff', '#b69cff', '#8b5e3c'] as const;

const CSS = `
#draw-studio { position: fixed; inset: 0; z-index: 30; background: #1d1a3a; color: #f3e9d2;
  font: 16px "${GAME_FONT}", "PingFang TC", "Microsoft JhengHei", sans-serif; display: flex; flex-direction: column;
  user-select: none; -webkit-user-select: none; touch-action: none; }
#draw-studio button { font: inherit; color: #3a2a5a; background: #fff6e5; border: 2px solid #3a2a5a; border-radius: 12px;
  padding: 6px 12px; cursor: pointer; touch-action: manipulation; }
#draw-studio button.on { background: #f8e08e; box-shadow: 0 0 0 3px #f8e08e55; }
#draw-top { display: flex; gap: 8px; align-items: center; padding: 8px 12px; flex-wrap: wrap; }
#draw-top .title { font-size: 20px; color: #ffe08a; margin-right: 8px; }
#draw-name { font: inherit; width: 9em; padding: 6px 8px; border-radius: 10px; border: 2px solid #3a2a5a; }
#draw-status { color: #ffb3c7; min-height: 1.2em; }
#draw-main { flex: 1; display: flex; gap: 10px; padding: 0 12px 10px; min-height: 0; align-items: stretch; }
#draw-tools, #draw-colors { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; }
#draw-board { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; min-height: 0; }
#draw-canvas { height: 100%; max-width: 100%; aspect-ratio: ${CANVAS_W} / ${CANVAS_H}; touch-action: none; border-radius: 12px;
  background: repeating-conic-gradient(#3b3366 0% 25%, #2f2a58 0% 50%) 50% / 24px 24px; cursor: crosshair; }
.swatch { width: 36px; height: 36px; border-radius: 50%; padding: 0 !important; }
`;

/** 全畫面的畫畫介面:畫筆、橡皮擦、油漆桶、復原、清除、10 色;離開時移除所有元素與監聽。 */
export function mountDrawStudio(parent: HTMLElement, opts: DrawStudioOptions): DrawStudio {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const root = document.createElement('div');
  root.id = 'draw-studio';
  root.innerHTML = `
    <div id="draw-top">
      <span class="title">畫你的守衛</span>
      <span>請畫<b>面向右邊</b>的角色</span>
      <input id="draw-name" maxlength="8" placeholder="取個名字" />
      <button id="draw-save">儲存</button>
      <button id="draw-cancel">取消</button>
      <span id="draw-status"></span>
    </div>
    <div id="draw-main">
      <div id="draw-tools">
        <button data-size="thin">細</button><button data-size="mid">中</button><button data-size="thick">粗</button>
        <button data-tool="eraser">橡皮擦</button><button data-tool="bucket">油漆桶</button>
        <button id="draw-undo">復原</button><button id="draw-clear">清除</button>
      </div>
      <div id="draw-board"><canvas id="draw-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas></div>
      <div id="draw-colors">${PALETTE.map((c) => `<button class="swatch" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
    </div>`;
  parent.append(root);

  const canvas = root.querySelector('#draw-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const status = root.querySelector('#draw-status') as HTMLElement;
  const nameInput = root.querySelector('#draw-name') as HTMLInputElement;
  let tool: Tool = 'brush';
  let size: Size = 'mid';
  let color: string = PALETTE[0];
  const undo: ImageData[] = [];
  let outline: HTMLImageElement | null = null;

  const drawOutline = (): void => {
    if (!outline) return;
    const w = (outline.width / outline.height) * CANVAS_H;
    ctx.drawImage(outline, (CANVAS_W - w) / 2, 0, w, CANVAS_H);
  };
  const resetCanvas = (): void => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawOutline();
  };
  if (opts.mode === 'outline') {
    const img = new Image();
    img.onload = () => {
      outline = img;
      resetCanvas();
    };
    img.src = opts.outlineUrl;
  }

  const refreshButtons = (): void => {
    root.querySelectorAll<HTMLElement>('[data-size]').forEach((b) => b.classList.toggle('on', tool !== 'bucket' && b.dataset.size === size));
    root.querySelectorAll<HTMLElement>('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
    root.querySelectorAll<HTMLElement>('[data-color]').forEach((b) => b.classList.toggle('on', tool !== 'eraser' && b.dataset.color === color));
  };
  const remember = (): void => {
    undo.push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
    if (undo.length > UNDO_LIMIT) undo.shift();
  };

  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.dataset.size) {
      size = b.dataset.size as Size;
      if (tool === 'bucket') tool = 'brush';
    } else if (b.dataset.tool) {
      tool = tool === b.dataset.tool ? 'brush' : (b.dataset.tool as Tool);
    } else if (b.dataset.color) {
      color = b.dataset.color;
      if (tool === 'eraser') tool = 'brush';
    } else if (b.id === 'draw-undo') {
      const prev = undo.pop();
      if (prev) ctx.putImageData(prev, 0, 0);
    } else if (b.id === 'draw-clear') {
      remember();
      resetCanvas();
    } else if (b.id === 'draw-save') {
      save();
    } else if (b.id === 'draw-cancel') {
      opts.onCancel();
    }
    refreshButtons();
  });

  // 一次只跟一根手指/一支筆,多指不會亂畫;畫的時候不捲動不縮放。
  let activePointer: number | null = null;
  let last: { x: number; y: number } | null = null;
  const toCanvas = (e: PointerEvent): { x: number; y: number } => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * CANVAS_W) / r.width, y: ((e.clientY - r.top) * CANVAS_H) / r.height };
  };
  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }): void => {
    ctx.save();
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = SIZES[size];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();
    ctx.restore();
  };
  const onDown = (e: PointerEvent): void => {
    if (activePointer !== null) return;
    e.preventDefault();
    const p = toCanvas(e);
    remember();
    if (tool === 'bucket') {
      const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      floodFill(img, p.x, p.y, hexToRgba(color));
      ctx.putImageData(img, 0, 0);
      return;
    }
    activePointer = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    last = p;
    stroke(p, p);
  };
  const onMove = (e: PointerEvent): void => {
    if (e.pointerId !== activePointer || !last) return;
    e.preventDefault();
    const p = toCanvas(e);
    stroke(last, p);
    last = p;
  };
  const onUp = (e: PointerEvent): void => {
    if (e.pointerId !== activePointer) return;
    activePointer = null;
    last = null;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  // 擋掉 iOS 的雙指縮放與長按選單。
  const block = (e: Event): void => e.preventDefault();
  root.addEventListener('gesturestart', block);
  root.addEventListener('contextmenu', block);

  function save(): void {
    const full = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const box = contentBounds(full);
    if (!box) {
      status.textContent = '還沒畫任何東西,不能儲存';
      return;
    }
    const dims = fitHeight(box.w, box.h, GUARD_PNG_H);
    const out = document.createElement('canvas');
    out.width = dims.w;
    out.height = dims.h;
    out.getContext('2d')!.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, dims.w, dims.h);
    const err = opts.onSave(nameInput.value, out.toDataURL('image/png'));
    status.textContent = err ?? '';
  }

  refreshButtons();
  return {
    destroy() {
      root.remove();
      style.remove();
    },
  };
}

function hexToRgba(hex: string): Rgba {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
