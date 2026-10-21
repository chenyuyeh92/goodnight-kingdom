# 第三步之一「魔物與鏡頭鎖定戰鬥」實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在測試靶場加入第一關的 4 種魔物(吵鬧鬧鐘蟲、咖啡豆精靈、熬夜蝙蝠、失眠刺蝟),以及「鏡頭鎖住、魔物一波波從各方向出現、清完才解鎖」的戰鬥區和移動途中的零星魔物。

**Architecture:** 魔物的資料(等級、血量、大小)、每種魔物的行為、子彈對盾牌的判定、戰鬥區與零星魔物的觸發,全部寫成不依賴 Phaser 的純函式並以 Vitest 測試。場景只負責 Phaser 物件、碰撞與把純函式的輸出套用到物理 body。魔物用色塊佔位,3d 再換成美術素材。

**Tech Stack:** 同前兩步。

**Spec:** `docs/superpowers/specs/2026-10-20-goodnight-kingdom-design.md`(4.3 打擊回饋、4.4 鏡頭鎖定與魔物從各方向出現、第 6 節魔物)

**範圍說明:** 第三步拆成 3a(本計畫)、3b 武器寶箱背包道具、3c 第一關與關主、3d 接入美術。本計畫不含關主、寶箱、武器、正式關卡地圖;練習靶保留。

## Global Constraints

- 沿用前兩步計畫的 Global Constraints;commit 身分為 `Claude <noreply@anthropic.com>`(repo-local 已設定),結尾兩行照舊。
- 魔物被打倒不會死,而是冒「Zzz」飄走(沿用練習靶的打倒效果:停頓、晃動、Zzz)。
- 魔物碰到醒著的玩家 → 走既有的受傷規則(扣一顆、無敵、小彈跳)。
- 魔物色塊(暫定,3d 換美術):鬧鐘蟲 `#e8a87c`、咖啡豆精靈 `#8b5e3c`、熬夜蝙蝠 `#5c4b8a`、失眠刺蝟 `#a0a0b8`(刺盾那側畫一條 `#ffffff` 的邊)。
- 測試用開關只在 `?test=1` 時掛上。

## Review Focus

1. **最後一隻魔物生成的那一格:** 戰鬥區不能在魔物還沒登場前就判定「清完」而提前解鎖 → `stepEncounters` 只在本格開始時已經沒有待生成的魔物、且場上戰鬥區魔物為 0 時才前進。測試在 Task 2。
2. **從戰鬥區中間的檢查點重來:** 重來後鏡頭已經超過鎖定點,戰鬥區要在目前位置鎖住,不能把鏡頭往回拉 → 鎖定位置取 `max(lockScrollX, 目前 scrollX)`。測試在 Task 2。
3. **戰鬥區鎖住時,魔物從畫面外的左右兩側進場:** 玩家仍被夾在畫面內,魔物不受畫面夾限,能走進來;落在畫面左側很遠的零星魔物要被清掉,不會越積越多 → 場景規則與 e2e。測試在 Task 4。
4. **刺蝟背對或滾動經過玩家時:** 只有從刺盾正面水平射來的子彈被擋;從背後或上下射來都打得到 → `bulletEffect` 純函式。測試在 Task 1。
5. **兩人都睡著觸發重來時正在戰鬥:** 重來後場上不殘留上一輪的魔物,戰鬥區狀態重新開始 → `scene.restart` 重建全部狀態。測試在 Task 4。

---

## File Structure

```
src/game/enemies.ts        # 魔物資料、行為、子彈判定(純函式)
src/game/encounters.ts     # 戰鬥區與零星魔物觸發(純函式)
src/game/camera.ts         # 新增 applyLock
src/game/enemyEntity.ts    # 一隻魔物的 Phaser 物件
src/scenes/TestRangeScene.ts  # 加入魔物、戰鬥區、零星魔物
tests/enemies.test.ts、tests/encounters.test.ts、tests/camera.test.ts(新增)
e2e/enemies.spec.ts
docs/playtest/m3a-checklist.md
```

---

### Task 1: 魔物資料、行為與子彈判定(純函式)

**Files:**
- Create: `src/game/enemies.ts`
- Test: `tests/enemies.test.ts`

**Interfaces:**
- Consumes:`MAX_DT_MS`。
- Produces:
  ```ts
  export type EnemyType = 'alarmBug' | 'coffeeBean' | 'nightBat' | 'hedgehog';
  export type EnemyTier = 'minion' | 'mid' | 'high' | 'boss';
  export interface EnemyDef { type: EnemyType; name: string; tier: EnemyTier; hp: number; w: number; h: number; color: number; flying: boolean; shield: boolean; }
  export const ENEMY_DEFS: Readonly<Record<EnemyType, EnemyDef>>;
  export type EnemyPhase = 'walk' | 'hop' | 'hover' | 'swoop' | 'roll';
  export interface EnemyBrain { phase: EnemyPhase; timerMs: number; facing: 1 | -1; }
  export interface EnemySense { x: number; y: number; grounded: boolean; targetX: number | null; dtMs: number; }
  export interface EnemyMove { vx: number; vy: number | null; brain: EnemyBrain; }   // vy null = 保留目前垂直速度(交給重力)
  export function initialBrain(type: EnemyType): EnemyBrain;
  export function stepEnemy(type: EnemyType, brain: EnemyBrain, sense: EnemySense): EnemyMove;
  export function bulletEffect(def: EnemyDef, enemyFacing: 1 | -1, bulletVx: number, bulletVy: number): 'hit' | 'blocked';
  ```
  `ENEMY_DEFS`:

  | type | name | tier | hp | w×h | flying | shield |
  |---|---|---|---|---|---|---|
  | alarmBug | 吵鬧鬧鐘蟲 | minion | 2 | 32×24 | false | false |
  | coffeeBean | 咖啡豆精靈 | minion | 2 | 24×28 | false | false |
  | nightBat | 熬夜蝙蝠 | minion | 1 | 32×20 | true | false |
  | hedgehog | 失眠刺蝟 | mid | 6 | 40×32 | false | true |

  行為(`dt = min(sense.dtMs, MAX_DT_MS)`,`timerMs` 每格加 `dt`;`targetX` 為 null 時不移動、面向不變;面向 = `targetX < x ? -1 : 1`,滾動中不轉向):
  - **alarmBug**:`phase 'walk'`;`vx = facing × 70`,`vy null`。
  - **coffeeBean**:`phase 'hop'`;在地上且 `timerMs >= 900` → `vy = -520`、`vx = facing × 130`、`timerMs = 0`;在空中 `vx = facing × 130`、`vy null`;在地上未到時間 `vx = 0`、`vy null`。
  - **nightBat**(不受重力):`hover` 時 `vy = (320 - y) × 4`,`|targetX - x| > 8` 則 `vx = facing × 100` 否則 0;`timerMs >= 2000` 且 `|targetX - x| < 60` → 轉 `swoop`、`timerMs = 0`。`swoop` 時 `vx = 0`、`vy = (440 - y) × 5`;`timerMs >= 700` → 回 `hover`、`timerMs = 0`。
  - **hedgehog**:`walk` 時 `vx = facing × 40`;`timerMs >= 3000` → 轉 `roll`、`timerMs = 0`。`roll` 時面向鎖定、`vx = facing × 260`;`timerMs >= 1000` → 回 `walk`、`timerMs = 0`。
  - `bulletEffect`:`def.shield` 為 true、`bulletVy === 0`、且 `Math.sign(bulletVx) === -enemyFacing`(子彈迎面而來)→ `'blocked'`;其他都是 `'hit'`。

- [ ] **Step 1:寫失敗測試 `tests/enemies.test.ts`**
  輔助 `sense(p: Partial<EnemySense>)` 預設 `{ x: 500, y: 460, grounded: true, targetX: 200, dtMs: 16 }`。
  - `'資料表:刺蝟是中階、6 血、有盾;蝙蝠會飛'`。
  - `'鬧鐘蟲朝目標走 70'`:目標在左 → `vx -70`、`facing -1`;目標在右 → `vx 70`。
  - `'沒有目標時不動'`:`targetX null` → `vx 0`。
  - `'咖啡豆每 900ms 跳一次'`:`timerMs 0` 跑 56 格 ×16ms(896ms)都沒有 `vy`;第 57 格 `vy -520`、`vx -130`、之後 `timerMs 0`。
  - `'咖啡豆在空中保持水平速度'`:`grounded false` → `vx -130`、`vy null`。
  - `'蝙蝠盤旋時往 y=320 拉'`:`y 400` → `vy (320-400)×4 = -320`。
  - `'蝙蝠在目標正上方盤旋 2 秒後俯衝,700ms 後回升'`:`x 200`、`targetX 210`,累積 2000ms → `phase 'swoop'`;俯衝中 `y 340` → `vy (440-340)×5 = 500`、`vx 0`;再 700ms → `hover`。
  - `'刺蝟走 3 秒後滾動 1 秒,滾動中不轉向'`:3000ms 後 `phase 'roll'`、`vx -260`;滾動中把 `targetX` 改到右邊 → `facing` 仍為 -1;1000ms 後回 `walk`。
  - `'dt 夾到 50'`:刺蝟單格 `dtMs 5000` → `timerMs 50`。
  - `bulletEffect`:刺蝟面向 -1(朝左),子彈 `vx +640, vy 0`(從左邊射來,迎面)→ `blocked`;子彈 `vx -640`(從右邊、打背後)→ `hit`;子彈 `vx 0, vy 640`(從上往下)→ `hit`;鬧鐘蟲任何方向 → `hit`。
- [ ] **Step 2:執行 `npm test`,預期 FAIL**
- [ ] **Step 3:實作 `src/game/enemies.ts`**
- [ ] **Step 4:執行 `npm test`、`npx tsc --noEmit`,預期 PASS**
- [ ] **Step 5:Commit**:`魔物資料、行為與刺盾判定`

---

### Task 2: 戰鬥區與零星魔物(純函式)、鏡頭鎖定

**Files:**
- Create: `src/game/encounters.ts`
- Modify: `src/game/camera.ts`
- Test: `tests/encounters.test.ts`、`tests/camera.test.ts`

**Interfaces:**
- Consumes:`EnemyType`(Task 1)、`MAX_DT_MS`。
- Produces(`encounters.ts`):
  ```ts
  export type SpawnFrom = 'left' | 'right' | 'top' | 'ground';
  export interface SpawnSpec { type: EnemyType; from: SpawnFrom; x?: number; delayMs: number; }   // x:top/ground 用的世界座標
  export interface ArenaDef { lockScrollX: number; waves: readonly (readonly SpawnSpec[])[]; }
  export interface TrickleDef { triggerScrollX: number; spawn: SpawnSpec; }
  export interface ActiveArena { lockX: number; wave: number; waveTimerMs: number; pending: SpawnSpec[]; }
  export interface EncounterState { nextArena: number; active: ActiveArena | null; tricklesFired: number; }
  export interface EncounterStep { state: EncounterState; spawns: { spec: SpawnSpec; arena: boolean }[]; lockScrollX: number | null; }
  export function initialEncounters(): EncounterState;
  export function stepEncounters(s: EncounterState, arenas: readonly ArenaDef[], trickles: readonly TrickleDef[], input: { scrollX: number; arenaEnemiesAlive: number; dtMs: number }): EncounterStep;
  ```
  規則(依序):
  1. 零星魔物:`trickles` 依 `triggerScrollX` 由小到大排列;把所有 `triggerScrollX <= scrollX` 且尚未觸發的依序輸出(`arena: false`),`tricklesFired` 增加。
  2. 沒有進行中的戰鬥區、還有下一個、且 `scrollX >= arenas[nextArena].lockScrollX` → 開始:`lockX = max(lockScrollX, scrollX)`、`wave 0`、`waveTimerMs 0`、`pending = 第 0 波的複本`。
  3. 進行中:先記下 `pendingWasEmpty = pending.length === 0`;`waveTimerMs += min(dt, MAX_DT_MS)`;把 `delayMs <= waveTimerMs` 的輸出(`arena: true`)並從 `pending` 移除;若 `pendingWasEmpty && arenaEnemiesAlive === 0` → 還有下一波就 `wave + 1`、`waveTimerMs 0`、`pending = 下一波`;沒有下一波就 `active = null`、`nextArena + 1`。
  4. `lockScrollX = active?.lockX ?? null`。
- Produces(`camera.ts`):`export function applyLock(targetScrollX: number, lockScrollX: number | null): number;`(null → target;否則 `min(target, lock)`)

- [ ] **Step 1:寫失敗測試**
  `tests/encounters.test.ts`(輔助:`A = { lockScrollX: 1000, waves: [[{ type: 'alarmBug', from: 'right', delayMs: 0 }, { type: 'alarmBug', from: 'right', delayMs: 400 }], [{ type: 'nightBat', from: 'left', delayMs: 0 }]] }`,`T = [{ triggerScrollX: 300, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } }]`):
  - `'鏡頭到 300 輸出零星魔物一次'`:`scrollX 299` → 無;`300` → 1 隻 `arena false`;再一格 → 無。
  - `'一次跨過多個零星點會全部輸出'`:兩個 trickle(300、500),`scrollX 600` → 2 隻。
  - `'到達 lockScrollX 開始戰鬥並鎖住鏡頭'`:`scrollX 1000` → `lockScrollX 1000`、輸出第 0 波 `delayMs 0` 的那隻。
  - `'延遲生成'`:接著 `dtMs 50` 跑 8 格(400ms)→ 第二隻在第 8 格輸出。
  - `'最後一隻生成的那一格不會判定清完'`:第二隻輸出的那一格 `arenaEnemiesAlive 0` → 仍為 `wave 0`、仍鎖住。
  - `'清完一波進下一波,清完最後一波解鎖'`:之後 `arenaEnemiesAlive 0` → `wave 1` 並輸出蝙蝠;下一格 `arenaEnemiesAlive 1` → 不變;再下一格 `0` → `lockScrollX null`、`nextArena 1`。
  - `'還有魔物時不前進'`:第 0 波全部生成後 `arenaEnemiesAlive 2` → 仍 `wave 0`。
  - `'從戰鬥區中間重來不會把鏡頭往回拉'`:`initialEncounters()` 搭配 `scrollX 1616` → `lockScrollX 1616`。
  `tests/camera.test.ts` 新增:`'applyLock'`:`applyLock(700, null) === 700`;`applyLock(700, 500) === 500`;`applyLock(400, 500) === 400`。
- [ ] **Step 2:執行 `npm test`,預期 FAIL**
- [ ] **Step 3:實作**
- [ ] **Step 4:執行 `npm test`、`npx tsc --noEmit`,預期 PASS**
- [ ] **Step 5:Commit**:`戰鬥區與零星魔物觸發、鏡頭鎖定`

---

### Task 3: 魔物上場:`EnemyEntity`、碰撞、受傷與刺盾

**Files:**
- Create: `src/game/enemyEntity.ts`
- Modify: `src/scenes/TestRangeScene.ts`、`src/main.ts`(`GkDebug` 擴充)
- Test: `e2e/enemies.spec.ts`

**Interfaces:**
- Consumes:Task 1 全部;既有 `PlayerEntity`、`hurtPlayer`、子彈群組、打倒效果(停頓、晃動、Zzz)。
- Produces:
  ```ts
  export class EnemyEntity {
    readonly def: EnemyDef; readonly body: Phaser.GameObjects.Rectangle; brain: EnemyBrain; hp: number; readonly arena: boolean;
    constructor(scene: Phaser.Scene, type: EnemyType, x: number, feetY: number, arena: boolean);
    update(targetX: number | null, dtMs: number): void;   // stepEnemy → 套用速度;飛行魔物關閉重力
    render(): void;                                        // 刺蝟依面向在盾那側畫白邊
    debug(): EnemyDebug;
  }
  ```
  `EnemyDebug = { type: EnemyType; hp: number; x: number; y: number; facing: 1 | -1; phase: EnemyPhase; arena: boolean }`(定義於 `src/main.ts`)。
  `GkDebug` 新增:`enemies?: EnemyDebug[]`、`enemiesDefeated?: number`、`blockedShots?: number`、`arena?: { locked: boolean; wave: number; nextArena: number }`、`spawn?: (type: EnemyType, x: number, y?: number) => void`、`defeatAll?: () => void`。`spawn` 與 `defeatAll` 只在 `testHooks` 時掛上。
- 場景規則:
  - 地面魔物與地形碰撞、受重力(`gravity` 同玩家的 tuning);飛行魔物不受重力。
  - 魔物的目標 = 最近的醒著玩家的 x;沒有醒著的玩家時為 null。
  - 子彈碰到魔物 → `bulletEffect`:`hit` 扣 1 血並閃白壓扁(同練習靶),`blocked` 子彈消失、`blockedShots + 1`、魔物不扣血。血量 0 → 打倒效果、移除魔物、`enemiesDefeated + 1`。
  - 魔物碰到醒著玩家 → `hurtPlayer(p, true)`。
  - x 小於 `scrollX - 200` 的魔物直接移除(不算打倒)。
  - `defeatAll`:對所有魔物套用打倒流程。

- [ ] **Step 1:寫失敗 e2e `e2e/enemies.spec.ts`**(皆用 `./?mode=single&test=1`;等 `screen === 'range'`;輔助 `spawn(page, type, x, y?)`)
  - `'鬧鐘蟲會朝玩家走過來,碰到扣愛心'`:`spawn('alarmBug', 600)` → 2000ms 內 `enemies[0].x` 變小;等到 `players[0].hearts === 2`(逾時 8000ms)。
  - `'射擊打倒鬧鐘蟲'`:`spawn('alarmBug', 500)`;按住 `KeyC` 直到 `enemiesDefeated === 1`(逾時 4000ms);`enemies.length === 0`。
  - `'刺蝟正面擋子彈'`:`spawn('hedgehog', 520)`;按住 `KeyC` 1200ms → `blockedShots > 0`,`enemies[0].hp === 6`。
  - `'蝙蝠在頭上,往上射打得到'`:`spawn('nightBat', 160, 320)`;按住 `KeyW` 與 `KeyC` 直到 `enemiesDefeated === 1`(逾時 5000ms)。
  - `'咖啡豆會跳'`:`spawn('coffeeBean', 600)`;3000ms 內 `enemies[0].y` 曾小於 440。
  - `'跑到畫面左方很遠的魔物會被清掉'`:`spawn('alarmBug', 100)` 後立刻把它的目標失效不易做到,改為:玩家往右跑使 `cameraX > 400`,`spawn('nightBat', 50, 320)`(在 `scrollX - 200` 左邊)→ 下一格起 `enemies.length === 0`。
- [ ] **Step 2:執行 `npm run e2e`,預期新測試 FAIL**
- [ ] **Step 3:實作 `EnemyEntity` 與場景整合**
- [ ] **Step 4:執行 `npm test`、`npx tsc --noEmit`、`npm run e2e`,預期全部 PASS**
- [ ] **Step 5:Commit**:`魔物上場:碰撞、受傷、刺盾與打倒`

---

### Task 4: 戰鬥區與零星魔物接進靶場

**Files:**
- Modify: `src/scenes/TestRangeScene.ts`
- Test: `e2e/enemies.spec.ts`(新增)

**Interfaces:**
- Consumes:`stepEncounters`、`initialEncounters`、`applyLock`(Task 2);`EnemyEntity`(Task 3)。
- 靶場資料(世界寬 3200,視窗 960):
  - 零星魔物:`{ triggerScrollX: 300, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } }`、`{ triggerScrollX: 700, spawn: { type: 'nightBat', from: 'right', delayMs: 0 } }`。
  - 戰鬥區 1:`lockScrollX 1500`,三波:
    1. `alarmBug` 右 ×3,`delayMs 0 / 500 / 1000`;
    2. `nightBat` 左(0)、`nightBat` 右(300)、`coffeeBean` 上 `x 1980`(600);
    3. `hedgehog` 右(0)、`coffeeBean` 地面 `x 1700`(800)。
  - 戰鬥區 2:`lockScrollX 2240`,一波:`coffeeBean` 地面 `x 2600`(0)、`coffeeBean` 地面 `x 2850`(400)、`alarmBug` 左(800)。
- 生成位置:`left` → `x = scrollX - 20`;`right` → `x = scrollX + 960 + 20`;地面魔物腳底 `y = 480`,飛行魔物 `y = 320`;`top` → `(spec.x, -30)` 從上方掉下;`ground` → `(spec.x, 480)`,出現時從透明淡入 300ms 並帶一個小土堆色塊效果。
- 每格:`stepEncounters(…, { scrollX, arenaEnemiesAlive: 場上 arena 魔物數, dtMs })`;鏡頭 `target = applyLock(advanceTeamCamera(...), lockScrollX)`,再經 `limitCameraStep`。
- 鎖定中 HUD 第三行顯示「清除魔物!(第 N / M 波)」,解鎖時顯示「前進 →」1500ms。

- [ ] **Step 1:在 `e2e/enemies.spec.ts` 新增失敗測試**
  - `'走過 300 會有鬧鐘蟲從右邊出現'`:`./?mode=single`,按住 `KeyD` 直到 `cameraX >= 300` → 1000ms 內 `enemies` 有一隻 `type 'alarmBug'` 且 `x > cameraX + 900`(從右側進場)。
  - `'戰鬥區鎖住鏡頭,清完才解鎖'`:`./?mode=single&test=1`;用第二步的 `hopRight` 前進直到 `arena.locked === true`(逾時 30000ms,途中遇到魔物用 `defeatAll` 清掉);記下 `cameraX`;按住 `KeyD` 1500ms → `cameraX` 不變;重複呼叫 `defeatAll` 並等待直到 `arena.locked === false` 且 `arena.nextArena === 1`(逾時 20000ms);之後按住 `KeyD` 1000ms → `cameraX` 增加。
  - `'戰鬥中重來不殘留魔物'`:`./?mode=single&test=1`;進入戰鬥區 1 鎖住後,`hurtUntilDown([0])` → 等 `restarts === 1` → 重來後(檢查點 1200,`cameraX 816`)場上沒有任何 `arena: true` 的魔物、`arena.locked === false`(零星魔物 300、700 會因為鏡頭已超過而重新出現,屬正常)。
- [ ] **Step 2:執行 `npm run e2e`,預期新測試 FAIL**
- [ ] **Step 3:實作**
- [ ] **Step 4:執行全部測試,預期 PASS**
- [ ] **Step 5:截圖自查**:戰鬥區鎖住時 HUD、魔物從左右進場、從上方掉落、從地面冒出、刺蝟白邊盾牌方向。
- [ ] **Step 6:Commit**:`戰鬥區與零星魔物接進靶場`

---

### Task 5: 試玩清單

**Files:**
- Create: `docs/playtest/m3a-checklist.md`

- [ ] **Step 1:撰寫試玩清單(繁體中文)**:網址(單人、雙人);新魔物介紹與對付方法(鬧鐘蟲連射、咖啡豆抓時機、蝙蝠往上射或蹲下躲、刺蝟正面打不動要跳過去打背後或從上面往下打);戰鬥區鎖住與「清除魔物!」提示、第幾波;移動途中的零星魔物;要回報的感覺(魔物速度、血量、波次節奏太快或太慢、哪隻太難或太簡單)。
- [ ] **Step 2:Commit**:`第三步之一試玩清單`

---

## 完成條件

- `npm test`、`npx tsc --noEmit`、`npm run e2e` 全部通過;截圖自查完成。
- 獨立審查一次,修正後推上分支,經葉宸佑同意後合併到 `main`。
