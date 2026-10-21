import type { Intent } from '../input/intent';
import { JOYSTICK_MAX_RADIUS, TouchState, type TouchRole } from '../input/touchState';

const CSS = `
#touch-controls { position: fixed; inset: 0; z-index: 20; pointer-events: none;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
#touch-controls * { touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
#touch-stick-zone { position: absolute; left: 0; top: 0; width: 50%; height: 100%; pointer-events: auto; }
#touch-stick { position: absolute; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%;
  background: rgba(243, 233, 210, 0.15); border: 2px solid rgba(243, 233, 210, 0.4); display: none; pointer-events: none; }
#touch-stick .knob { position: absolute; left: 36px; top: 36px; width: 48px; height: 48px; border-radius: 50%;
  background: rgba(243, 233, 210, 0.5); }
.touch-btn { position: absolute; border-radius: 50%; pointer-events: auto; display: flex; align-items: center;
  justify-content: center; color: #f3e9d2; font: 600 18px system-ui, sans-serif;
  background: rgba(243, 233, 210, 0.18); border: 2px solid rgba(243, 233, 210, 0.45); }
.touch-btn.active { background: rgba(255, 224, 138, 0.45); }
#touch-shoot { width: 84px; height: 84px; right: 120px; bottom: 68px; }
#touch-jump { width: 72px; height: 72px; right: 24px; bottom: 28px; }
#touch-rotate { position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
  background: rgba(29, 26, 58, 0.92); color: #f3e9d2; font: 600 22px system-ui, sans-serif; pointer-events: auto; text-align: center; padding: 24px; }
`;

export function isTouchDevice(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

export interface TouchControls {
  intent(): Intent;
  destroy(): void;
}

/** 疊在遊戲畫面上的浮動搖桿、射擊與跳躍按鈕,直拿時提示轉橫向。 */
export function mountTouchControls(parent: HTMLElement): TouchControls {
  const state = new TouchState();
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const root = document.createElement('div');
  root.id = 'touch-controls';
  root.innerHTML = `
    <div id="touch-stick-zone"></div>
    <div id="touch-stick"><div class="knob"></div></div>
    <div id="touch-shoot" class="touch-btn">射擊</div>
    <div id="touch-jump" class="touch-btn">跳</div>
    <div id="touch-rotate">請把手機轉成橫向</div>`;
  parent.append(root);

  const zone = root.querySelector('#touch-stick-zone') as HTMLElement;
  const stick = root.querySelector('#touch-stick') as HTMLElement;
  const knob = stick.querySelector('.knob') as HTMLElement;
  const rotate = root.querySelector('#touch-rotate') as HTMLElement;
  const buttons: [HTMLElement, TouchRole][] = [
    [root.querySelector('#touch-shoot') as HTMLElement, 'shoot'],
    [root.querySelector('#touch-jump') as HTMLElement, 'jump'],
  ];

  const renderStick = (): void => {
    const s = state.stick();
    if (!s) {
      stick.style.display = 'none';
      return;
    }
    const len = Math.hypot(s.dx, s.dy);
    const k = len > JOYSTICK_MAX_RADIUS ? JOYSTICK_MAX_RADIUS / len : 1;
    stick.style.display = 'block';
    stick.style.left = `${s.originX}px`;
    stick.style.top = `${s.originY}px`;
    knob.style.transform = `translate(${s.dx * k}px, ${s.dy * k}px)`;
  };

  const capture = (el: HTMLElement, e: PointerEvent): void => {
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // 模擬事件或已放開的手指無法捕捉,不影響操作。
    }
  };

  const release = (id: number): void => {
    state.up(id);
    for (const [el] of buttons) if (el.dataset.pointer === String(id)) el.classList.remove('active');
    renderStick();
  };

  const listeners: [EventTarget, string, (e: Event) => void][] = [];
  const on = (target: EventTarget, type: string, fn: (e: Event) => void): void => {
    target.addEventListener(type, fn);
    listeners.push([target, type, fn]);
  };

  const bindRelease = (el: HTMLElement): void => {
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(el, type, (e) => release((e as PointerEvent).pointerId));
    }
  };

  on(zone, 'pointerdown', (e) => {
    const p = e as PointerEvent;
    p.preventDefault();
    capture(zone, p);
    state.down(p.pointerId, 'stick', p.clientX, p.clientY);
    renderStick();
  });
  on(zone, 'pointermove', (e) => {
    const p = e as PointerEvent;
    state.move(p.pointerId, p.clientX, p.clientY);
    renderStick();
  });
  bindRelease(zone);

  for (const [el, role] of buttons) {
    on(el, 'pointerdown', (e) => {
      const p = e as PointerEvent;
      p.preventDefault();
      capture(el, p);
      state.down(p.pointerId, role, p.clientX, p.clientY);
      el.dataset.pointer = String(p.pointerId);
      el.classList.add('active');
    });
    bindRelease(el);
  }

  on(root, 'contextmenu', (e) => e.preventDefault());
  const clearAll = (): void => {
    state.clear();
    for (const [el] of buttons) el.classList.remove('active');
    renderStick();
  };
  on(window, 'blur', clearAll);
  on(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') clearAll();
  });

  const portrait = window.matchMedia('(orientation: portrait)');
  const updateRotate = (): void => {
    rotate.style.display = portrait.matches ? 'flex' : 'none';
  };
  updateRotate();
  on(portrait, 'change', updateRotate);

  return {
    intent: () => state.intent(),
    destroy() {
      for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
      root.remove();
      style.remove();
    },
  };
}
