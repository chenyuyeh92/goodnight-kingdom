import { GAME_CODES } from '../input/keyBindings';
import { KEY_COMBOS, keyLabel, markSeen } from '../input/keyCombos';

const CSS = `
#key-test { position: fixed; inset: 0; overflow-y: auto; background: #1d1a3a; color: #f3e9d2;
  font: 16px/1.5 system-ui, sans-serif; padding: 24px 16px; box-sizing: border-box; }
#key-test h1 { font-size: 22px; margin: 0 0 8px; }
#key-test .panel { max-width: 640px; margin: 0 auto; }
#key-test .now { background: #2a2550; border-radius: 10px; padding: 12px; margin: 16px 0; }
#key-test .held { font-size: 28px; min-height: 42px; letter-spacing: 2px; }
#key-test ul { list-style: none; padding: 0; margin: 0; }
#key-test h2 { font-size: 17px; margin: 20px 0 6px; }
#key-test li { padding: 8px 12px; margin: 6px 0; border-radius: 8px; background: #2a2550; }
#key-test li .keys { opacity: 0.7; margin-left: 8px; }
#key-test li.ok { background: #2f5a45; }
#key-test li.ok::before { content: '✓ '; }
#key-test button { margin-top: 16px; padding: 8px 16px; font-size: 16px; }
`;

/** ?keytest=1:檢查這台鍵盤同時按多個遊戲按鍵時會不會漏鍵。 */
export function mountKeyTest(parent: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const root = document.createElement('div');
  root.id = 'key-test';
  root.innerHTML = `
    <div class="panel">
      <h1>鍵盤衝突測試</h1>
      <p>依照下面的清單,把每個組合的鍵<strong>同時按住</strong>。全部的鍵都有收到時,那一行會變成綠色打勾。
      一直按不出勾勾的組合,代表這台鍵盤會漏鍵,請截圖告訴我。</p>
      <div class="now">
        <div>目前按住:</div>
        <div class="held"></div>
        <div class="max">最多同時收到:0 個鍵</div>
      </div>
      <ul></ul>
      <button type="button">全部重來</button>
    </div>`;
  parent.append(root);

  const held = root.querySelector('.held') as HTMLElement;
  const max = root.querySelector('.max') as HTMLElement;
  const list = root.querySelector('ul') as HTMLElement;
  const rows = new Map<string, HTMLElement>();
  let group = '';
  for (const combo of KEY_COMBOS) {
    if (combo.group !== group) {
      group = combo.group;
      const h = document.createElement('h2');
      h.textContent = group;
      list.append(h);
    }
    const li = document.createElement('li');
    li.dataset.combo = combo.name;
    li.textContent = combo.name.includes('|') ? combo.name.split('|')[1] : combo.name;
    const keys = document.createElement('span');
    keys.className = 'keys';
    keys.textContent = `(${combo.codes.map(keyLabel).join(' ')})`;
    li.append(keys);
    list.append(li);
    rows.set(combo.name, li);
  }

  const pressed = new Set<string>();
  const seen = new Set<string>();
  let maxCount = 0;

  const render = (): void => {
    held.textContent = [...pressed].map(keyLabel).join(' ');
    max.textContent = `最多同時收到:${maxCount} 個鍵`;
    for (const [name, li] of rows) li.classList.toggle('ok', seen.has(name));
  };

  window.addEventListener('keydown', (e) => {
    // 只攔截遊戲按鍵,F5 等瀏覽器快捷鍵照常可用。
    if (GAME_CODES.has(e.code)) e.preventDefault();
    pressed.add(e.code);
    maxCount = Math.max(maxCount, pressed.size);
    markSeen(seen, pressed);
    render();
  });
  window.addEventListener('keyup', (e) => {
    pressed.delete(e.code);
    render();
  });
  window.addEventListener('blur', () => {
    pressed.clear();
    render();
  });
  (root.querySelector('button') as HTMLElement).addEventListener('click', () => {
    seen.clear();
    maxCount = 0;
    render();
  });
  render();
}
