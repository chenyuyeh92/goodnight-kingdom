# 第三步之三「第一關失眠森林、關主熬夜貓頭鷹、出發前選武器」實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出第一關「失眠森林」的完整地圖(三段加關主戰)、關主熬夜貓頭鷹(三階段)、通關結算畫面,以及出發前從背包挑武器的畫面;開場選單直接進第一關,測試靶場改用網址參數進入。

**Architecture:** 把目前寫死在場景裡的地形、荊棘、檢查點、寶箱、戰鬥區、零星魔物抽成「關卡資料」(`LevelDef`),靶場與失眠森林各是一份資料,同一個場景依資料建構。貓頭鷹的行為與攻擊寫成純函式並以 Vitest 測試。魔物發射的羽毛用獨立的 `EnemyShotSystem`。選武器與結算各是一個新場景。

**Tech Stack:** 同前。

**Spec:** `docs/superpowers/specs/2026-10-20-goodnight-kingdom-design.md`(6.2 關主、6.3 第一關結構、5.1「出關前從背包挑一把」、4.4 鏡頭鎖定)

**範圍說明:** 全部用色塊;美術素材(`origin/art/style-guide` 分支已有第一版)在 3d 接入。關卡內容的魔物數量與數值是第一版,試玩後再調。

## Global Constraints

- 沿用前面計畫的 Global Constraints。
- 網址 `?level=range` 進測試靶場;沒有指定時進失眠森林。既有 e2e 一律改成帶 `level=range`,行為不變。
- 失眠森林:三段 + 關主戰,每段開頭有檢查點;一個明顯寶箱、一個隱藏寶箱、一個明顯寶箱(企劃 6.3)。
- 關主熬夜貓頭鷹:血量單人 60、雙人 90;血量 66% 與 33% 時進入下一階段,越來越暴躁(攻擊更頻繁、羽毛更多、召喚小怪)。
- 出發前選武器:背包裡有特殊武器才顯示選擇畫面;單人選一次,雙人玩家 A、B 依序各選一次;可以選「只帶哈欠泡泡」。
- 通關後顯示結算:花費時間、打倒魔物數、找到的寶箱數(x/3)、這次拿到的武器;可以「再玩一次」或「回到選單」。
- 落到世界外(下方或左右邊界外)的魔物要移除,避免戰鬥區永遠清不完(3a 審查留下的問題)。

## Review Focus

1. **關主戰中睡著重來:** 從關主前的檢查點重來,貓頭鷹血量回滿、召喚出的小怪與羽毛全部消失、戰鬥區重新鎖定,不殘留上一輪的狀態 → `scene.restart` 重建。測試在 Task 4。
2. **貓頭鷹在階段轉換的瞬間被打到 0 血:** 直接進入打倒流程,不會卡在轉換動畫或出現第四階段 → `stepOwl` 以血量比例決定階段,0 血優先。測試在 Task 3 與 Task 4。
3. **戰鬥區魔物掉出世界或生成在世界外:** 不會讓戰鬥區永遠無法解鎖 → 生成位置夾在世界內,落到 `y > WORLD_H + 100` 的魔物移除。測試在 Task 1。
4. **背包裡完全沒有武器、或存檔壞掉:** 跳過選武器畫面直接開始,不卡住 → 選武器場景的進入條件。測試在 Task 6。
5. **雙人選武器時兩人選同一把:** 允許,兩人各自滿彈藥 → 測試在 Task 6。

---

## File Structure

```
src/levels/levelDef.ts      # LevelDef 型別、共用常數
src/levels/range.ts         # 測試靶場資料(從場景搬出)
src/levels/forest.ts        # 失眠森林資料
src/game/owl.ts             # 貓頭鷹行為、羽毛、召喚(純函式)
src/game/enemyShots.ts      # 魔物子彈(羽毛)的 Phaser 物件
src/game/runStats.ts        # 本次遊玩的統計(純)
src/scenes/TestRangeScene.ts# 依 LevelDef 建構;關主戰;結算觸發
src/scenes/LoadoutScene.ts  # 出發前選武器
src/scenes/LevelCompleteScene.ts
src/scenes/ModeSelectScene.ts、src/main.ts
tests/levels.test.ts、tests/owl.test.ts、tests/runStats.test.ts
e2e/forest.spec.ts
docs/playtest/m3c-checklist.md
```

---

### Task 1: 關卡資料化(行為不變)與落出世界的魔物

**Files:** Create `src/levels/levelDef.ts`、`src/levels/range.ts`;Modify `src/scenes/TestRangeScene.ts`、`src/main.ts`、所有 `e2e/*.spec.ts`(路徑加 `level=range`);Test `tests/levels.test.ts`、`e2e/enemies.spec.ts`(新增)

**Interfaces:**
- Produces:
  ```ts
  export type LevelId = 'range' | 'forest';
  export interface Rect { x: number; y: number; w: number; h: number; }          // 左上角
  export interface LevelDef {
    id: LevelId; name: string; worldW: number;
    terrain: readonly Rect[];
    thorns: readonly { x: number; w: number }[];
    checkpoints: readonly number[];
    chests: readonly { x: number; bottom: number }[];
    targets: readonly { x: number; bottom: number }[];     // 練習靶,森林為空
    trickles: readonly TrickleDef[];
    arenas: readonly ArenaDef[];
    boss: { lockScrollX: number; spawnX: number } | null;  // Task 4 使用
  }
  export const WORLD_H = 540; export const GROUND_Y = 480;
  export function parseLevelId(v: string | null): LevelId;   // 'range' → range,其他 → forest
  export const LEVELS: Readonly<Record<LevelId, LevelDef>>;  // 放在 src/levels/index.ts 以免循環引用
  ```
  `TestRangeData` 新增 `level?: LevelId`(預設 `'forest'`);場景所有原本的常數陣列改讀 `LevelDef`;世界寬度、鏡頭邊界、`advanceTeamCamera` 的 `worldW` 都改用 `level.worldW`。`GkDebug` 新增 `level?: LevelId`。
  落出世界:魔物生成 x 夾在 `[def.w/2, worldW − def.w/2]`;每格移除 `y > WORLD_H + 100` 的魔物(不算打倒)。
- 這一步森林資料先用靶場資料的複本佔位(`forest.ts` 匯出與 range 相同內容但 `id: 'forest'`),Task 2 才填正式地圖。

- [ ] **Step 1:寫失敗測試**
  `tests/levels.test.ts`:`'parseLevelId'`(`'range'` → range;`null`、`'x'` → forest);`'靶場資料與搬移前一致'`(檢查點 `[150, 1200, 2000]`、寶箱 3 個且第一個 x 960、戰鬥區 2 個、`worldW 3200`)。
  `e2e/enemies.spec.ts` 新增:`'掉出世界的魔物會被移除'`(`?level=range&mode=single&test=1`,`spawn('alarmBug', 1000, 700)`(世界下方)→ 500ms 內 `enemies.length === 0`);`'在世界右邊外生成的魔物會被夾回世界內'`(`spawn('alarmBug', 5000)` → `enemies[0].x <= 3200`)。
- [ ] **Step 2:更新所有既有 e2e 路徑加上 `level=range`(以 `sed` 將 `'./?mode=` 換成 `'./?level=range&mode=`,開場選單相關測試另外處理:選單進入的關卡在本任務仍是森林佔位資料,與靶場相同,斷言不受影響)**
- [ ] **Step 3:執行測試,預期新測試 FAIL、既有測試 PASS**
- [ ] **Step 4:實作**
- [ ] **Step 5:執行 `npm test`、`npx tsc --noEmit`、`npm run e2e`,預期全部 PASS**
- [ ] **Step 6:Commit**:`關卡資料化:靶場資料搬出場景,移除落出世界的魔物`

---

### Task 2: 失眠森林地圖資料

**Files:** Modify `src/levels/forest.ts`;Test `tests/levels.test.ts`(新增)

**地圖(`worldW 5600`,地面 y 480):**

| 段落 | x 範圍 | 內容 |
|---|---|---|
| 第一段(教學) | 0–1500 | 檢查點 150。平台 `(500,380,200×20)`、`(1100,340,180×20)`。零星魔物:鏡頭 200 鬧鐘蟲右、450 咖啡豆右。明顯寶箱 x 820。荊棘 `(1300,60)`。戰鬥區 A `lockScrollX 700`:第 1 波 鬧鐘蟲右 ×3(0/500/1000);第 2 波 咖啡豆上 x 1300(0)、咖啡豆地面 x 1500(400)。 |
| 第二段(蝙蝠與低處通道) | 1500–3000 | 檢查點 1550。低矮通道天花板 `(2100,380,260×64)`。高平台階梯 `(2500,400,100×20)`、`(2640,320,100×20)`、`(2780,240,140×20)`,隱藏寶箱 x 2850、底部 240。零星魔物:鏡頭 1300 蝙蝠右、1650 蝙蝠右、1900 鬧鐘蟲左。荊棘 `(1850,60)`。戰鬥區 B `lockScrollX 2000`(在通道之後):蝙蝠左(0)、蝙蝠右(300)、咖啡豆地面 x 2500(600);第 2 波 蝙蝠右 ×2(0/400)、鬧鐘蟲左(800)。 |
| 第三段(刺蝟) | 3000–4400 | 檢查點 3050。平台 `(3400,380,200×20)`、`(3900,360,160×20)`。零星魔物:鏡頭 2800 咖啡豆右、3200 鬧鐘蟲右。荊棘 `(3300,60)`、`(4200,80)`。戰鬥區 C `lockScrollX 3300`:刺蝟右(0)、鬧鐘蟲左 ×2(500/900);第 2 波 刺蝟左(0)、刺蝟右(600)、蝙蝠上 x 3800(1000)。明顯寶箱 x 4300。 |
| 關主戰 | 4400–5600 | 檢查點 4500。`boss: { lockScrollX: 4640, spawnX: 5300 }`(鎖定後畫面 4640–5600 正好到世界盡頭)。關主區地面平坦,兩個踏板 `(4800,360,140×20)`、`(5300,360,140×20)` 方便往上射與閃躲。 |

- [ ] **Step 1:寫失敗測試(`tests/levels.test.ts` 新增,針對 `LEVELS.forest`)**
  - `'三段加關主,每段開頭有檢查點'`:`checkpoints` 為 `[150, 1550, 3050, 4500]`。
  - `'三個寶箱,第二個在高處'`:長度 3,`chests[1].bottom < 300`。
  - `'隱藏寶箱跳得上去'`:每一級平台與前一級(或地面)的高度差 ≤ 140(跳躍高度約 145)。
  - `'低矮通道蹲得過、站不過'`:通道天花板底部與地面距離介於 28 與 48 之間。
  - `'戰鬥區與關主鎖定點都在世界內'`:`lockScrollX + 960 <= worldW`。
  - `'所有戰鬥區都不使用 right 從世界盡頭外生成'`:`lockScrollX + 960 + 20 <= worldW` 或該戰鬥區沒有 `right`。
  - `'零星魔物與戰鬥區照位置排列、互不重疊'`:戰鬥區的鎖定範圍不重疊,關主鎖定點在所有戰鬥區之後。
- [ ] **Step 2–4:FAIL → 填資料 → PASS**
- [ ] **Step 5:Commit**:`失眠森林地圖資料`

---

### Task 3: 熬夜貓頭鷹的行為(純函式)

**Files:** Create `src/game/owl.ts`;Modify `src/game/enemies.ts`(加 `nightOwl` 資料);Test `tests/owl.test.ts`

**Interfaces:**
- `ENEMY_DEFS.nightOwl`:`{ name: '熬夜貓頭鷹', tier: 'boss', hp: 60, w: 96, h: 80, color: 0x8a7a5c, flying: true, shield: false }`。`EnemyType` 加上 `'nightOwl'`;`stepEnemy` 遇到 `nightOwl` 回傳不動(貓頭鷹由 `stepOwl` 控制)。
- Produces:
  ```ts
  export type OwlMode = 'hover' | 'swoop' | 'recover' | 'angry';
  export interface OwlBrain { mode: OwlMode; timerMs: number; phase: 1 | 2 | 3; hovers: number; swoopTargetX: number; }
  export interface OwlSense { x: number; y: number; hpRatio: number; targetX: number | null; arenaLeft: number; arenaRight: number; timeMs: number; dtMs: number; minionsAlive: number; }
  export interface OwlStep { vx: number; vy: number; brain: OwlBrain; feathers: { vx: number; vy: number }[]; summon: ('left' | 'right')[]; enteredPhase: 2 | 3 | null; invulnerable: boolean; }
  export const OWL_HOVER_Y = 150;
  export const OWL_SWOOP_Y = 420;
  export function owlPhase(hpRatio: number): 1 | 2 | 3;     // > 0.66 → 1;> 0.33 → 2;其他 → 3
  export function initialOwlBrain(): OwlBrain;
  export function stepOwl(b: OwlBrain, s: OwlSense): OwlStep;
  ```
  規則(dt 夾 50):
  - 階段由 `owlPhase(hpRatio)` 決定;比目前高時進入 `angry` 1000ms(`invulnerable true`、原地抖動 `vx = ±60` 交替、不攻擊),結束後回 `hover`,`enteredPhase` 在進入的那一格回傳新階段。`hpRatio <= 0` 時不進入 angry。
  - `hover`:往 `(arenaLeft + arenaRight)/2 + 250·sin(timeMs/900)`、`OWL_HOVER_Y` 移動(速度 = 位移 × 3,夾在 ±300)。進入 hover 的第一格放一波羽毛:數量 階段 1/2/3 = 3/5/7,以正下方為中心、總角度 40°/70°/100° 平均分布,速度 260。停留時間 階段 1/2/3 = 2600/2000/1400ms,結束時(有目標)轉 `swoop`,`swoopTargetX = targetX`。
  - 階段 2 以上,每第 2 次 hover 開始時,若 `minionsAlive < 4` 則 `summon = ['left', 'right']`。
  - `swoop`:往 `(swoopTargetX, OWL_SWOOP_Y)` 直線飛,速度 階段 1/2/3 = 420/480/560;到達(距離 < 20)或 900ms 後轉 `recover`。
  - `recover`:往上 `vy = -260`、`vx = 0`,700ms 後回 `hover`。
  - `targetX` 為 null 時停在 hover 不俯衝。
- [ ] **Step 1:寫失敗測試(`tests/owl.test.ts`)**
  - `'owlPhase 邊界'`:`1` → 1、`0.67` → 1、`0.66` → 2、`0.34` → 2、`0.33` → 3、`0` → 3。
  - `'進入 hover 第一格放羽毛,階段 1 是 3 根、以正下方為中心'`:中間一根 `vx ≈ 0`、`vy ≈ 260`。
  - `'階段 3 放 7 根'`。
  - `'hover 2600ms 後俯衝向玩家位置'`。
  - `'俯衝到達或 900ms 後轉 recover,700ms 後回 hover'`。
  - `'血量降到 66% 以下進入 angry 1 秒、無敵、回報 enteredPhase 2'`;`'angry 期間不放羽毛'`。
  - `'階段 2 每第二次 hover 召喚兩隻小怪;小怪已有 4 隻時不召喚'`。
  - `'0 血時不進 angry'`(`hpRatio 0` → `invulnerable false`、`enteredPhase null`)。
  - `'沒有目標時不俯衝'`。
  - `'dt 夾 50'`。
- [ ] **Step 2–4:FAIL → 實作 → PASS**
- [ ] **Step 5:Commit**:`熬夜貓頭鷹:三階段行為、羽毛與召喚`

---

### Task 4: 關主戰接進場景

**Files:** Create `src/game/enemyShots.ts`;Modify `src/scenes/TestRangeScene.ts`、`src/main.ts`;Test `e2e/forest.spec.ts`

**Interfaces:**
- Consumes:Task 1–3。
- Produces:
  ```ts
  export class EnemyShotSystem {
    constructor(scene: Phaser.Scene, terrain: Phaser.Physics.Arcade.StaticGroup);
    fire(x: number, y: number, vx: number, vy: number): void;   // 羽毛:12×6 色塊 #f3e9d2,壽命 4000ms,碰地形消失
    addVictim(zone: Phaser.GameObjects.Zone, onHit: () => void): void;  // 碰到醒著的玩家 → onHit,羽毛消失
    update(): void; count(): number;
  }
  ```
- 場景規則:
  - `level.boss` 存在時:鏡頭 `scrollX >= boss.lockScrollX` 觸發關主戰 → 鏡頭鎖在 `boss.lockScrollX`,在 `spawnX` 上方 y 150 生成貓頭鷹(雙人時血量 90),HUD 中央上方顯示「熬夜貓頭鷹」與血條(寬 400、依血量縮短、階段 3 變紅)。
  - 每格以 `stepOwl` 控制貓頭鷹(`arenaLeft/Right` = 鎖定畫面左右邊界內縮 80;`targetX` = 最近醒著玩家);發射羽毛;召喚的小怪從畫面左右生成(鬧鐘蟲);`enteredPhase` 時畫面中央顯示「貓頭鷹越來越暴躁了!」1500ms 並晃動;`invulnerable` 期間子彈與揮擊對貓頭鷹 `ignored`。
  - 貓頭鷹碰到醒著的玩家 → 受傷(與一般魔物相同)。
  - 貓頭鷹血量 0 → 加重的打倒效果(停頓 ×3、晃動 ×2、Zzz 放大)、場上小怪與羽毛全部消失,1500ms 後進入結算(Task 5)。
  - 測試開關:`hurtBoss(n)`(對貓頭鷹扣 n 血,走一般命中規則含無敵)、`warp` 沿用;`GkDebug` 新增 `boss?: { hp: number; maxHp: number; phase: 1 | 2 | 3; mode: OwlMode } | null`、`enemyShots?: number`、`bossDefeated?: boolean`。
- [ ] **Step 1:寫失敗 e2e(`e2e/forest.spec.ts`,`?mode=single&test=1`,預設關卡為森林)**
  - `'走到關主區會鎖鏡頭並出現貓頭鷹'`:`warp(5000)` → 等 `boss !== null`、`boss.maxHp === 60`、`arena` 鎖定(`cameraX === 4640`)。
  - `'雙人時貓頭鷹血量 90'`(`?mode=duo&test=1`)。
  - `'貓頭鷹會放羽毛,羽毛打到會扣愛心'`:進入關主戰後 4000ms 內 `enemyShots > 0`;玩家站著不動 15000ms 內 `hearts < 3`。
  - `'打到 66% 以下進入第二階段並暫時無敵'`:`hurtBoss(21)` → `boss.phase === 2`、`boss.mode === 'angry'`;此時 `hurtBoss(5)` 血量不變。
  - `'階段轉換時打到 0 血直接倒下'`:`hurtBoss(59)`(血 1,會進 angry),等 angry 結束後 `hurtBoss(1)` → `bossDefeated === true`,`boss.phase` 不是 4。
  - `'關主戰睡著重來,貓頭鷹血量回滿、羽毛與小怪清空'`:`hurtBoss(30)` 後 `hurtUntilDown(0)` → `restarts === 1`、`checkpointX === 4500`;再次 `warp(5000)` → `boss.hp === 60`、`enemyShots === 0`。
- [ ] **Step 2–4:FAIL → 實作 → PASS(全部 e2e)**
- [ ] **Step 5:截圖自查**:關主戰全景(血條、羽毛)、階段轉換文字、第三階段紅血條。
- [ ] **Step 6:Commit**:`關主戰:熬夜貓頭鷹、羽毛、血條與階段轉換`

---

### Task 5: 通關結算畫面

**Files:** Create `src/game/runStats.ts`、`src/scenes/LevelCompleteScene.ts`;Modify `src/scenes/TestRangeScene.ts`、`src/main.ts`;Test `tests/runStats.test.ts`、`e2e/forest.spec.ts`(新增)

**Interfaces:**
- Produces:
  ```ts
  export interface RunStats { startedAt: number; defeated: number; chestsFound: number; chestsTotal: number; weaponsGot: SpecialWeaponId[]; restarts: number; }
  export function formatDuration(ms: number): string;          // 65_000 → '1 分 05 秒';9_000 → '0 分 09 秒'
  export function summaryLines(s: RunStats, endedAt: number): string[];
  ```
  `summaryLines`:`['通關時間 1 分 05 秒', '哄睡魔物 23 隻', '找到寶箱 2 / 3', '這次拿到:數羊機槍、搖籃曲豎琴', '睡著重來 1 次']`(沒拿到武器時寫「這次拿到:沒有」)。
- 統計跨重來累積:`TestRangeData` 新增 `stats?: RunStats`,重來時帶著走(`startedAt` 不變、`defeated` 累加、`chestsFound` 用 `openedChests.length`、開箱 `new`/`starUp` 時把武器加入 `weaponsGot`)。
- `LevelCompleteScene`(key `'LevelComplete'`):標題「失眠森林 通關!」、`summaryLines` 逐行、兩個按鈕「再玩一次(按 1)」→ 以同樣模式與目前背包重新開始(會再經過選武器畫面)、「回到選單(按 2)」。`window.__GK__ = { ready: true, screen: 'complete', summary: string[] }`。
- [ ] **Step 1:寫失敗測試**:`formatDuration` 兩個例子;`summaryLines` 有武器與沒有武器各一;e2e `'打倒貓頭鷹後出現結算,按 2 回到選單'`(`warp(5000)`、`hurtBoss(60)` 分次打到 0,穿過 angry → 等 `screen === 'complete'`,`summary` 含「通關時間」與「找到寶箱」;按 `Digit2` → `screen === 'mode-select'`)。
- [ ] **Step 2–4:FAIL → 實作 → PASS**
- [ ] **Step 5:Commit**:`通關結算畫面`

---

### Task 6: 出發前選武器

**Files:** Create `src/scenes/LoadoutScene.ts`;Modify `src/scenes/ModeSelectScene.ts`、`src/scenes/LevelCompleteScene.ts`(再玩一次的流程)、`src/main.ts`;Test `e2e/forest.spec.ts`(新增)

**Interfaces:**
- 流程:開場選單選單人/雙人 → 背包有特殊武器時進 `LoadoutScene`,否則直接進森林。`?mode=` 參數直接進關卡時不經過選武器(維持測試與快捷方式)。
- `LoadoutScene`(key `'Loadout'`):標題「玩家 A 選武器」(雙人選完 A 後換「玩家 B 選武器」);清單第一項「只帶哈欠泡泡」,之後是背包裡擁有的武器(等級上色、名稱、星等、彈藥上限)。操作:上下(W/S、↑/↓、觸控點選)移動游標,確認(C、逗號、Enter、空白鍵,或直接點擊項目);數字鍵 1–7 直接選。選完全部玩家 → `scene.start('TestRange', { ...data, mode, loadouts })`,`loadouts[i] = equip(id, stars)` 或 `BASE_LOADOUT`。
  `window.__GK__ = { ready: true, screen: 'loadout', loadoutFor: 'A' | 'B', loadoutOptions: string[] }`。
- [ ] **Step 1:寫失敗 e2e**
  - `'背包沒有武器時直接進森林'`(`addInitScript` 清空存檔;選單按 1 → `screen === 'range'`、`level === 'forest'`)。
  - `'存檔壞掉時也直接進森林'`(存檔寫入 `'{bad'`)。
  - `'單人選武器後帶著上場'`(存檔有 `sheepGun: 2`;選單按 1 → `screen === 'loadout'`、`loadoutOptions` 第一項含「哈欠泡泡」、第二項含「數羊機槍」;按 `Digit2` → `screen === 'range'`、`players[0].weapon === 'sheepGun'`、`ammo === 150`)。
  - `'雙人兩人可以選同一把'`(選單按 2 → A 按 `Digit2`、B 按 `Digit2` → 兩人 `weapon === 'sheepGun'`、`ammo === 150`)。
  - `'選只帶哈欠泡泡'`(按 `Digit1` → `weapon === 'yawnBubble'`)。
- [ ] **Step 2–4:FAIL → 實作 → PASS(全部 e2e)**
- [ ] **Step 5:Commit**:`出發前選武器`

---

### Task 7: 試玩清單與企劃文件

**Files:** Create `docs/playtest/m3c-checklist.md`;Modify 企劃文件 6.3、第 2 節

- [ ] **Step 1:試玩清單**:從選單開始的完整流程(選模式 → 選武器 → 第一關三段 → 關主 → 結算);三個寶箱的位置提示(第二個隱藏在第二段的高平台階梯頂端);貓頭鷹三階段怎麼打(羽毛往下撒、俯衝時蹲下或跳開、第二階段會叫鬧鐘蟲);手機與電腦都可以玩;靶場改用 `?level=range`;要回報:每段長度與難度、關主血量與節奏、哪裡卡關、通關花了多久。
- [ ] **Step 2:企劃文件 6.3 補上實際地圖重點與關主三階段規則;第 2 節補「出發前選武器」「通關結算」**
- [ ] **Step 3:Commit**:`第三步之三試玩清單,企劃文件同步`

---

## 完成條件

- `npm test`、`npx tsc --noEmit`、`npm run e2e` 全部通過;截圖自查完成。
- 獨立審查一次,修正後推上分支並合併到 `main`。
