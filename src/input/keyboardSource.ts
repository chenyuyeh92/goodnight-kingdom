import { GAME_CODES } from './keyBindings';

export interface KeyEventTarget {
  addEventListener(type: string, fn: (e: Event) => void): void;
  removeEventListener(type: string, fn: (e: Event) => void): void;
}

/** 記錄目前按住的遊戲按鍵;視窗失焦或分頁隱藏時清空,避免按鍵卡住。 */
export class KeyboardSource {
  private readonly keys = new Set<string>();

  private readonly onKeyDown = (e: Event): void => {
    const code = (e as KeyboardEvent).code;
    if (!GAME_CODES.has(code)) return;
    e.preventDefault();
    this.keys.add(code);
  };

  private readonly onKeyUp = (e: Event): void => {
    const code = (e as KeyboardEvent).code;
    if (!GAME_CODES.has(code)) return;
    e.preventDefault();
    this.keys.delete(code);
  };

  private readonly onBlur = (): void => {
    this.keys.clear();
  };

  private readonly onVisibility = (): void => {
    if (this.doc.visibilityState === 'hidden') this.keys.clear();
  };

  constructor(
    private readonly win: KeyEventTarget,
    private readonly doc: KeyEventTarget & { visibilityState: string },
  ) {
    win.addEventListener('keydown', this.onKeyDown);
    win.addEventListener('keyup', this.onKeyUp);
    win.addEventListener('blur', this.onBlur);
    doc.addEventListener('visibilitychange', this.onVisibility);
  }

  pressed(): ReadonlySet<string> {
    return this.keys;
  }

  destroy(): void {
    this.win.removeEventListener('keydown', this.onKeyDown);
    this.win.removeEventListener('keyup', this.onKeyUp);
    this.win.removeEventListener('blur', this.onBlur);
    this.doc.removeEventListener('visibilitychange', this.onVisibility);
    this.keys.clear();
  }
}
