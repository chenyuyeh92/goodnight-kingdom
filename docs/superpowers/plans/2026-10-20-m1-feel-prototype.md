# 第一步「手感原型」實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出一個可在瀏覽器試玩的測試靶場:色塊角色能移動、跳躍、蹲下、三方向射擊、打練習靶有回饋,並有手感調整面板,自動發布到 GitHub Pages。

**Architecture:** 手感規則(移動、跳躍、蹲下、瞄準、射擊冷卻、鏡頭)寫成不依賴 Phaser 的純 TypeScript 函式,用 Vitest 測試;Phaser 場景只負責物理碰撞、繪圖與把輸入轉成 `Intent` 交給這些函式。輸入層把鍵盤轉成統一的 `Intent`,日後觸控、網路隊友只是另一個來源。

**Tech Stack:** Phaser 4.2.1、TypeScript 5.9.3、Vite 8.3.0、Vitest 5.0.3、@playwright/test 1.63.0、GitHub Actions + GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-10-20-goodnight-kingdom-design.md`(本計畫實作其第 3 節第 1 步,以及第 4.1~4.4、4.6、9.1~9.3 節中與第一步相關的部分)

## Global Constraints

- 套件版本固定(`package.json` 不用 `^`):`phaser 4.2.1`、`typescript 5.9.3`、`vite 8.3.0`、`vitest 5.0.3`、`@playwright/test 1.63.0`。Node 22。
- 發布網址 `https://chenyuyeh92.github.io/goodnight-kingdom/`,所以 Vite `base` 為 `/goodnight-kingdom/`。
- 內部解析度 960×540,`Phaser.Scale.FIT` 置中縮放。
- 按鍵使用 `KeyboardEvent.code`:玩家 A = `KeyA`/`KeyD` 移動、`KeyW` 上、`KeyS` 下、`KeyF` 射擊、`KeyG` 跳躍;玩家 B = `ArrowLeft`/`ArrowRight`、`ArrowUp`、`ArrowDown`、`Comma` 射擊、`Period` 跳躍。第一步只有單人:兩組按鍵都操控同一個角色。
- 射擊方向只有三種:面對方向、正上方、空中正下方。不做斜向。
- 移動按下即走、放開即停,無滑行;跳躍為固定弧線、空中可微調。
- 按住射擊依射速自動連射。
- 鏡頭只往前推,不能往回。
- 手感調整面板只在網址帶 `?tune=1` 時出現。
- 介面文字一律繁體中文。
- 美術全部是色塊佔位,不引入任何圖片素材。
- 隱私:不收集任何資料,不載入任何第三方腳本。
- 每個 commit 結尾加上:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01JwzxzF4oUbzjTw2tzsmixN
  ```
- 本機 git 身分:`user.name "葉宸佑"`、`user.email "335275297+chenyuyeh92@users.noreply.github.com"`(Task 1 設為 repo-local)。
- 在分支 `claude/ai-game-dev-workflow-dqbe1t` 上開發;`main` 只有企劃文件與計畫。

## Review Focus

1. **按住按鍵時切換視窗(Alt+Tab、iPad 切 App):** 回來後角色不能一直自己走或一直射擊 → `KeyboardSource` 在 `blur` 和 `visibilitychange`(hidden)時清空按鍵。測試在 Task 2。
2. **同時按住相反方向(左+右、上+下):** 角色不動、不抖動、面向不變;上+下同按時不蹲下也不往上瞄準。測試在 Task 2(`intentFromKeys`)與 Task 3(`stepMotor`)。
3. **畫面卡頓或切回分頁後的超大時間差:** 角色不能穿過地板,冷卻與計時不能一次跳過很多發 → 每格 `dtMs` 上限 50。測試在 Task 3 與 Task 4。
4. **在低矮通道中放開蹲下:** 頭上沒有空間時角色維持蹲姿,不會卡進天花板 → `stepMotor` 的 `canStand` 輸入。測試在 Task 3。
5. **調整面板或本機儲存給了壞數值(NaN、負數、超出範圍、儲存被封鎖的無痕模式):** 遊戲照常運行,壞值被忽略或夾到範圍內 → `sanitizeTuning` 與 `createTuningStore`。測試在 Task 6。

---

## File Structure

```
goodnight-kingdom/
├── .github/workflows/deploy.yml   # 測試+建置+發布 Pages
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── src/
│   ├── main.ts                    # Phaser 啟動設定
│   ├── config/tuning.ts           # Tuning 型別、預設值、範圍、sanitizeTuning、createTuningStore
│   ├── input/intent.ts            # Intent 型別、EMPTY_INTENT、mergeIntents
│   ├── input/keyBindings.ts       # 兩組按鍵、intentFromKeys、GAME_CODES
│   ├── input/keyboardSource.ts    # 監聽鍵盤、失焦清空
│   ├── game/playerMotor.ts        # 移動/跳躍/蹲下/瞄準 純函式
│   ├── game/fire.ts               # 射擊冷卻、子彈方向、槍口位置 純函式
│   ├── game/camera.ts             # 只前進鏡頭 純函式
│   ├── scenes/TestRangeScene.ts   # 測試靶場
│   └── ui/tuningPanel.ts          # ?tune=1 調整面板(DOM)
├── tests/                         # Vitest 單元測試(對應 src 檔名)
├── e2e/smoke.spec.ts              # Playwright 煙霧測試
└── docs/playtest/m1-checklist.md  # 給葉宸佑的試玩清單
```

---

### Task 1: 專案骨架與自動發布

**Files:**
- Create: `package.json`、`tsconfig.json`、`vite.config.ts`、`index.html`、`.gitignore`、`src/main.ts`、`src/scenes/TestRangeScene.ts`(先只畫背景與文字)、`playwright.config.ts`、`e2e/smoke.spec.ts`、`.github/workflows/deploy.yml`、`tests/sanity.test.ts`

**Interfaces:**
- Produces:`npm run dev`、`npm run build`(`tsc --noEmit && vite build`)、`npm test`(`vitest run`)、`npm run e2e`(`npm run build && playwright test`)。
- Produces:`window.__GK__` 除錯物件,型別 `GkDebug`(定義於 `src/main.ts` 並 export),Task 5 填入內容:
  ```ts
  export interface GkDebug {
    ready: boolean;
    player?: { x: number; y: number; crouching: boolean; aim: 'forward' | 'up' | 'down'; facing: 1 | -1 };
    bullets?: number;
    targetsHit?: number;
    cameraX?: number;
  }
  ```

- [ ] **Step 1:設定 repo-local git 身分,安裝固定版本套件**

  `npm i -E phaser@4.2.1` 與 `npm i -D -E typescript@5.9.3 vite@8.3.0 vitest@5.0.3 @playwright/test@1.63.0`。不要執行 `playwright install`。

- [ ] **Step 2:撰寫設定檔**

  - `tsconfig.json`:`strict: true`、`target/module: ES2022`、`moduleResolution: bundler`、`noEmit: true`、`types: ["vite/client"]`,include `src`、`tests`、`e2e`。
  - `vite.config.ts`(用 `vitest/config` 的 `defineConfig`):`base: '/goodnight-kingdom/'`;Vitest `test.include: ['tests/**/*.test.ts']`、`environment: 'node'`。
  - `index.html`:`lang="zh-Hant"`、`<title>晚安王國</title>`、viewport meta 含 `user-scalable=no`、`body` 背景 `#1d1a3a`、`<div id="game">`。
  - `.gitignore`:`node_modules`、`dist`、`test-results`、`playwright-report`。

- [ ] **Step 3:`src/main.ts` 與空的 `TestRangeScene`**

  Phaser 設定:`width 960`、`height 540`、`parent 'game'`、`backgroundColor '#2a2550'`、`scale: { mode: FIT, autoCenter: CENTER_BOTH }`、`physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } }`(重力由角色 body 自己設定)、`pixelArt: false`。場景在 `create()` 結束時設 `window.__GK__ = { ready: true }`。場景先畫一行文字「晚安王國 測試靶場」。

- [ ] **Step 4:`tests/sanity.test.ts`**

  ```ts
  import { test, expect } from 'vitest';
  test('vitest 可執行', () => { expect(1 + 1).toBe(2); });
  ```
  執行 `npm test`,預期 PASS。(Task 2 起會有真正的測試,此檔在 Task 2 刪除。)

- [ ] **Step 5:Playwright 煙霧測試**

  `playwright.config.ts`:`webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/goodnight-kingdom/' }`、`use.baseURL` 同上、chromium 專案的 `launchOptions.executablePath` 讀 `process.env.CHROMIUM_PATH`,未設定時若 `/opt/pw-browsers/chromium` 存在就用它。

  `e2e/smoke.spec.ts` 的 `test('遊戲啟動且沒有錯誤')`:收集 `pageerror` 與 `console` error;`goto('./')`;`waitForFunction(() => window.__GK__?.ready === true)`;斷言 `page.locator('canvas')` 數量為 1;斷言錯誤陣列為空。

  執行 `npm run e2e`,預期 1 passed。

- [ ] **Step 6:GitHub Actions 發布**

  `.github/workflows/deploy.yml`:觸發 `push` 到 `main` 與 `workflow_dispatch`;`permissions: contents read, pages write, id-token write`;`concurrency: pages`。build job:`actions/checkout@v4` → `actions/setup-node@v4`(node 22, cache npm)→ `npm ci` → `npm test` → `npm run build` → `actions/upload-pages-artifact@v3`(path `dist`)。deploy job:`actions/deploy-pages@v4`,environment `github-pages`。e2e 不在 CI 執行。

- [ ] **Step 7:驗證並 commit**

  執行 `npm run build`(無錯誤)、`npm test`、`npm run e2e`,全部通過後 commit:`專案骨架:Phaser + Vite + 測試 + Pages 發布`。

---

### Task 2: 輸入層

**Files:**
- Create: `src/input/intent.ts`、`src/input/keyBindings.ts`、`src/input/keyboardSource.ts`
- Test: `tests/keyBindings.test.ts`、`tests/keyboardSource.test.ts`
- Delete: `tests/sanity.test.ts`

**Interfaces:**
- Produces(`intent.ts`):
  ```ts
  export interface Intent { left: boolean; right: boolean; up: boolean; down: boolean; jump: boolean; shoot: boolean; }
  export const EMPTY_INTENT: Readonly<Intent>;
  export function mergeIntents(a: Intent, b: Intent): Intent; // 每個欄位 OR
  ```
- Produces(`keyBindings.ts`):
  ```ts
  export interface KeyBinding { left: string; right: string; up: string; down: string; jump: string; shoot: string; }
  export const PLAYER_A_KEYS: KeyBinding; // KeyA KeyD KeyW KeyS KeyG KeyF
  export const PLAYER_B_KEYS: KeyBinding; // ArrowLeft ArrowRight ArrowUp ArrowDown Period Comma
  export const GAME_CODES: ReadonlySet<string>; // 兩組按鍵的所有 code
  export function intentFromKeys(pressed: ReadonlySet<string>, binding: KeyBinding): Intent;
  ```
  `intentFromKeys` 在左右同按時兩者皆為 `false`;上下同按時兩者皆為 `false`。
- Produces(`keyboardSource.ts`):
  ```ts
  export interface KeyEventTarget { addEventListener(type: string, fn: (e: Event) => void): void; removeEventListener(type: string, fn: (e: Event) => void): void; }
  export class KeyboardSource {
    constructor(win: KeyEventTarget, doc: KeyEventTarget & { visibilityState: string });
    pressed(): ReadonlySet<string>;
    destroy(): void;
  }
  ```
  監聽 `keydown`/`keyup`(讀 `(e as KeyboardEvent).code`),`GAME_CODES` 內的按鍵呼叫 `preventDefault()`,其他按鍵不攔截;`win` 的 `blur` 與 `doc` 的 `visibilitychange`(`visibilityState === 'hidden'`)時清空。

- [ ] **Step 1:寫失敗測試 `tests/keyBindings.test.ts`**

  - `'玩家 A 按 D 與 F → right 與 shoot'`:`intentFromKeys(new Set(['KeyD','KeyF']), PLAYER_A_KEYS)` 等於 `{ ...EMPTY_INTENT, right: true, shoot: true }`。
  - `'玩家 B 按 Period → jump'`。
  - `'左右同按 → 都不算'`:`new Set(['KeyA','KeyD'])` → `left false, right false`。
  - `'上下同按 → 都不算'`:`new Set(['ArrowUp','ArrowDown'])` 搭配 B → `up false, down false`。
  - `'玩家 A 的鍵不影響玩家 B'`:`new Set(['KeyD'])` 搭配 B → 等於 `EMPTY_INTENT`。
  - `'mergeIntents 逐欄 OR'`:`{right:true}` 與 `{shoot:true}` 合併後兩者皆 true。
  - `'GAME_CODES 共 12 個且不含 Space'`。

- [ ] **Step 2:寫失敗測試 `tests/keyboardSource.test.ts`**

  以 Node 內建 `EventTarget` 當 `win`;`doc` 用 `Object.assign(new EventTarget(), { visibilityState: 'visible' })`。輔助函式 `key(type, code)` 回傳 `Object.assign(new Event(type, { cancelable: true }), { code })`。
  - `'keydown 後 pressed 包含該鍵,keyup 後移除'`。
  - `'遊戲按鍵會 preventDefault'`:派發 `key('keydown','ArrowDown')` 後 `e.defaultPrevented === true`。
  - `'非遊戲按鍵不攔截'`:`'KeyT'` 的 `defaultPrevented === false`,且不在 `pressed()` 中。
  - `'視窗失焦時清空'`:按住 `KeyD` 後派發 `new Event('blur')` → `pressed().size === 0`。
  - `'分頁隱藏時清空'`:`doc.visibilityState = 'hidden'` 再派發 `visibilitychange` → 清空。
  - `'destroy 後不再接收按鍵'`。

- [ ] **Step 3:執行 `npm test`,預期新測試 FAIL(模組不存在)**

- [ ] **Step 4:實作三個檔案,刪除 `tests/sanity.test.ts`**

- [ ] **Step 5:執行 `npm test` 與 `npx tsc --noEmit`,預期全部 PASS**

- [ ] **Step 6:Commit**:`輸入層:按鍵對應與鍵盤來源`

---

### Task 3: 角色動作(移動、跳躍、蹲下、瞄準)

**Files:**
- Create: `src/config/tuning.ts`(本任務只放 `Tuning` 型別與 `DEFAULT_TUNING`;Task 6 補其他)、`src/game/playerMotor.ts`
- Test: `tests/playerMotor.test.ts`

**Interfaces:**
- Consumes: `Intent`(Task 2)。
- Produces(`tuning.ts`):
  ```ts
  export interface Tuning {
    walkSpeed: number; crawlSpeed: number; airSpeed: number;
    jumpVelocity: number; gravity: number;
    coyoteMs: number; jumpBufferMs: number;
    fireIntervalMs: number; bulletSpeed: number;
    hitStopMs: number; shakeMs: number; shakeIntensity: number;
  }
  export const DEFAULT_TUNING: Readonly<Tuning> = {
    walkSpeed: 180, crawlSpeed: 60, airSpeed: 150,
    jumpVelocity: 560, gravity: 1500,
    coyoteMs: 100, jumpBufferMs: 120,
    fireIntervalMs: 160, bulletSpeed: 620,
    hitStopMs: 60, shakeMs: 80, shakeIntensity: 0.004,
  };
  export const MAX_DT_MS = 50;
  ```
- Produces(`playerMotor.ts`):
  ```ts
  export type Facing = 1 | -1;
  export type Aim = 'forward' | 'up' | 'down';
  export interface MotorState { facing: Facing; crouching: boolean; aim: Aim; coyoteMs: number; jumpBufferMs: number; prevJump: boolean; }
  export interface MotorInput { intent: Intent; grounded: boolean; canStand: boolean; dtMs: number; }
  export interface MotorOutput { state: MotorState; vx: number; jumpVy: number | null; }
  export const STAND_HITBOX = { w: 28, h: 48 } as const;
  export const CROUCH_HITBOX = { w: 28, h: 28 } as const;
  export function initialMotorState(): MotorState; // facing 1, 其餘為 false/0/'forward'
  export function stepMotor(s: MotorState, input: MotorInput, t: Tuning): MotorOutput;
  ```
  規則(依序):
  1. `dt = min(input.dtMs, MAX_DT_MS)`。
  2. 跳躍按下的瞬間(`intent.jump && !prevJump`)把 `jumpBufferMs` 設為 `t.jumpBufferMs`,否則扣 `dt`(不低於 0)。
  3. `grounded` 時 `coyoteMs = t.coyoteMs`,否則扣 `dt`(不低於 0)。
  4. 想蹲 = `grounded && down && !up`。蹲下 = 想蹲,或「原本蹲著且 `!canStand`」。
  5. 起跳條件:`jumpBufferMs > 0 && (grounded || coyoteMs > 0) && (!crouching || canStand)`。起跳時 `jumpVy = -t.jumpVelocity`、`jumpBufferMs = 0`、`coyoteMs = 0`、`crouching = false`。
  6. 水平:只按左 → -1,只按右 → +1,否則 0;非 0 時更新 `facing`。速度:蹲著用 `crawlSpeed`,不在地面用 `airSpeed`,否則 `walkSpeed`。
  7. 瞄準:`up` → `'up'`(蹲下時不可能,因第 4 條);`!grounded && down` → `'down'`;否則 `'forward'`。

- [ ] **Step 1:寫失敗測試 `tests/playerMotor.test.ts`**

  輔助 `run(intent: Partial<Intent>, opts?: Partial<Omit<MotorInput,'intent'>>, s = initialMotorState())`,預設 `grounded true`、`canStand true`、`dtMs 16`、tuning 用 `DEFAULT_TUNING`。
  - `'按右 → vx 180,面向 1'`;`'按左 → vx -180,面向 -1'`。
  - `'放開 → vx 0,面向不變'`(先按左再放開,facing 仍為 -1)。
  - `'左右同時 → vx 0,面向不變'`(以 `{left:true,right:true}` 直接呼叫,驗證 motor 本身也安全)。
  - `'空中按右 → vx 150'`。
  - `'在地上按跳 → jumpVy -560'`。
  - `'按住跳不會連跳'`:第一格起跳後,第二格仍按住且 `grounded true` → `jumpVy null`。
  - `'離開平台 100ms 內仍可起跳'`:先 `grounded true` 一格,接著 `grounded false, dtMs 50` 一格(不按跳),再 `grounded false, dtMs 40` 並按跳 → `jumpVy -560`。
  - `'離開平台超過 100ms 不可起跳'`:同上但第二格 `dtMs 50`、第三格 `dtMs 50`、第四格按跳 → `jumpVy null`。
  - `'落地前 120ms 內按跳,落地時起跳'`:`grounded false` 按跳(coyote 已用完的狀態),下一格放開跳、`grounded true`、`dtMs 50` → `jumpVy -560`。
  - `'超大 dtMs 被限制為 50'`:先 `grounded true` 一格,再 `grounded false, dtMs 5000` 一格,再 `grounded false, dtMs 16` 並按跳 → `jumpVy -560`(coyote 100−50−16=34>0,證明 dt 有被夾住)。
  - `'在地上按下 → 蹲下,vx 用 60,瞄準 forward'`(同時按右)。
  - `'上下同按 → 不蹲、瞄準 forward'`。
  - `'按上 → 瞄準 up'`;`'空中按下 → 瞄準 down 且不蹲'`。
  - `'低矮處放開下 → 維持蹲下'`:先蹲,下一格放開下、`canStand false` → `crouching true`。
  - `'低矮處不能起跳'`:蹲著、`canStand false`、按跳 → `jumpVy null`。
  - `'蹲著且上方有空間時按跳 → 起跳並站起'`。

- [ ] **Step 2:執行 `npm test`,預期 FAIL**

- [ ] **Step 3:實作 `tuning.ts`(型別、預設值、`MAX_DT_MS`)與 `playerMotor.ts`**

- [ ] **Step 4:執行 `npm test` 與 `npx tsc --noEmit`,預期 PASS**

- [ ] **Step 5:Commit**:`角色動作:移動、跳躍寬容、蹲下、三方向瞄準`

---

### Task 4: 射擊冷卻、子彈方向與鏡頭

**Files:**
- Create: `src/game/fire.ts`、`src/game/camera.ts`
- Test: `tests/fire.test.ts`、`tests/camera.test.ts`

**Interfaces:**
- Consumes: `Aim`、`Facing`(Task 3)、`MAX_DT_MS`(Task 3)。
- Produces(`fire.ts`):
  ```ts
  export interface FireState { cooldownMs: number; }
  export function initialFireState(): FireState; // cooldownMs 0
  export function stepFire(s: FireState, shootHeld: boolean, dtMs: number, intervalMs: number): { state: FireState; fired: boolean };
  export function bulletVelocity(aim: Aim, facing: Facing, speed: number): { vx: number; vy: number };
  export function muzzleOffset(aim: Aim, facing: Facing, crouching: boolean): { x: number; y: number };
  ```
  `stepFire`:先 `cooldown -= min(dt, MAX_DT_MS)`(不低於 0);若按住且 `cooldown === 0` → 發射、`cooldown = intervalMs`。所以「點一下」立刻發射,「按住」每 `intervalMs` 一發,放開後冷卻照樣倒數。
  `bulletVelocity`:forward → `(facing*speed, 0)`;up → `(0, -speed)`;down → `(0, speed)`。
  `muzzleOffset`(角色原點在腳底中央):站立 forward `(facing*16, -30)`;蹲下 forward `(facing*16, -14)`;up `(facing*4, -50)`;down `(0, 2)`。
- Produces(`camera.ts`):
  ```ts
  export function advanceCamera(prevScrollX: number, playerX: number, viewW: number, worldW: number, leadRatio: number): number;
  export function minPlayerX(scrollX: number, margin: number): number; // scrollX + margin
  ```
  `advanceCamera` 回傳 `clamp(max(prevScrollX, playerX - viewW*leadRatio), 0, worldW - viewW)`。

- [ ] **Step 1:寫失敗測試**

  `tests/fire.test.ts`:
  - `'點一下立刻發射'`:`stepFire(initial, true, 16, 160).fired === true`。
  - `'按住每 160ms 一發'`:按住連續 20 格、每格 16ms → 只有第 1 格與第 11 格 `fired`,共 2 次。
  - `'放開期間冷卻照樣倒數'`:發射後放開 10 格(160ms),再按 → 立即發射。
  - `'超大 dtMs 不會一次補很多發'`:按住、`dtMs 5000` 單格 → `fired` 最多一次(回傳 boolean,本就最多一次),且之後下一格 16ms 不發射(冷卻已重設為 160)。
  - `bulletVelocity` 三方向各一個測試(面向 -1 的 forward 為 `vx -620`)。
  - `muzzleOffset` 蹲下 forward 面向 -1 為 `(-16, -14)`。

  `tests/camera.test.ts`:
  - `'角色往前,鏡頭跟上'`:`advanceCamera(0, 1000, 960, 3200, 0.4) === 616`。
  - `'角色往回,鏡頭不退'`:`advanceCamera(616, 500, 960, 3200, 0.4) === 616`。
  - `'不超過世界右邊界'`:`advanceCamera(0, 5000, 960, 3200, 0.4) === 2240`。
  - `'不小於 0'`:`advanceCamera(0, 100, 960, 3200, 0.4) === 0`。
  - `'minPlayerX'`:`minPlayerX(616, 16) === 632`。

- [ ] **Step 2:執行 `npm test`,預期 FAIL**

- [ ] **Step 3:實作 `fire.ts` 與 `camera.ts`**

- [ ] **Step 4:執行 `npm test` 與 `npx tsc --noEmit`,預期 PASS**

- [ ] **Step 5:Commit**:`射擊冷卻、子彈方向與只前進鏡頭`

---

### Task 5: 測試靶場場景

**Files:**
- Modify: `src/scenes/TestRangeScene.ts`、`src/main.ts`
- Test: `e2e/smoke.spec.ts`(新增測試)

**Interfaces:**
- Consumes:`KeyboardSource`、`intentFromKeys`、`mergeIntents`、`PLAYER_A_KEYS`、`PLAYER_B_KEYS`(Task 2);`stepMotor`、`initialMotorState`、`STAND_HITBOX`、`CROUCH_HITBOX`(Task 3);`stepFire`、`bulletVelocity`、`muzzleOffset`、`advanceCamera`、`minPlayerX`(Task 4);`DEFAULT_TUNING`(Task 3)。
- Produces:`TestRangeScene` 接受一個 `getTuning: () => Tuning`(在 `init(data)` 傳入,未傳時用 `DEFAULT_TUNING`),每格讀最新值,讓 Task 6 的面板能即時生效。每格更新 `window.__GK__` 的 `player`、`bullets`(場上子彈數)、`targetsHit`(累計擊中次數)、`cameraX`。

**場景內容(世界寬 3200、高 540,地面頂端 y=480):**
- 地面:整條色塊 `#3b3366`。
- 平台:`(600, 380, 200×20)`、`(1000, 300, 200×20)`、`(1700, 380, 240×20)`。
- 低矮通道:x 1300~1500 處天花板方塊,底部在 y=444(與地面間距 36,站姿 48 過不去、蹲姿 28 過得去)。
- 平台與天花板座標為左上角 `(x, y, 寬×高)`;練習靶座標為底部中央。
- 練習靶(色塊小羊,`#f3e9d2` 圓角方塊 40×40,HP 3,共 6 個):地面 x `450`、`900`、`2100`、`2500`、`2300`(跳到它上方往下射);高處 `(1100, 底部 y=220)`(站在 1000 平台上往上射)。
- 角色起點:x `150`、站在地面上、面向右。
- 角色:色塊 `#ffd27a`,原點腳底中央;Arcade body 大小依 `crouching` 切換 `STAND_HITBOX`/`CROUCH_HITBOX` 並保持腳底位置不變;body 重力 `t.gravity`;蹲下時繪圖高度也改為 28。
- `canStand`:蹲著時以 `STAND_HITBOX` 在目前腳底位置做 `physics.overlapRect`,與天花板/平台靜態物件有重疊即為 `false`。
- 子彈:色塊泡泡 `#bfe6ff` 直徑 10,生命 1000ms,撞到地形或靶就消失。
- 靶被打中:閃白 80ms、縮放成 `(1.2, 0.8)` 再回彈。HP 歸零:浮出文字「Zzz」往上飄並淡出 800ms、`physics.world.pause()` `t.hitStopMs` 後 `resume()`、`cameras.main.shake(t.shakeMs, t.shakeIntensity)`;2000ms 後原地重生。
- 鏡頭:`scrollX = advanceCamera(prev, player.x, 960, 3200, 0.4)`;角色 x 不可小於 `minPlayerX(scrollX, 16)`,也不可超過 `scrollX + 960 - 16`。
- 畫面左上角固定文字提示:「A D 移動 W 上 S 蹲/下 F 射擊 G 跳躍(方向鍵 , . 也可以)」。
- 每格:`dtMs = min(delta, MAX_DT_MS)`;`intent = mergeIntents(intentFromKeys(keys, PLAYER_A_KEYS), intentFromKeys(keys, PLAYER_B_KEYS))`。場景 `shutdown` 時呼叫 `KeyboardSource.destroy()`。

- [ ] **Step 1:在 `e2e/smoke.spec.ts` 新增失敗測試**

  每個測試先 `goto('./')` 並等 `__GK__.ready`,點一下 canvas 取得焦點。
  - `'按 D 角色往右走'`:記下 `player.x`,`keyboard.down('KeyD')` 500ms 後 `up`,`x` 增加至少 50。
  - `'按 G 會跳起來'`:按 `KeyG` 後 200ms 內 `player.y` 比起始值小至少 20。
  - `'按 S 會蹲下'`:按住 `KeyS` 100ms 後 `player.crouching === true`。
  - `'按 F 會射出子彈'`:按住 `KeyF` 300ms 期間 `bullets` 曾大於 0(用 `waitForFunction`)。
  - `'按住 W 時瞄準往上'`:按住 `KeyW` 100ms 後 `player.aim === 'up'`。
  - `'打中練習靶'`:按住 `KeyF` 3000ms(角色起點面向右、第一個靶在 x=450 的同一高度),`targetsHit` 大於 0。
  - `'方向鍵也能操控'`:`ArrowRight` 讓 `x` 增加。

- [ ] **Step 2:執行 `npm run e2e`,預期新測試 FAIL**

- [ ] **Step 3:實作場景與 `__GK__` 更新**

- [ ] **Step 4:執行 `npm run e2e` 與 `npm test`,預期全部 PASS**

- [ ] **Step 5:截圖自查**

  寫一次性 Playwright 腳本(放 scratchpad,不進 repo):依序截圖「起始畫面」「蹲在低矮通道中」「往上射擊」「靶被打倒冒出 Zzz」,目視確認畫面合理(角色腳底貼地、蹲姿能進通道、Zzz 有出現)。

- [ ] **Step 6:Commit**:`測試靶場:地形、角色、子彈、練習靶與打擊回饋`

---

### Task 6: 手感調整面板與試玩清單

**Files:**
- Modify: `src/config/tuning.ts`、`src/main.ts`
- Create: `src/ui/tuningPanel.ts`、`docs/playtest/m1-checklist.md`
- Test: `tests/tuning.test.ts`、`e2e/smoke.spec.ts`(新增測試)

**Interfaces:**
- Consumes:`Tuning`、`DEFAULT_TUNING`(Task 3);`TestRangeScene` 的 `getTuning`(Task 5)。
- Produces(`tuning.ts` 新增):
  ```ts
  export const TUNING_LIMITS: Readonly<Record<keyof Tuning, { min: number; max: number; step: number; label: string }>>;
  export function sanitizeTuning(raw: unknown): Tuning;
  export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; }
  export interface TuningStore { get(): Tuning; set(key: keyof Tuning, value: number): void; reset(): void; toJSON(): string; }
  export function createTuningStore(storage: StorageLike | null): TuningStore;
  export const TUNING_STORAGE_KEY = 'gk.tuning.v1';
  ```
  `TUNING_LIMITS`(min / max / step / label):
  | key | min | max | step | label |
  |---|---|---|---|---|
  | walkSpeed | 60 | 400 | 10 | 走路速度 |
  | crawlSpeed | 0 | 200 | 10 | 爬行速度 |
  | airSpeed | 0 | 400 | 10 | 空中移動速度 |
  | jumpVelocity | 200 | 1000 | 10 | 跳躍力道 |
  | gravity | 500 | 4000 | 50 | 重力 |
  | coyoteMs | 0 | 300 | 10 | 離台寬容(毫秒) |
  | jumpBufferMs | 0 | 300 | 10 | 提早按跳寬容(毫秒) |
  | fireIntervalMs | 50 | 1000 | 10 | 射擊間隔(毫秒) |
  | bulletSpeed | 100 | 1500 | 20 | 子彈速度 |
  | hitStopMs | 0 | 200 | 10 | 擊倒停頓(毫秒) |
  | shakeMs | 0 | 300 | 10 | 畫面晃動時間(毫秒) |
  | shakeIntensity | 0 | 0.02 | 0.001 | 畫面晃動強度 |

  `sanitizeTuning`:非物件 → 回傳 `DEFAULT_TUNING` 的複本;逐欄取值,非有限數字用預設值,超出範圍夾到 `min`/`max`;忽略多餘欄位。
  `createTuningStore`:建立時讀 `TUNING_STORAGE_KEY`(`JSON.parse` 後經 `sanitizeTuning`);`set` 夾範圍後寫回儲存;`getItem`/`setItem`/`JSON.parse` 丟例外時一律吞掉,store 照常運作(只是不保存);`storage` 為 `null` 時同樣運作。`toJSON` 回傳排版過的 JSON 字串。

- [ ] **Step 1:寫失敗測試 `tests/tuning.test.ts`**

  - `'sanitizeTuning(undefined) 等於預設值'`。
  - `'壞值用預設、超出範圍夾住'`:`{ walkSpeed: 'abc', gravity: -5, jumpVelocity: 99999, bulletSpeed: NaN }` → `walkSpeed 180`、`gravity 500`、`jumpVelocity 1000`、`bulletSpeed 620`。
  - `'多餘欄位被忽略'`:結果的 key 集合與 `DEFAULT_TUNING` 相同。
  - `'store.set 後 get 取得新值並寫入儲存'`:用記憶體 storage,`set('walkSpeed', 250)` → `get().walkSpeed === 250`,`getItem(TUNING_STORAGE_KEY)` 解析後 `walkSpeed === 250`。
  - `'重新建立 store 會讀回儲存的值'`。
  - `'儲存丟例外時仍可運作'`:`getItem`/`setItem` 都 `throw new Error('SecurityError')`,`createTuningStore` 不丟例外,`set` 後 `get` 有新值。
  - `'儲存內容是壞 JSON 時用預設值'`。
  - `'reset 回到預設值'`。
  - `'storage 為 null 時可運作'`。

- [ ] **Step 2:執行 `npm test`,預期 FAIL**

- [ ] **Step 3:實作 `tuning.ts` 新增部分**

- [ ] **Step 4:執行 `npm test`,預期 PASS**

- [ ] **Step 5:在 `e2e/smoke.spec.ts` 新增失敗測試**

  - `'沒有 ?tune=1 時沒有面板'`:`#tuning-panel` 數量為 0。
  - `'?tune=1 時有面板,改走路速度會生效'`:`goto('./?tune=1')`;面板存在;把 `walkSpeed` 的數字欄位填 `400` 並觸發 `change`;按住 `KeyD` 500ms,`x` 增加超過預設 180 速度能到的距離(> 120)。
  - `'按「重設」回到預設值'`:改值後按重設,欄位顯示 `180`。

- [ ] **Step 6:實作 `src/ui/tuningPanel.ts` 並接進 `main.ts`**

  `export function mountTuningPanel(store: TuningStore, parent: HTMLElement): void`:建立 `<div id="tuning-panel">`(右上角半透明深色、可捲動、最大高度 90vh、可收合),每個 key 一列:label、`<input type="range">` 與 `<input type="number">`(範圍與 step 來自 `TUNING_LIMITS`,兩者同步),改動時 `store.set`;底部「複製數值」(`navigator.clipboard.writeText(store.toJSON())`,失敗時改為顯示一個已全選的 `<textarea>`)與「重設」按鈕。面板上的鍵盤輸入不能讓角色移動(在面板上 `keydown` 時 `stopPropagation`)。

  `main.ts`:`new URLSearchParams(location.search).get('tune') === '1'` 時,`store = createTuningStore(safeLocalStorage())`(`safeLocalStorage` 存取 `window.localStorage` 時以 try/catch 包住,失敗回傳 `null`)並 `mountTuningPanel`;否則 `store = createTuningStore(null)`。場景以 `getTuning: () => store.get()` 啟動。

- [ ] **Step 7:執行 `npm run e2e` 與 `npm test`,預期全部 PASS**

- [ ] **Step 8:撰寫 `docs/playtest/m1-checklist.md`(繁體中文,給葉宸佑)**

  內容:試玩網址(一般版與 `?tune=1` 版);按鍵說明;要測的項目(走路停得乾不乾脆、跳躍高度與弧線、走出平台邊緣還能跳、蹲下能進低矮通道且通道裡放開不會卡住、往上射與空中往下射、按住連射的速度、打倒小羊時的停頓與晃動感、Alt+Tab 切走再回來角色不會自己走);回報方式:「覺得哪裡怪」用一句話描述,或在 `?tune=1` 版調到滿意後按「複製數值」把 JSON 貼回來。

- [ ] **Step 9:Commit**:`手感調整面板(?tune=1)與第一步試玩清單`

---

## 完成條件

- `npm test`、`npx tsc --noEmit`、`npm run e2e` 全部通過。
- 截圖自查完成。
- 分支推上 GitHub。合併到 `main` 並在倉庫設定把 Pages 來源設為「GitHub Actions」後,`https://chenyuyeh92.github.io/goodnight-kingdom/` 可以試玩(合併與 Pages 設定由葉宸佑確認後進行)。
