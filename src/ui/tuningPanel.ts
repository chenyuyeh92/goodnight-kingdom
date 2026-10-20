import { TUNING_LIMITS, type Tuning, type TuningStore } from '../config/tuning';

const PANEL_CSS = `
#tuning-panel { position: fixed; top: 8px; right: 8px; width: 280px; max-height: 90vh; overflow-y: auto;
  background: rgba(20, 16, 44, 0.88); color: #f3e9d2; font: 13px/1.4 system-ui, sans-serif;
  border-radius: 10px; padding: 8px 10px; z-index: 10; box-sizing: border-box; }
#tuning-panel header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
#tuning-panel .row { margin: 6px 0; }
#tuning-panel .row label { display: block; }
#tuning-panel .row div { display: flex; gap: 6px; align-items: center; }
#tuning-panel input[type=range] { flex: 1; }
#tuning-panel input[type=number] { width: 70px; }
#tuning-panel .actions { display: flex; gap: 6px; margin-top: 8px; }
#tuning-panel button { flex: 1; padding: 4px; }
#tuning-panel textarea { width: 100%; height: 120px; margin-top: 6px; }
#tuning-panel.collapsed .body { display: none; }
`;

/** 只在 ?tune=1 時掛上的手感調整面板。 */
export function mountTuningPanel(store: TuningStore, parent: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = PANEL_CSS;
  document.head.append(style);

  const panel = document.createElement('div');
  panel.id = 'tuning-panel';
  // 在面板上打字時,按鍵不能傳到遊戲。
  panel.addEventListener('keydown', (e) => e.stopPropagation());
  // Phaser 會攔截畫布點擊,焦點留在面板上;點面板以外時主動失焦,按鍵才能回到遊戲。
  document.addEventListener(
    'pointerdown',
    (e) => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && panel.contains(active) && !panel.contains(e.target as Node)) active.blur();
    },
    true,
  );

  const header = document.createElement('header');
  header.textContent = '手感調整';
  const toggle = document.createElement('button');
  toggle.textContent = '收合';
  toggle.style.flex = '0';
  toggle.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    toggle.textContent = panel.classList.contains('collapsed') ? '展開' : '收合';
  });
  header.append(toggle);

  const body = document.createElement('div');
  body.className = 'body';

  const fields: Array<() => void> = [];
  for (const key of Object.keys(TUNING_LIMITS) as (keyof Tuning)[]) {
    const { min, max, step, label } = TUNING_LIMITS[key];
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('label');
    name.textContent = label;
    const controls = document.createElement('div');
    const range = document.createElement('input');
    const num = document.createElement('input');
    for (const input of [range, num]) {
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.dataset.key = key;
    }
    range.type = 'range';
    num.type = 'number';
    const refresh = (): void => {
      range.value = String(store.get()[key]);
      num.value = String(store.get()[key]);
    };
    const apply = (value: string): void => {
      store.set(key, Number(value));
      refresh();
    };
    range.addEventListener('input', () => apply(range.value));
    num.addEventListener('change', () => apply(num.value));
    refresh();
    fields.push(refresh);
    controls.append(range, num);
    row.append(name, controls);
    body.append(row);
  }

  const actions = document.createElement('div');
  actions.className = 'actions';
  const copy = document.createElement('button');
  copy.textContent = '複製數值';
  copy.addEventListener('click', () => {
    const text = store.toJSON();
    const fallback = (): void => {
      let area = body.querySelector('textarea');
      if (!area) {
        area = document.createElement('textarea');
        body.append(area);
      }
      area.value = text;
      area.select();
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => (copy.textContent = '已複製!'), fallback);
    } else {
      fallback();
    }
  });
  const reset = document.createElement('button');
  reset.textContent = '重設';
  reset.addEventListener('click', () => {
    store.reset();
    fields.forEach((refresh) => refresh());
  });
  actions.append(copy, reset);
  body.append(actions);

  panel.append(header, body);
  parent.append(panel);
}
