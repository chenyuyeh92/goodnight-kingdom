# 雜魚變多 + 三種新機關(第一次上線) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全部關卡與魔王戰的雜魚變多;移動平台、彈跳墊、會掉的平台三種機關可以用,世界 1 三關先放上去。

**Architecture:** 純邏輯放 `src/game/fodder.ts`(各世界雜魚表、零星雜魚變一群、戰鬥區加雜魚、魔王叫雜魚的計時)與 `src/game/gadgets.ts`(移動平台位置、會掉平台的時間軸、彈跳速度),單元測試;場景 `TestRangeScene` 接上生成與物理;關卡資料 `LevelDef` 加 `movers`、`springs`、`crumbles` 三個欄位。

**Tech Stack:** Phaser 4.2.1 Arcade Physics、TypeScript、vitest、Playwright。

**Spec:** `docs/superpowers/specs/2026-10-23-fodder-terrain-design.md`(本計畫做「分三次上線」的第 1 次)。

## Global Constraints

- 雜魚表照設計文件(世界 1 alarmBug / nightBat … 世界 10 pillowSoldier / noisyStar;世界 3 clownfish / jellyfish 都是游的)。
- 零星雜魚 → 一群 3 隻,後兩隻晚 250 ms、500 ms;戰鬥區每波多 2 隻(一地一飛)。
- 魔王叫雜魚:間隔 第一階段 6000 ms、第二 5000、第三 4000;一群 3 隻(地 2 飛 1);這個系統叫的最多同時 6 隻;夢貘集氣時、魔王被打倒後不叫。
- 彈跳墊往上速度 950;寬 56。會掉的平台:站上 800 ms 掉、4000 ms 長回。移動平台用 cos 平滑來回。
- 世界 3 不放新機關。魔王區(lockScrollX 之後)不放新機關。
- 新的畫面文字要重新產生字型(`python3 tools/build_web_assets.py`,之後刪掉未追蹤的過渡背景)。

## Review Focus

- 雙人一起站在移動平台上、一起踩彈跳墊、一人站在會掉的平台上另一人在下面。→ Task 4 e2e 用 duo 檢查兩人都被載。
- 從檢查點重來(scene.restart)時,掉下去的平台、移動平台位置都回到原狀;被擋在半路的計時器不殘留。→ Task 4 e2e:平台掉下去後讓玩家睡著重來,平台在原位。
- 移動平台往上把玩家托起、往下時玩家不會「飄」起來一格一格掉(下降時要貼著)。→ Task 4 e2e 取樣下降途中玩家腳底與平台頂差 ≤ 2。
- 魔王叫雜魚在魔王被打倒的同一格、夢貘集氣中、遊戲暫停(hit-stop)時不叫。→ Task 2 單元測試 `paused`。
- 魔王叫的雜魚掉進河溝(有河溝的魔王區)不會一直補不停:被移除的就從計數拿掉。→ Task 2 e2e:計數跟著場上數量。

---

### Task 1: 雜魚純邏輯 `src/game/fodder.ts`

**Files:** Create `src/game/fodder.ts`;Test `tests/fodder.test.ts`

**Interfaces — Produces:**
- `WORLD_FODDER: Readonly<Record<number, { ground: EnemyType; flying: EnemyType }>>`(1–10)
- `isFodder(world: number, type: EnemyType): boolean`
- `fodderEchoes(spec: SpawnSpec): SpawnSpec[]` — 回傳兩隻跟班:`delayMs` 250、500;會飛/游的 `y` 各錯開 +40、−40(沒有 y 時不加);ground/top 的 `x` 各錯開 +40、+80。
- `addArenaFodder(arenas: readonly ArenaDef[], world: number): ArenaDef[]` — 每波加 `{ type: ground, from: 'right', delayMs: last+300 }`、`{ type: flying, from: 'left', delayMs: last+600 }`(last = 該波最大 delayMs)。
- `interface BossFodder { timerMs: number; side: 'left' | 'right' }`、`initialBossFodder()`
- `BOSS_FODDER_MS = { 1: 6000, 2: 5000, 3: 4000 }`、`BOSS_FODDER_MAX = 6`
- `stepBossFodder(s: BossFodder, i: { phase: 1|2|3; alive: number; paused: boolean; dtMs: number }): { state: BossFodder; count: number; side: 'left'|'right' }` — paused 時計時不動、count 0;計時到 → count = min(3, MAX − alive)(≤0 就等,計時停在門檻);叫了之後 side 換邊、計時歸零。

- [ ] Step 1 寫失敗測試:每個世界 1–10 都有、雜魚血量 ≤ 3;`fodderEchoes` 兩隻、delay 250/500、y 錯開;`addArenaFodder` 每波 +2、delay 在最後;`stepBossFodder`:5999 ms 不叫、6000 叫 3 隻、換邊;第三階段 4000 就叫;alive 5 → 叫 1;alive 6 → 不叫且下一格 alive 3 就叫 3;paused 時不累計。
- [ ] Step 2 `npx vitest run tests/fodder.test.ts` → FAIL。
- [ ] Step 3 實作。
- [ ] Step 4 → PASS。
- [ ] Step 5 commit。

### Task 2: 場景接上雜魚

**Files:** Modify `src/scenes/TestRangeScene.ts`、`src/main.ts`(`GkDebug.fodder: { bossAlive: number; echoes: number }`);Test `e2e/fodder.spec.ts`(新檔)

- create:`this.level = { ...level, arenas: addArenaFodder(level.arenas, level.world) }`(在 `this.level` 指定處)。
- `updateEncounters`:零星生成(arena=false)若 `isFodder(world, type)`,用 `this.time.delayedCall(echo.delayMs, …)` 再生跟班(`echoes` 計數)。
- 魔王戰:`updateBoss` 有魔王時每格 `stepBossFodder`;phase = `boss.enemy.bossPhase`;paused = 物理暫停 || `this.nightmare !== null` || bossDefeated;alive = 這系統叫的、仍在 `this.enemies` 裡的數量;叫的時候 地 2(delay 0、300 ms)+ 飛 1(150 ms)從 side 那邊出來。

- [ ] Step 1 e2e(失敗):`w1-1` warp 到魔王區,7 秒內 `fodder.bossAlive ≥ 1`;14 秒內 `bossAlive ≤ 6`;`w10-3` 夢貘換階段集氣中(`w10.nightmare !== null`)期間 bossAlive 不增加;`w1-1` 開頭走到第一個零星雜魚,`fodder.echoes ≥ 2`。
- [ ] Step 2 build + 跑 → FAIL。
- [ ] Step 3 實作。
- [ ] Step 4 build + 跑 → PASS;再跑 `e2e/levelSelect.spec.ts e2e/world10.spec.ts e2e/smoke.spec.ts`(戰鬥區波數變多,檢查是否有測試依賴固定數量,有的話依新規則改)。
- [ ] Step 5 commit。

### Task 3: 機關純邏輯 `src/game/gadgets.ts` 與關卡欄位

**Files:** Create `src/game/gadgets.ts`;Modify `src/levels/levelDef.ts`;Test `tests/gadgets.test.ts`

**Interfaces — Produces:**
- `LevelDef.movers?: readonly MoverDef[]`(`{ x, y, w, dx, dy, periodMs }`,x/y 是起點左上角)、`springs?: readonly { x: number; y?: number }[]`、`crumbles?: readonly Rect[]`
- `moverOffset(m: MoverDef, tMs: number): { x: number; y: number }` — `(1 − cos(2π t / period)) / 2` 乘 dx、dy
- `SPRING_VY = 950`、`SPRING_W = 56`、`SPRING_H = 18`
- `type CrumbleState = { phase: 'solid' | 'shaking' | 'fallen'; ms: number }`、`stepCrumble(s, stoodOn: boolean, dtMs): CrumbleState`(solid 被站上 → shaking;shaking 800 ms → fallen;fallen 4000 ms → solid;shaking 時離開也繼續掉)
- `CRUMBLE_SHAKE_MS = 800`、`CRUMBLE_RESPAWN_MS = 4000`

- [ ] Step 1 失敗測試:moverOffset 0 / period/2 / period;stepCrumble 時間軸;彈跳高度 `SPRING_VY² / (2 × gravity) ≥ 1.8 × 一般跳`。
- [ ] Step 2 → FAIL;Step 3 實作;Step 4 → PASS;Step 5 commit。

### Task 4: 場景接上三種機關

**Files:** Modify `src/scenes/TestRangeScene.ts`、`src/main.ts`(`GkDebug.gadgets: { movers: {x,y}[]; crumbles: string[]; bounces: number; carried: number }`);新增 `src/scenes/gadgetViews.ts`(畫機關:依 `this.palette` 配色,彈跳墊依世界換造型的程式畫);Test `e2e/gadgets.spec.ts`

- 移動平台:每個是 `physics.add.image/rectangle`,`body.setAllowGravity(false).setImmovable(true)`,每格依 `moverOffset` 設速度(位置差 / dt)讓 Arcade 推玩家;和玩家 `collider`;玩家腳底站在上面(`p.body().touching.down` 且腳底 x 在範圍內、腳底 y ≈ 平台頂)時,把平台這格的 dx 加到玩家 x、dy>0 時也把玩家 y 跟著往下。
- 彈跳墊:靜態 overlap,玩家往下掉(vy ≥ 0)且腳底在墊子頂附近 → `setVelocityY(-SPRING_VY)`、墊子壓扁 tween、音效 `spring`(新的合成音,加在 recipes)。
- 會掉的平台:靜態 body,每格 `stepCrumble`,shaking 時圖左右抖;fallen 時 `body.enable = false` 圖往下掉淡出;回 solid 時淡入、body 開啟(若玩家正好在那個位置,等玩家離開再開)。
- 測試用:`?level=range` 練習場加一組機關(移動平台、彈跳墊、會掉的平台各一),e2e 在練習場測。

- [ ] Step 1 e2e(失敗):站上移動平台(warp 到平台上)2 秒內玩家 x 跟著平台移動 > 60;雙人兩人都被載;踩彈跳墊玩家最高點比一般跳高 1.8 倍以上;站上會掉的平台 1 秒內 `crumbles[i] === 'fallen'`、5 秒後回 'solid';掉下去後睡著重來,平台是 'solid'。
- [ ] Step 2 build + 跑 → FAIL;Step 3 實作;Step 4 build + 跑 → PASS;截圖確認三種機關的樣子;Step 5 commit。

### Task 5: 世界 1 三關放上機關、平台加多

**Files:** Modify `src/levels/grassland.ts`(w1-1)、`src/levels/river.ts`(w1-2)、`src/levels/forest.ts`(w1-3)(檔名以 `src/levels/index.ts` 對應為準);`tests/levels.test.ts`

- 每關:移動平台 ×2(1-2 至少一段在河溝上)、彈跳墊 ×2(至少一個通往高處寶箱)、會掉的平台一串 3–4 塊、一段 3–5 階樓梯、一條上面的路;平台總數至少是原本的 2 倍。
- `tests/levels.test.ts` 加:有 movers/springs/crumbles 的關,機關不和地形、荊棘重疊;不在魔王區;移動平台整條路徑不碰到地形;彈跳墊在地面或平台上;平台之間的跳躍距離規則(高度差 ≤ 120 或有彈跳墊)。

- [ ] Step 1 寫 levels 測試(世界 1 三關必備項目)→ FAIL;Step 2 改關卡資料 → PASS;Step 3 build + 跑 `e2e/grassland.spec.ts e2e/river.spec.ts e2e/forest.spec.ts` → PASS;截圖每關兩三處;Step 4 commit。

### Task 6: 試玩清單、全部測試、審查、上線
- [ ] `docs/playtest/m18-checklist.md`;字型重產;背景完整 e2e;同時派審查;修正;推 main 並確認部署。
