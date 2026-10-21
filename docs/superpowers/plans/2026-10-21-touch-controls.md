# 手機與平板觸控操作實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 iPhone、iPad 可以用觸控玩單人:左半邊浮動虛擬搖桿(移動、往上瞄準、蹲下/空中往下),右下角射擊與跳躍按鈕,直拿手機時提示轉橫向。

**Architecture:** 搖桿方向判斷與多點觸控的狀態寫成不依賴 DOM 的純函式/類別並以 Vitest 測試;畫面上的按鈕是疊在遊戲畫面上的 DOM 元素(不受 Phaser 縮放影響,多點觸控用 Pointer Events)。觸控只是另一個輸入來源,轉成同樣的 `Intent`,和鍵盤合併給玩家 A。

**Tech Stack:** 同前。

**Spec:** `docs/superpowers/specs/2026-10-20-goodnight-kingdom-design.md`(第 1 節平台;4.1 手機平板欄;3 節第 5 步;9.2 輸入層)

**範圍說明:** 原本排在第 5 步,因為葉宸佑目前只能用手機試玩而提前。只做單人;手機同機雙人不在範圍(企劃第 2 節)。

## Global Constraints

- 沿用前面計畫的 Global Constraints。
- 觸控控制只在觸控裝置出現(`matchMedia('(pointer: coarse)')` 為真),或網址帶 `?touch=1` 強制顯示(桌機測試用)。鍵盤照常可用。
- 觸控輸入給玩家 A;雙人模式下玩家 B 仍只能用鍵盤。
- 搖桿:左半邊畫面任何位置按下就是搖桿中心(浮動搖桿);死區 12px;水平超過 16px 算左或右;往上超過 32px 算上;往下超過 32px 算下;斜向可同時成立(例如邊走邊往上瞄準)。
- 按鈕:射擊直徑 84px、跳躍直徑 72px,半透明,放在右下角;按住射擊 = 按住射擊鍵(自動連射與揮擊照舊)。
- 直拿(畫面高大於寬)時蓋一層「請把手機轉成橫向」提示,遊戲照常在背後跑。
- 觸控操作的所有元素禁止頁面捲動、雙擊放大與長按選單(`touch-action: none`、`user-select: none`、`-webkit-touch-callout: none`)。

## Review Focus

1. **手指滑出按鈕或滑出畫面、來電、切到別的 App:** 不能卡在「一直往右走」或「一直射擊」→ `pointercancel`、`lostpointercapture`、`blur`、`visibilitychange` 都清掉該手指。測試在 Task 1 與 Task 2。
2. **兩隻手指同時在左半邊:** 只有第一隻手指控制搖桿,第二隻被忽略,不會讓搖桿中心亂跳 → `TouchState`。測試在 Task 1。
3. **按住搖桿的手指滑到右半邊、經過按鈕上方:** 仍然是搖桿,不會誤觸射擊或跳躍 → 以手指按下時的位置決定角色。測試在 Task 1。
4. **在桌機上:** 沒有 `?touch=1` 時看不到任何觸控元素,鍵盤操作完全不受影響 → 既有 e2e 全部照常通過,外加一條確認。測試在 Task 2。
5. **開場選單、背包畫面:** 手機上點按鈕可以操作,觸控層不會擋住 → 觸控層只在靶場顯示。測試在 Task 2。

---

## File Structure

```
src/input/touchState.ts     # 搖桿方向判斷、多點觸控狀態 → Intent(純)
src/ui/touchControls.ts     # 疊在畫面上的 DOM 搖桿與按鈕、直拿提示
src/input/playMode.ts       # intentsForMode 合併觸控 Intent;觸控版操作提示
src/scenes/TestRangeScene.ts、src/main.ts
tests/touchState.test.ts
e2e/touch.spec.ts
docs/playtest/touch-checklist.md
```

---

### Task 1: 搖桿方向與多點觸控狀態(純)

**Files:** Create `src/input/touchState.ts`;Test `tests/touchState.test.ts`

**Interfaces:**
- Consumes:`Intent`、`EMPTY_INTENT`。
- Produces:
  ```ts
  export const JOYSTICK_DEADZONE = 12;
  export const JOYSTICK_X_THRESHOLD = 16;
  export const JOYSTICK_Y_THRESHOLD = 32;
  export const JOYSTICK_MAX_RADIUS = 60;   // 只影響畫面上的小圓點位置
  export function joystickIntent(dx: number, dy: number): Pick<Intent, 'left' | 'right' | 'up' | 'down'>;
  export type TouchRole = 'stick' | 'shoot' | 'jump';
  export class TouchState {
    down(id: number, role: TouchRole, x: number, y: number): void;   // stick 已經有手指時,第二隻 stick 手指被忽略
    move(id: number, x: number, y: number): void;
    up(id: number): void;                                              // 也用於 cancel
    clear(): void;
    intent(): Intent;
    stick(): { originX: number; originY: number; dx: number; dy: number } | null;
  }
  ```
  `joystickIntent`:`hypot(dx, dy) < 12` → 全 false;否則 `right = dx > 16`、`left = dx < -16`、`up = dy < -32`、`down = dy > 32`。
  手指的角色在 `down` 時決定,之後移動到哪裡都不變。

- [ ] **Step 1:寫失敗測試**
  - `'死區內不動'`:`joystickIntent(8, -8)` 全 false。
  - `'往右'`:`(30, 0)` → 只有 `right`。
  - `'往右上同時成立'`:`(30, -40)` → `right` 與 `up`。
  - `'往下蹲'`:`(0, 40)` → 只有 `down`。
  - `'水平 16 以內不算左右'`:`(16, -40)` → 只有 `up`。
  - `TouchState`:`'搖桿手指拖曳產生方向'`(`down(1,'stick',100,300)`、`move(1,140,300)` → `intent().right`)。
  - `'放開搖桿手指歸零'`。
  - `'第二隻搖桿手指被忽略'`(第一隻在 (100,300),第二隻 `down(2,'stick',200,300)` 後 `move(2, 260, 300)` → `stick().originX === 100`、`intent().right === false`)。
  - `'搖桿手指滑到右邊仍是搖桿,不會變成射擊'`(`down(1,'stick',100,300)`、`move(1,700,300)` → `intent().shoot === false`、`right === true`)。
  - `'射擊與跳躍可以和搖桿同時按'`(三隻手指 → `right`、`shoot`、`jump` 皆 true)。
  - `'放開射擊手指後 shoot 為 false,其他不受影響'`。
  - `'clear 全部歸零'`。
- [ ] **Step 2–4:FAIL → 實作 → PASS(`npm test`、`npx tsc --noEmit`)**
- [ ] **Step 5:Commit**:`觸控:搖桿方向與多點觸控狀態`

---

### Task 2: 觸控控制畫面與接線

**Files:** Create `src/ui/touchControls.ts`;Modify `src/input/playMode.ts`、`src/scenes/TestRangeScene.ts`、`src/main.ts`;Test `tests/playMode.test.ts`(新增)、`e2e/touch.spec.ts`

**Interfaces:**
- Consumes:`TouchState`、`joystickIntent`、`JOYSTICK_MAX_RADIUS`(Task 1)。
- Produces:
  ```ts
  // src/ui/touchControls.ts
  export function isTouchDevice(): boolean;   // matchMedia('(pointer: coarse)').matches
  export interface TouchControls { intent(): Intent; destroy(): void; }
  export function mountTouchControls(parent: HTMLElement): TouchControls;
  // src/input/playMode.ts
  export function intentsForMode(pressed: ReadonlySet<string>, mode: PlayMode, touch?: Intent): Intent[];  // touch 合併給玩家 A
  export function controlHint(mode: PlayMode, touch?: boolean): string;  // touch 時:'左邊拖曳:移動/往上瞄準/蹲下   右邊:射擊、跳躍'
  ```
- DOM 結構(`id` 供測試):`#touch-controls`(全螢幕、`pointer-events` 只在子元素上)、`#touch-stick-zone`(左半邊、透明)、`#touch-stick`(按下時出現的底座圓,直徑 120,與內部小圓點)、`#touch-shoot`(「射擊」文字)、`#touch-jump`(「跳」文字)、`#touch-rotate`(直拿提示)。按鈕按下時變亮。位置:跳躍右 24px、下 28px;射擊在跳躍左方 96px、上方 40px。
- 事件:各區塊 `pointerdown` 時 `setPointerCapture` 並呼叫 `TouchState.down`(角色依區塊決定);`pointermove`、`pointerup`、`pointercancel`、`lostpointercapture` 對應;`window` 的 `blur` 與 `document` 的 `visibilitychange`(hidden)呼叫 `clear()`;所有元素 `touch-action: none`;`contextmenu` 事件 `preventDefault`。
- 直拿提示:`matchMedia('(orientation: portrait)')` 變化時切換顯示。
- 接線:靶場 `create()` 時若 `isTouchDevice()` 或 `?touch=1`(由 `main.ts` 以 `TestRangeData.touch: boolean` 傳入)則 `mountTouchControls(document.body)`,`SHUTDOWN` 時 `destroy()`;每格 `intentsForMode(keys, mode, touch.intent())`;操作提示用觸控版文字。`GkDebug` 新增 `touch?: boolean`。

- [ ] **Step 1:寫失敗測試**
  `tests/playMode.test.ts` 新增:`'觸控 Intent 合併給玩家 A'`(單人與雙人各一,雙人時玩家 B 不受影響);`'觸控版操作提示'`。
  `e2e/touch.spec.ts`(以 `page.evaluate` 對元素派發 `PointerEvent`,`pointerType: 'touch'`、各自的 `pointerId`;輔助 `pointer(page, selector, type, id, x, y)`):
  - `'桌機沒有 ?touch=1 時沒有觸控元素'`:`./?mode=single` → `#touch-controls` 數量 0,`__GK__.touch === false`。
  - `'拖曳搖桿往右,角色往右走'`:`./?mode=single&touch=1`;在 `#touch-stick-zone` 的 (120, 400) 按下、移到 (180, 400),維持 500ms → `players[0].x` 增加 > 50;放開後 300ms 內 x 不再增加。
  - `'按住射擊按鈕會連射'`:按住 `#touch-shoot` 300ms → `bullets > 0`。
  - `'按跳躍按鈕會跳'`:按下 `#touch-jump` → 角色 `y` 變小 > 20。
  - `'搖桿往上加射擊會往上打'`:搖桿 (120,400) → (120,340),同時按住射擊 → `players[0].aim === 'up'`。
  - `'手指被取消(pointercancel)不會卡住'`:搖桿往右後派發 `pointercancel` → 300ms 內角色停下。
  - `'開場選單在手機上點得到'`:`./?touch=1` → 點擊「單人」按鈕座標 → `screen === 'range'`(觸控層只在靶場出現,不擋選單)。
- [ ] **Step 2:執行測試,預期 FAIL**
- [ ] **Step 3:實作**
- [ ] **Step 4:執行 `npm test`、`npx tsc --noEmit`、`npm run e2e`,預期全部 PASS(既有的鍵盤 e2e 不受影響)**
- [ ] **Step 5:截圖自查**:以 Playwright 模擬 iPhone 橫向(844×390、`hasTouch`、`isMobile`)與直拿(390×844)各一張,確認按鈕位置不擋到角色與 HUD、直拿提示出現。
- [ ] **Step 6:Commit**:`手機觸控:浮動搖桿、射擊與跳躍按鈕、直拿提示`

---

### Task 3: 試玩清單與企劃文件

**Files:** Create `docs/playtest/touch-checklist.md`;Modify 企劃文件 4.1、第 3 節

- [ ] **Step 1:試玩清單(繁體中文,給葉宸佑在手機上看)**:網址、把手機轉橫向、怎麼操作(左邊任何地方按住拖曳當搖桿、右下射擊和跳躍)、要回報的感覺(搖桿靈不靈敏、按鈕大小和位置順不順手、會不會誤觸、要不要讓按鈕可以自己移位置)。另外提醒:iPhone 可以用 Safari 的「加入主畫面」讓畫面更大。
- [ ] **Step 2:企劃文件 4.1 手機欄改為實際設計(浮動搖桿、按鈕尺寸位置),第 3 節註明觸控已提前完成**
- [ ] **Step 3:Commit**:`觸控試玩清單,企劃文件同步`

---

## 完成條件

- `npm test`、`npx tsc --noEmit`、`npm run e2e` 全部通過;截圖自查完成。
- 獨立審查一次,修正後推上分支並合併到 `main`,讓葉宸佑在手機上試玩。
