import { floodFill, type Rgba } from '../draw/fill';
import { contentBounds, fitHeight } from '../draw/trim';
import { GAME_FONT } from './fonts';
import { tr } from '../i18n/lang';

export type DrawMode = 'outline' | 'free';

export interface DrawStudioOptions {
  mode: DrawMode;
  /** 輪廓模式的睡衣小人輪廓圖(開機時已載入);沒有時用網址載入。 */
  outline: CanvasImageSource | null;
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
#draw-name { font: inherit; width: 9em; padding: 6px 8px; border-radius: 10px; border: 2px solid #3a2a5a;
  user-select: text; -webkit-user-select: text; }
#draw-status { color: #ffb3c7; min-height: 1.2em; }
#draw-main { flex: 1; display: flex; gap: 10px; padding: 0 12px 10px; min-height: 0; align-items: stretch; }
#draw-tools, #draw-colors { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; }
#draw-board { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; min-height: 0; }
#draw-canvas { touch-action: none; border-radius: 12px;
  background: repeating-conic-gradient(#3b3366 0% 25%, #2f2a58 0% 50%) 50% / 24px 24px; cursor: crosshair; }
.swatch { width: 36px; height: 36px; flex: 0 0 auto; border-radius: 50%; padding: 0 !important; }
.swatch.on { outline: 3px solid #fff6e5; outline-offset: 2px; }
#draw-rotate { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; text-align: center;
  background: rgba(29, 26, 58, 0.95); font-size: 22px; padding: 24px; }
@media (orientation: portrait) and (pointer: coarse) and (max-width: 700px) { #draw-rotate { display: flex; } }
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
      <span class="title">${tr('畫你的守衛', 'Draw Your Guard')}</span>
      <span>${tr('請畫<b>面向右邊</b>的角色', 'Draw your character <b>facing right</b>')}</span>
      <input id="draw-name" maxlength="8" placeholder="${tr('取個名字', 'Name')}" />
      <button id="draw-save">${tr('儲存', 'Save')}</button>
      <button id="draw-cancel">${tr('取消', 'Cancel')}</button>
      <span id="draw-status"></span>
    </div>
    <div id="draw-main">
      <div id="draw-tools">
        <button data-size="thin">${tr('細', 'Thin')}</button><button data-size="mid">${tr('中', 'Mid')}</button><button data-size="thick">${tr('粗', 'Thick')}</button>
        <button data-tool="eraser">${tr('橡皮擦', 'Eraser')}</button><button data-tool="bucket">${tr('油漆桶', 'Fill')}</button>
        <button id="draw-undo">${tr('復原', 'Undo')}</button><button id="draw-clear">${tr('清除', 'Clear')}</button>
      </div>
      <div id="draw-board"><canvas id="draw-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas></div>
      <div id="draw-colors">${PALETTE.map((c) => `<button class="swatch" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
    </div>
    <div id="draw-rotate">請把手機轉成橫向再畫</div>`;
  parent.append(root);

  const canvas = root.querySelector('#draw-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const status = root.querySelector('#draw-status') as HTMLElement;
  const nameInput = root.querySelector('#draw-name') as HTMLInputElement;
  let tool: Tool = 'brush';
  let size: Size = 'mid';
  let color: string = PALETTE[0];
  const undo: ImageData[] = [];
  let outline: CanvasImageSource | null = null;
  /** 玩家有沒有真的畫過(輪廓模式什麼都沒畫不能存)。 */
  let dirty = false;

  const drawOutline = (op: GlobalCompositeOperation = 'source-over'): void => {
    if (!outline) return;
    const ow = Number((outline as HTMLImageElement).width);
    const oh = Number((outline as HTMLImageElement).height);
    const w = (ow / oh) * CANVAS_H;
    ctx.save();
    ctx.globalCompositeOperation = op;
    ctx.drawImage(outline, (CANVAS_W - w) / 2, 0, w, CANVAS_H);
    ctx.restore();
  };
  const resetCanvas = (): void => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawOutline();
  };
  if (opts.mode === 'outline') {
    if (opts.outline) {
      outline = opts.outline;
      resetCanvas();
    } else {
      // 輪廓還沒載入:載好後畫在已經畫的線「下面」,不會蓋掉;之前的復原紀錄沒有輪廓,清掉。
      const img = new Image();
      img.onload = () => {
        outline = img;
        drawOutline('destination-over');
        undo.length = 0;
      };
      img.src = opts.outlineUrl;
    }
  }

  // 畫布照 320:512 的比例放進可用空間,不會被拉長變形(手機直拿、iPad 直拿也一樣)。
  const board = root.querySelector('#draw-board') as HTMLElement;
  const fit = (): void => {
    const r = board.getBoundingClientRect();
    const scale = Math.max(0.1, Math.min(r.width / CANVAS_W, r.height / CANVAS_H));
    canvas.style.width = `${CANVAS_W * scale}px`;
    canvas.style.height = `${CANVAS_H * scale}px`;
  };
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  resize?.observe(board);
  window.addEventListener('resize', fit);
  fit();

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
      dirty = false;
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
  let activeType = '';
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Apple Pencil 可以搶走手掌先碰到的那一筆。
    if (activePointer !== null && !(e.pointerType === 'pen' && activeType === 'touch')) return;
    e.preventDefault();
    const p = toCanvas(e);
    remember();
    dirty = true;
    if (tool === 'bucket') {
      const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      floodFill(img, p.x, p.y, hexToRgba(color));
      ctx.putImageData(img, 0, 0);
      return;
    }
    activePointer = e.pointerId;
    activeType = e.pointerType;
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
  canvas.addEventListener('lostpointercapture', onUp);
  // 名字欄裡 Enter 儲存、Esc 取消。
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') save();
    else if (e.key === 'Escape') opts.onCancel();
  };
  root.addEventListener('keydown', onKey);
  // 擋掉 iOS 的雙指縮放與長按選單。
  const block = (e: Event): void => e.preventDefault();
  root.addEventListener('gesturestart', block);
  root.addEventListener('contextmenu', block);

  function save(): void {
    const full = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const box = contentBounds(full);
    if (!box || (opts.mode === 'outline' && !dirty)) {
      status.textContent = tr('還沒畫任何東西,不能儲存', 'Draw something before saving');
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
      resize?.disconnect();
      window.removeEventListener('resize', fit);
      root.remove();
      style.remove();
    },
  };
}

function hexToRgba(hex: string): Rgba {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
