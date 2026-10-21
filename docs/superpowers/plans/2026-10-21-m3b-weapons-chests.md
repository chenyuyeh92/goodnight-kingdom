# 第三步之二「武器、寶箱、背包與道具」實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 加入 6 把特殊武器(含彈藥、過熱、星等)、寶箱(公開機率、重複升星)、永久保存的背包、4 種短暫效果道具,並在開場選單加入「背包」畫面。

**Architecture:** 武器資料、彈藥與過熱規則、子彈的特殊軌跡(扇形、追蹤、迴力鏢)、寶箱抽獎、存檔、道具效果全部是純函式並以 Vitest 測試。把場景裡的子彈處理抽成 `ProjectileSystem`,場景已接近 700 行,不再往裡面塞。寶箱抽獎的亂數來源可以注入,方便測試與日後交給伺服器。

**Tech Stack:** 同前。

**Spec:** `docs/superpowers/specs/2026-10-20-goodnight-kingdom-design.md`(第 5 節全部;第 2 節「進度、背包存在玩家裝置上」;9.2 存檔區塊;9.4 存檔失敗仍可玩)

**範圍說明:** 出發前從背包挑武器屬於 3c;本計畫在靶場中只能透過寶箱拿到並換上武器。武器與寶箱都是色塊佔位。

## Global Constraints

- 沿用前面計畫的 Global Constraints(commit 身分 `Claude <noreply@anthropic.com>`、結尾兩行、繁體中文、`?test=1` 才有測試開關)。
- 寶箱機率 R 70%、SR 25%、SSR 5%,開箱時在畫面上公開顯示這三個數字。
- 重複武器升一星,最多三星;每多一星彈藥上限 +25%(★2 為 1.25 倍、★3 為 1.5 倍,四捨五入)。已三星再抽到 → 改給一個牛奶瓶道具。
- 特殊武器彈藥用完自動換回哈欠泡泡;撿到武器立刻換上並補滿彈藥。
- 枕頭揮擊不受武器影響。
- 存檔:`localStorage` 鍵 `gk.save.v1`,格式帶 `version: 1`;讀寫失敗或內容損壞時遊戲照常進行,背包視為空的。
- 道具效果時間 10 秒;小枕頭補 1 顆愛心(最多 3);牛奶瓶補滿目前特殊武器的彈藥(拿哈欠泡泡時無效果但仍會被撿走)。

## Review Focus

1. **按住連射時彈藥剛好用完:** 下一發無縫換成哈欠泡泡,不卡住、不報錯,HUD 顯示切回「哈欠泡泡 ∞」→ `fireWeapon` 純函式。測試在 Task 1 與 Task 5。
2. **存檔被封鎖或內容損壞(無痕模式、手動改壞、舊版本):** 遊戲照常,背包為空,之後能正常寫入 → `loadSave`/`createSaveStore`。測試在 Task 3。
3. **三星武器再抽到:** 星等不超過 3,改給牛奶瓶 → `openChest`。測試在 Task 3。
4. **迴力鏢飛出去時主人睡著、被傳送或場景重來:** 不留下永遠飛著的迴力鏢;主人不在時沿原方向飛走,最長 2 秒消失 → `boomerangVelocity` 與 `ProjectileSystem` 的壽命上限。測試在 Task 2 與 Task 5。
5. **兩人同一格碰到同一個寶箱:** 只有一人拿到,寶箱只開一次 → 場景開箱狀態。測試在 Task 6。

---

## File Structure

```
src/game/weapons.ts          # 武器資料、星等、彈藥/過熱/裝備規則(純函式)
src/game/projectileMath.ts   # 扇形、追蹤轉向、迴力鏢速度(純函式)
src/game/chest.ts            # 寶箱抽獎(可注入亂數)
src/game/save.ts             # 存檔格式、讀寫、背包
src/game/items.ts            # 道具掉落與效果、增益計時
src/game/projectileSystem.ts # 子彈的 Phaser 物件、碰撞、壽命(從場景抽出)
src/game/playerEntity.ts     # 持有 Loadout 與增益,攻擊時依武器產生子彈
src/scenes/TestRangeScene.ts # 寶箱、道具、HUD、存檔接線
src/scenes/BackpackScene.ts  # 背包畫面
src/scenes/ModeSelectScene.ts# 加「背包(按 3)」
tests/weapons.test.ts、projectileMath.test.ts、chest.test.ts、save.test.ts、items.test.ts
e2e/weapons.spec.ts
docs/playtest/m3b-checklist.md
```

---

### Task 1: 武器資料與彈藥、過熱、裝備規則

**Files:** Create `src/game/weapons.ts`;Test `tests/weapons.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type WeaponId = 'yawnBubble' | 'sheepGun' | 'pillowCannon' | 'milkSpray' | 'lullabyHarp' | 'blanketBoomerang' | 'moonLamp';
  export type SpecialWeaponId = Exclude<WeaponId, 'yawnBubble'>;
  export type Rarity = 'base' | 'R' | 'SR' | 'SSR';
  export type ProjectileKind = 'straight' | 'pierce' | 'spread' | 'homing' | 'boomerang' | 'beam';
  export interface OverheatDef { heatPerShot: number; maxHeat: number; coolPerSec: number; resumeAt: number; }
  export interface WeaponDef { id: WeaponId; name: string; rarity: Rarity; kind: ProjectileKind; fireIntervalMs: number | null /* null = 用 tuning.fireIntervalMs */; damage: number; speed: number | null /* null = tuning.bulletSpeed */; size: number; color: number; lifeMs: number; baseAmmo: number | null; pellets?: number; spreadDeg?: number; overheat?: OverheatDef; }
  export const WEAPONS: Readonly<Record<WeaponId, WeaponDef>>;
  export const SPECIAL_WEAPONS: readonly SpecialWeaponId[];
  export const MAX_STARS = 3;
  export function ammoCapacity(id: WeaponId, stars: number): number | null;
  export interface Loadout { special: SpecialWeaponId | null; ammo: number | null; heat: number; overheated: boolean; }
  export const BASE_LOADOUT: Readonly<Loadout>;
  export function equip(id: SpecialWeaponId, stars: number): Loadout;   // 補滿彈藥、熱度 0
  export function activeWeapon(l: Loadout): WeaponDef;                  // special 為 null → 哈欠泡泡
  export function canFire(l: Loadout): boolean;                          // 過熱鎖定中為 false
  export function fireWeapon(l: Loadout, infiniteAmmo: boolean): Loadout;// 扣 1 發或加熱;彈藥歸 0 → BASE_LOADOUT
  export function coolWeapon(l: Loadout, dtMs: number): Loadout;         // 依 coolPerSec 降溫,低於 resumeAt 解除過熱
  export function refillAmmo(l: Loadout, stars: number): Loadout;
  ```
  武器表:

  | id | name | rarity | kind | 間隔 ms | 傷害 | 速度 | 大小 | 壽命 ms | 彈藥 | 其他 | 顏色 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | yawnBubble | 哈欠泡泡 | base | straight | null | 1 | null | 10 | 1000 | null | | `#bfe6ff` |
  | sheepGun | 數羊機槍 | R | straight | 70 | 1 | 700 | 8 | 900 | 120 | | `#ffffff` |
  | pillowCannon | 枕頭砲 | R | pierce | 450 | 3 | 380 | 22 | 1600 | 30 | | `#f6d6e8` |
  | milkSpray | 晚安牛奶噴霧 | R | spread | 220 | 1 | 520 | 8 | 260 | 60 | pellets 5、spreadDeg 50 | `#fffaf0` |
  | lullabyHarp | 搖籃曲豎琴 | SR | homing | 200 | 1 | 420 | 10 | 1600 | 50 | | `#ffe08a` |
  | blanketBoomerang | 棉被迴力鏢 | SR | boomerang | 600 | 2 | 520 | 20 | 2000 | 25 | | `#9fc5ff` |
  | moonLamp | 月亮催眠燈 | SSR | beam | 60 | 1 | 900 | 12 | 300 | null | heatPerShot 8、maxHeat 100、coolPerSec 40、resumeAt 30 | `#fff3a8` |

  `ammoCapacity`:`baseAmmo` 為 null → null;否則 `round(baseAmmo × (1 + 0.25 × (stars − 1)))`,`stars` 夾在 1~3。
  `fireWeapon`:`overheat` 武器 → `heat += heatPerShot`,`heat >= maxHeat` 時 `overheated = true`;有彈藥的武器 → `infiniteAmmo` 為 false 時 `ammo − 1`,變 0 回傳 `BASE_LOADOUT`。

- [ ] **Step 1:寫失敗測試 `tests/weapons.test.ts`**
  - `'六把特殊武器的等級分布:R 3、SR 2、SSR 1'`。
  - `'ammoCapacity:數羊機槍 ★1 120、★2 150、★3 180、★5 夾到 180'`;`'月亮燈無限彈藥 → null'`。
  - `'equip 補滿彈藥'`:`equip('pillowCannon', 2)` → `ammo 38`(30×1.25=37.5→38)。
  - `'fireWeapon 扣彈藥'`;`'最後一發射完換回哈欠泡泡'`:`ammo 1` → `special null`、`ammo null`;`activeWeapon` 為 `yawnBubble`。
  - `'流星期間不扣彈藥'`:`infiniteAmmo true` → `ammo` 不變。
  - `'月亮燈連射 13 發過熱'`:8×13=104 ≥ 100 → `overheated true`、`canFire false`。
  - `'過熱後冷卻到 30 以下才能再射'`:`heat 104` 冷卻 1800ms(降 72 → 32)仍 `overheated`;再 100ms(→28)解除。
  - `'refillAmmo 補到星等上限;哈欠泡泡無效果'`。
- [ ] **Step 2:執行 `npm test`,預期 FAIL**
- [ ] **Step 3:實作**
- [ ] **Step 4:執行 `npm test`、`npx tsc --noEmit`,預期 PASS**
- [ ] **Step 5:Commit**:`武器資料與彈藥、過熱、裝備規則`

---

### Task 2: 子彈軌跡(扇形、追蹤、迴力鏢)

**Files:** Create `src/game/projectileMath.ts`;Test `tests/projectileMath.test.ts`

**Interfaces:**
- Consumes:`Aim`、`Facing`、`bulletVelocity`。
- Produces:
  ```ts
  export function pelletVelocities(aim: Aim, facing: Facing, speed: number, count: number, spreadDeg: number): { vx: number; vy: number }[];
  export function steerToward(vx: number, vy: number, fromX: number, fromY: number, targetX: number, targetY: number, maxTurnDegPerSec: number, dtMs: number): { vx: number; vy: number };
  export const HOMING_TURN_DEG_PER_SEC = 360;
  export const BOOMERANG_OUT_MS = 400;
  export function boomerangVelocity(ageMs: number, initial: { vx: number; vy: number }, pos: { x: number; y: number }, owner: { x: number; y: number } | null): { vx: number; vy: number };
  ```
  - `pelletVelocities`:以 `bulletVelocity(aim, facing, speed)` 的方向為中心,在 `±spreadDeg/2` 之間平均分布 `count` 發,速率不變。
  - `steerToward`:把速度方向往目標轉,每秒最多 `maxTurnDegPerSec` 度(依 dt,dt 夾 50),速率不變。
  - `boomerangVelocity`:`ageMs < 400` → `initial`;之後 `owner` 不為 null → 以原速率直接朝 `owner` 飛;`owner` 為 null → `initial`(沿原方向飛走,交給壽命上限)。
- [ ] **Step 1:寫失敗測試**
  - `'5 發扇形對稱,中間一發與原方向相同'`:`pelletVelocities('forward', 1, 520, 5, 50)` → 第 3 發 `(520, 0)`;第 1 與第 5 發 `vy` 互為相反數;每發速率皆為 520(誤差 1e-6)。
  - `'往上射時扇形以正上方為中心'`:中間一發 `(0, -520)`。
  - `'追蹤每秒最多轉 360 度'`:速度 `(420, 0)`、目標在正上方,`dtMs 50` 一格 → 角度改變 18 度(誤差 0.01)、速率仍 420。
  - `'目標在正前方不轉向'`。
  - `'迴力鏢 400ms 內照原速度,之後飛回主人'`:`age 399` → `initial`;`age 401`、`pos (500,450)`、`owner (300,450)` → `vx -520, vy 0`。
  - `'主人不在時沿原方向飛走'`:`owner null` → `initial`。
- [ ] **Step 2–4:FAIL → 實作 → PASS**
- [ ] **Step 5:Commit**:`子彈軌跡:扇形、追蹤、迴力鏢`

---

### Task 3: 寶箱抽獎與存檔(背包)

**Files:** Create `src/game/chest.ts`、`src/game/save.ts`;Test `tests/chest.test.ts`、`tests/save.test.ts`

**Interfaces:**
- Consumes:`WEAPONS`、`SPECIAL_WEAPONS`、`MAX_STARS`、`SpecialWeaponId`、`Rarity`;`StorageLike`(`src/config/tuning.ts`)。
- Produces(`chest.ts`):
  ```ts
  export const CHEST_RATES: Readonly<Record<'R' | 'SR' | 'SSR', number>> = { R: 0.7, SR: 0.25, SSR: 0.05 };
  export function rollRarity(r: number): 'R' | 'SR' | 'SSR';            // r ∈ [0,1):<0.7 R、<0.95 SR、其餘 SSR
  export type ChestResult = { kind: 'new'; weapon: SpecialWeaponId; stars: 1 } | { kind: 'starUp'; weapon: SpecialWeaponId; stars: number } | { kind: 'maxed'; weapon: SpecialWeaponId };
  export function openChest(rng: () => number, owned: Readonly<Partial<Record<SpecialWeaponId, number>>>): ChestResult;
  ```
  `openChest`:第一個亂數決定等級,第二個亂數在該等級的武器中平均挑一把;未擁有 → `new`;已擁有且 < 3 星 → `starUp`(星等 +1);已 3 星 → `maxed`(場景改給牛奶瓶)。
- Produces(`save.ts`):
  ```ts
  export const SAVE_KEY = 'gk.save.v1';
  export interface SaveData { version: 1; weapons: Partial<Record<SpecialWeaponId, number>>; }
  export function sanitizeSave(raw: unknown): SaveData;      // 版本不符、格式錯、未知武器、星等不在 1~3 → 丟掉該部分
  export interface SaveStore { get(): SaveData; setStars(id: SpecialWeaponId, stars: number): void; }
  export function createSaveStore(storage: StorageLike | null): SaveStore;  // 讀寫丟例外時照常運作
  ```
- [ ] **Step 1:寫失敗測試**
  `tests/chest.test.ts`(輔助 `seq(...values)` 依序回傳的亂數):
  - `'rollRarity 邊界'`:`0` → R、`0.6999` → R、`0.7` → SR、`0.9499` → SR、`0.95` → SSR、`0.9999` → SSR。
  - `'第一次抽到 → new ★1'`:`seq(0.1, 0)`、`owned {}` → `{ kind: 'new', weapon: SPECIAL_WEAPONS 中第一把 R, stars: 1 }`。
  - `'重複 → 升一星'`:`owned { sheepGun: 1 }` 抽到數羊機槍 → `{ kind: 'starUp', stars: 2 }`。
  - `'三星再抽到 → maxed'`。
  - `'SSR 只會是月亮燈'`:`seq(0.99, 0.5)` → `moonLamp`。
  - `'機率總和為 1'`。
  `tests/save.test.ts`:
  - `'sanitizeSave(undefined) → 空背包'`。
  - `'未知武器、星等 0 或 9、字串星等都被丟掉,合法的保留'`。
  - `'版本不是 1 → 空背包'`。
  - `'setStars 後寫入儲存,重建 store 讀回'`。
  - `'儲存丟例外時仍可運作'`(`getItem`/`setItem` 皆 throw)。
  - `'壞 JSON → 空背包,之後 setStars 正常'`。
- [ ] **Step 2–4:FAIL → 實作 → PASS**
- [ ] **Step 5:Commit**:`寶箱抽獎與背包存檔`

---

### Task 4: 道具

**Files:** Create `src/game/items.ts`;Test `tests/items.test.ts`

**Interfaces:**
- Consumes:`Loadout`、`refillAmmo`(Task 1);`Health`、`MAX_HEARTS`。
- Produces:
  ```ts
  export type ItemId = 'hotCocoa' | 'shootingStar' | 'smallPillow' | 'milkBottle';
  export const ITEM_NAMES: Readonly<Record<ItemId, string>>;       // 熱可可、流星、小枕頭、牛奶瓶
  export const ITEM_DROP_CHANCE = 0.15;
  export const BUFF_MS = 10000;
  export interface Buffs { cocoaMs: number; starMs: number; }
  export const NO_BUFFS: Readonly<Buffs>;
  export function rollDrop(rng: () => number): ItemId | null;      // 第一個亂數 < 0.15 才掉,第二個亂數平均挑一種
  export function tickBuffs(b: Buffs, dtMs: number): Buffs;        // dt 夾 50,不低於 0
  export function fireIntervalWithBuffs(baseMs: number, b: Buffs): number;  // 熱可可期間減半
  export function applyItem(item: ItemId, s: { health: Health; loadout: Loadout; buffs: Buffs; stars: number }): { health: Health; loadout: Loadout; buffs: Buffs };
  ```
  `applyItem`:熱可可 → `cocoaMs = 10000`;流星 → `starMs = 10000`;小枕頭 → 醒著時 `hearts = min(3, hearts + 1)`;牛奶瓶 → `refillAmmo(loadout, stars)`。
- [ ] **Step 1:寫失敗測試**:`'掉落機率 15%'`(`0.149` 掉、`0.15` 不掉);`'四種道具平均'`;`'熱可可 10 秒內射速減半,過期恢復'`;`'流星設定 10 秒'`;`'小枕頭補一顆,滿血不超過 3'`;`'牛奶瓶補滿特殊武器彈藥'`;`'tickBuffs dt 夾 50'`。
- [ ] **Step 2–4:FAIL → 實作 → PASS**
- [ ] **Step 5:Commit**:`道具:掉落、效果與增益計時`

---

### Task 5: `ProjectileSystem` 與武器射擊

**Files:**
- Create `src/game/projectileSystem.ts`
- Modify `src/game/playerEntity.ts`、`src/scenes/TestRangeScene.ts`、`src/main.ts`
- Test `e2e/weapons.spec.ts`

**Interfaces:**
- Consumes:Task 1、2、4;既有 `stepAttack`(射擊間隔改傳 `fireIntervalWithBuffs(武器間隔, buffs)`)、`bulletEffect`、打倒流程。
- Produces:
  ```ts
  export interface ProjectileHit { target: unknown; damage: number; vx: number; vy: number; }
  export class ProjectileSystem {
    constructor(scene: Phaser.Scene, terrain: Phaser.Physics.Arcade.StaticGroup, targets: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup[], onHit: (hit: ProjectileHit) => 'consumed' | 'blocked' | 'ignored');
    fire(owner: PlayerEntity, weapon: WeaponDef, spawn: BulletSpawn, tuning: Tuning): void;  // spread 產生多發
    update(dtMs: number, scrollX: number, viewW: number, homingTargets: () => { x: number; y: number }[]): void;
    count(): number;
    clear(): void;
  }
  ```
  規則:`straight`/`spread`/`homing` 碰地形或命中即消失;`pierce`、`boomerang`、`beam` 穿透魔物(同一發對同一目標只算一次),`pierce` 碰地形消失,`boomerang`、`beam` 穿過地形;`homing` 轉向最近的目標;`boomerang` 回到主人身邊 24px 內消失,主人睡著時 `owner` 視為 null;所有子彈到達 `lifeMs` 或離開畫面 50px 外消失(迴力鏢只看壽命)。被刺盾擋下的子彈消失(含穿透型)。
  `PlayerEntity`:新增 `loadout: Loadout`、`buffs: Buffs`;攻擊產生子彈時回傳目前武器;過熱(`canFire` 為 false)時完全不能射擊,連哈欠泡泡也不行,但枕頭揮擊照常可用;每格 `coolWeapon`、`tickBuffs`。
  `GkDebug`:`players[i]` 增加 `weapon: WeaponId`、`ammo: number | null`、`heat: number`、`overheated: boolean`、`cocoa: boolean`、`star: boolean`;新增測試開關 `giveWeapon(i, id, stars?)`、`giveItem(i, item)`。
  場景:原本的子彈群組與 `spawnBullet`/`expireBullets`/`hitEnemy`/`hitTarget` 改用 `ProjectileSystem`;命中時扣 `damage` 血。
  HUD:愛心那行每位玩家加上「武器名 彈藥」(無限顯示「∞」);月亮燈顯示熱度條 10 格(過熱時變紅並顯示「過熱!」);熱可可、流星期間顯示圖示文字「☕」「★」。

- [ ] **Step 1:寫失敗 e2e `e2e/weapons.spec.ts`**(`./?mode=single&test=1`)
  - `'數羊機槍射得比泡泡快並扣彈藥'`:`giveWeapon(0, 'sheepGun')`;按住 `KeyC` 700ms → `ammo` 介於 108~112(約 10 發)。
  - `'彈藥用完換回哈欠泡泡'`:`giveWeapon(0,'pillowCannon')` 後把彈藥射光(按住 `KeyC` 直到 `weapon === 'yawnBubble'`,逾時 20000ms)→ 之後按住 300ms `bullets > 0`。
  - `'枕頭砲一發穿透兩隻'`:`spawn('alarmBug', 300)`、`spawn('alarmBug', 360)`,`giveWeapon(0,'pillowCannon')`,點一下 `KeyC` → 1500ms 內兩隻都扣到血(`hp` 皆 < 2)。
  - `'牛奶噴霧一次 5 發'`:`giveWeapon(0,'milkSpray')`,點一下 → 下一格 `bullets === 5`。
  - `'豎琴音符會轉向打到頭上的蝙蝠'`:`spawn('nightBat', 400, 320)`;`giveWeapon(0,'lullabyHarp')`;往前按住射擊(不按上)→ 4000ms 內 `enemiesDefeated === 1`。
  - `'迴力鏢會飛回來'`:`giveWeapon(0,'blanketBoomerang')`,點一下 → 先 `bullets === 1`,1500ms 內 `bullets === 0` 且主人沒動。
  - `'迴力鏢主人睡著時不會永遠飛著'`:`?mode=duo&test=1`,玩家 A 丟出後 `hurtUntilDown(0)` → 2500ms 內 `bullets === 0`。
  - `'月亮燈連射會過熱,冷卻後能再射'`:`giveWeapon(0,'moonLamp')`;按住直到 `overheated === true`(逾時 3000ms);放開等到 `overheated === false`(逾時 4000ms)。
  - `'熱可可讓射速變快'`:`giveItem(0,'hotCocoa')`、`giveWeapon(0,'sheepGun')`;按住 700ms → 扣掉約 20 發(`ammo` 介於 97~103)。
  - `'流星期間不扣彈藥'`:`giveItem(0,'shootingStar')`、`giveWeapon(0,'pillowCannon')`;按住 1000ms → `ammo === 30`。
- [ ] **Step 2:執行 `npm run e2e`,預期新測試 FAIL**
- [ ] **Step 3:實作(先抽出 `ProjectileSystem` 並確認原有 e2e 全過,再加武器)**
- [ ] **Step 4:執行全部測試,預期 PASS**
- [ ] **Step 5:Commit**:`武器射擊:子彈系統、六把特殊武器、熱可可與流星`

---

### Task 6: 寶箱、道具掉落與存檔接進靶場

**Files:** Modify `src/scenes/TestRangeScene.ts`、`src/main.ts`;Test `e2e/weapons.spec.ts`(新增)

**Interfaces:**
- Consumes:Task 3、4、5。
- 靶場寶箱(色塊 32×24,`#c98b4f` 金邊 `#ffe08a`;底部貼地):明顯寶箱 x `900`;隱藏寶箱 x `1100`(放在 x 1000~1200 的高平台上,底部 300,要跳上去才拿得到);戰鬥區 1 之後 x `2600`。
- 開箱:醒著的玩家碰到未開的寶箱 → 同一格只由第一個處理的玩家開;`openChest(Math.random, save.get().weapons)`;`new`/`starUp` → `save.setStars`,並把武器 `equip` 給開箱的玩家;`maxed` → 在寶箱位置掉出牛奶瓶。寶箱上方浮出結果 2000ms:「SR 搖籃曲豎琴 ★2」(等級文字依 R 白、SR 藍 `#7fb4ff`、SSR 金 `#ffd24a` 上色),下面一行小字「機率 R 70% / SR 25% / SSR 5%」。
- 道具掉落:魔物被打倒時 `rollDrop(Math.random)`;掉出的道具是 16×16 色塊(熱可可 `#8b5e3c`、流星 `#ffe08a`、小枕頭 `#f6d6e8`、牛奶瓶 `#ffffff`),受重力落地,8 秒後消失(最後 2 秒閃爍);醒著的玩家碰到 → `applyItem`,浮出道具名稱 1000ms。
- 重來:`scene.restart` 資料帶上每位玩家的 `loadout`,重來後保留手上的武器與剩餘彈藥;寶箱狀態重置(可以再開一次,這是靶場)。
- 測試開關:`rigChest(weapon: SpecialWeaponId)` 讓下一次開箱固定抽到該武器;`clearSave()` 清空背包;`GkDebug` 新增 `backpack: Partial<Record<SpecialWeaponId, number>>`、`chestsOpened: number`、`items: number`(場上道具數)。

- [ ] **Step 1:新增失敗 e2e**
  - `'走到寶箱會打開並換上武器,背包記住'`:`?mode=single&test=1`,`clearSave()`、`rigChest('sheepGun')`、`warp(880)` 往右走碰到寶箱 → `players[0].weapon === 'sheepGun'`、`backpack.sheepGun === 1`;重新整理頁面後 `backpack.sheepGun === 1`。
  - `'重複抽到升星,三星後給牛奶瓶'`:`clearSave()` 後重複四次「`rigChest('sheepGun')` → `warp(860)` 後往右走直到 `backpack.sheepGun` 增加或 `items` 增加 → `hurtUntilDown(0)` 等重來(寶箱重置)」;第三次後 `backpack.sheepGun === 3`;第四次星等仍為 3,且寶箱位置掉出牛奶瓶(`items >= 1`)。
  - `'兩人同時碰到同一個寶箱只有一人拿到'`:`?mode=duo&test=1`,`rigChest('pillowCannon')`,`warp(880)`(A 在 880、B 在 920,兩人都碰到 884~916 的寶箱)→ `chestsOpened === 1`,恰好一人 `weapon === 'pillowCannon'`。
  - `'魔物掉出的道具可以撿'`:用 `giveItem` 以外的方式:`spawn` 一隻鬧鐘蟲並以測試開關 `rigDrop('smallPillow')` 讓下一次掉落固定;先 `hurt(0)` 一次(愛心 2),打倒鬧鐘蟲後走過去 → `hearts === 3`。
  - `'存檔壞掉時遊戲照常'`:在頁面載入前 `localStorage.setItem('gk.save.v1', '{bad')`(用 `page.addInitScript`)→ 進入靶場無錯誤、`backpack` 為 `{}`。
- [ ] **Step 2–4:FAIL → 實作 → 全部 PASS**
- [ ] **Step 5:截圖自查**:開箱結果與機率文字、各武器子彈外觀、道具掉落、HUD 的武器/彈藥/熱度條。
- [ ] **Step 6:Commit**:`寶箱、道具掉落與背包存檔接進靶場`

---

### Task 7: 背包畫面與試玩清單

**Files:** Create `src/scenes/BackpackScene.ts`、`docs/playtest/m3b-checklist.md`;Modify `src/scenes/ModeSelectScene.ts`、`src/main.ts`、企劃文件第 5 節;Test `e2e/weapons.spec.ts`(新增)

- 開場選單加第三個按鈕「背包(按 3)」(三個按鈕 x `240 / 480 / 720`,原 e2e 點擊座標同步更新)。
- 背包畫面:6 格,每格顯示等級(上色)、武器名稱、星等「★★☆」、一句說明(企劃 5.2 的「擅長對付」);沒拿到的顯示「???」與灰色;畫面底部顯示寶箱機率;按 `Escape` 或點「返回」回到開場選單。`window.__GK__ = { ready: true, screen: 'backpack' }`。
- [ ] **Step 1:新增失敗 e2e**:`'背包顯示拿到的武器與星等'`(`addInitScript` 預先寫入 `{ version: 1, weapons: { sheepGun: 2 } }`,開場按 `Digit3` → `screen === 'backpack'`,頁面文字含「數羊機槍」與「★★☆」與「???」);`'按 Escape 回到開場選單'`。
  (背包畫面是 canvas 文字,以 `__GK__.backpackText: string[]` 提供畫面上的文字列供測試讀取。)
- [ ] **Step 2–4:FAIL → 實作 → PASS**
- [ ] **Step 5:撰寫 `docs/playtest/m3b-checklist.md`**:六把武器怎麼用與擅長什麼、寶箱位置(隱藏寶箱在高平台上)、機率顯示、重複升星、道具效果、背包畫面;要回報:哪把武器太強或太弱、彈藥量、過熱節奏、掉落頻率。
- [ ] **Step 6:企劃文件第 5 節補上本計畫定案的數值與「三星後給牛奶瓶」「重來保留手上武器與剩餘彈藥」**
- [ ] **Step 7:Commit**:`背包畫面、第三步之二試玩清單`

---

## 完成條件

- `npm test`、`npx tsc --noEmit`、`npm run e2e` 全部通過;截圖自查完成。
- 獨立審查一次,修正後推上分支並合併到 `main`。
