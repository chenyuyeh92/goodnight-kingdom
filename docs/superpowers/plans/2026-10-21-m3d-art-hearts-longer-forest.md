# 第三步之四「接上美術、六顆愛心、拉長失眠森林、十大世界企劃」實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把美術組第一版素材(`origin/art/style-guide`)接進遊戲,色塊換成真正的角色、魔物、道具與三層視差背景;愛心從 3 顆改成 6 顆;失眠森林拉長到一局約 4–5 分鐘,多走路、多邊走邊打;企劃文件寫進「十大世界 × 每世界 3 小關」的架構。

**Architecture:** 新增 `BootScene` 統一載入圖片(顯示載入進度);「哪個東西用哪張圖、畫多大」寫成純資料模組 `src/art/sprites.ts` 並用 Vitest 測試。物理判定維持原本的隱形色塊,圖片只是疊在上面的外觀,所以手感與既有測試不受影響。關卡仍是 `LevelDef` 資料,只改森林的內容。

**Tech Stack:** 同前。

**Spec:** 企劃 4.5(愛心)、6.3(第一關結構)、8(美術方向)、新增「十大世界」一節;美術 `docs/art/style-guide.md`、`docs/art/level1-assets.md`(合併後)。

## 已確認的決定(葉宸佑 2026-10-21)

- 愛心 6 顆,不做難度選擇;之後的關卡靠關卡本身變難。
- 一小關一局至少 4–5 分鐘,重點是「多走、多移動、邊走邊打」,不是增加站著打的戰鬥區。
- 十大世界,每個世界 3 小關(例如 1-1、1-2 走路打怪加小頭目,1-3 打世界關主),依地球上的地形與氣候分世界(沙漠金字塔、海底亞特蘭提斯與尼斯湖水怪等)。
- 現在的失眠森林(有貓頭鷹)就是 **1-3**;1-1、1-2 下一步(3e)再做。

## Global Constraints

- 沿用前面計畫的 Global Constraints。
- **判定不變:** 角色判定 28×48(蹲 28×28)、魔物判定維持 `ENEMY_DEFS` 的 w/h(貓頭鷹除外,見 Task 5);圖片只影響外觀。
- 素材路徑一律用 `import.meta.env.BASE_URL + 'assets/...'`,部署在 `/goodnight-kingdom/` 底下也找得到。
- 圖片載入失敗(例如網路斷掉)時退回原本的色塊,遊戲照樣能玩,不卡在載入畫面。
- 美術素材的檔案與授權說明照美術分支原樣合併,不修改圖片本身;要改圖請美術那邊重跑。

## Review Focus

1. **圖片沒載入時:** 每個用到圖片的地方都要有色塊後備,不能出現 Phaser 的綠色「缺圖」方塊或當掉 → 測試在 Task 3(用網址參數 `?noart=1` 模擬)。
2. **外觀和判定對不上:** 圖片的腳底要貼地、蝙蝠圖片底部飛行時高於 y 452(蹲下閃得過)、貓頭鷹放大後的判定不能大到無處可躲 → Task 4、5 的截圖與測試。
3. **六顆愛心:** 復活、重來、小枕頭補血的上限都跟著變成 6;HUD 雙人時不爆版 → Task 2。
4. **關卡拉長後:** 新的檢查點都不在戰鬥區鎖住的畫面裡、隱藏區跳得上去、不會有走不過去的地形 → 沿用 3c 的關卡資料測試並補新規則。
5. **手機效能與載入時間:** 背景三張約 1.6 MB,首頁載入要有進度,iPhone 上捲動不卡 → Task 3、4 的手動檢查。

---

## File Structure

```
public/assets/**                 # 美術分支合併進來
docs/art/**、docs/assets-licenses.md
src/art/sprites.ts               # 純資料:圖片鍵、檔名、顯示大小、對齊方式
src/scenes/BootScene.ts          # 載入圖片與進度條,完成後進開場選單或關卡
src/game/background.ts           # 三層視差背景(Phaser)
src/game/enemyEntity.ts、playerEntity.ts  # 疊上圖片
src/levels/forest.ts             # 拉長
tests/sprites.test.ts、tests/levels.test.ts
e2e/art.spec.ts
docs/playtest/m3d-checklist.md
```

---

### Task 1: 合併美術分支

- [ ] `git merge origin/art/style-guide`(只新增檔案,不會衝突)。
- [ ] `npm run build` 後確認 `dist/assets/enemies/clockbug.png` 等檔案存在。
- [ ] Commit:合併訊息即可。

### Task 2: 六顆愛心

**Files:** `src/game/health.ts`、`src/scenes/TestRangeScene.ts`(HUD)、相關 e2e
- `MAX_HEARTS = 6`;復活與重來沿用「補滿」規則,所以都是 6 顆。
- HUD:愛心改用小圖示一排 6 顆(有圖用圖,沒有就用 ♥/♡),雙人時兩組並排不超出畫面。
- 測試:單元 `health` 相關斷言改 6;e2e 中「打 3 下睡著」類的流程改用 `hurtUntilDown`(已是輪詢,不需要改次數)。新增 e2e `'愛心有 6 顆'`。
- [ ] FAIL → 實作 → PASS → Commit `愛心改成 6 顆`

### Task 3: 載入畫面與圖片資料

**Files:** Create `src/art/sprites.ts`、`src/scenes/BootScene.ts`;Modify `src/main.ts`;Test `tests/sprites.test.ts`、`e2e/art.spec.ts`
- `sprites.ts`:
  ```ts
  export type SpriteKey = 'clockbug' | 'clockbug-sleep' | ... ;
  export const SPRITES: Record<SpriteKey, { file: string; w: number; h: number }>;
  export function enemySprite(type: EnemyType, state: 'awake' | 'sleep', owlPhase?: 1 | 2 | 3): SpriteKey;
  export function itemSprite(id: ItemId): SpriteKey;  export function weaponIcon(id: WeaponId): SpriteKey;
  ```
- `BootScene`:載入全部圖片,畫面中央顯示「載入中 42%」;完成或失敗都繼續(失敗的圖記在 `missingArt`)。`?noart=1` 時完全不載入,方便測試後備色塊。
- `GkDebug` 新增 `art: { loaded: number; missing: string[] }`。
- 測試:每個 `EnemyType`、`ItemId`、`WeaponId` 都有對應圖;檔名都存在於 `public/assets`;e2e `'有圖時載入完成進選單'`、`'?noart=1 時用色塊照樣能玩到關主'`。
- [ ] Commit `載入畫面與素材對照表`

### Task 4: 背景與地形外觀

**Files:** Create `src/game/background.ts`;Modify `TestRangeScene`
- 三層視差:遠景 0.1、中景 0.35、近景 0.7 的捲動速度(`tileSprite` + `setScrollFactor(0)` 自己算位移),近景草叢在地面線。靶場也用森林背景。
- 地面與平台:改成配色指南的深紫外框、圓角、上緣一條淡紫亮邊,不再是純色塊;荊棘改成三角形一排。
- 檢查點改成小旗子(程式畫),經過時變亮。
- 截圖自查:地面附近要乾淨,魔物和子彈看得清楚。
- [ ] Commit `三層視差背景與地形外觀`

### Task 5: 角色與魔物的圖

**Files:** Modify `playerEntity.ts`、`enemyEntity.ts`、`TestRangeScene`、`enemies.ts`
- 玩家:睡衣小綿羊守衛,依朝向左右翻轉;蹲下時壓扁成 28 高;睡著時躺倒(轉 90°、半透明)加 Zzz 圖;無敵閃爍沿用。雙人的 B 加淡綠色調,頭上 A/B 標籤保留。
- 魔物:圖片底部對齊判定底部、水平置中;依移動方向翻轉(素材朝左)。刺蝟的白色刺盾條保留但變細變淡(素材的刺在背上,之後請美術重畫成正面刺盾)。
- 被哄睡:換成睡著版圖片,往上飄並淡出,同時放出 Zzz 圖與小羊特效;貓頭鷹睡著版停留到進結算。
- 貓頭鷹:依階段換三張圖,暴躁時抖動加變紅。圖片縮到 0.75 倍(約 136×150),判定從 96×80 放大到 **110×120**,配合新的圖讓「打到身體就算」看起來合理;俯衝最低點同步調整讓牠不會鑽進地面。
- 測試:e2e 截圖自查 + 既有全部 e2e 通過;單元 `'蝙蝠飛行高度讓圖片底部高於 452'`。
- [ ] Commit `角色與魔物換上美術圖`

### Task 6: 道具、寶箱、武器圖示

- 道具 4 種、練習靶換圖;寶箱:**還沒有關著的圖**,先用打開的圖加一個程式畫的蓋子與閃光,打開後蓋子飛走(之後美術補關著的圖再換)。
- 武器:HUD 左上角顯示目前武器小圖示;選武器畫面與背包每一列前面加圖示。泡泡子彈維持程式畫的圓(之後再做子彈素材)。
- [ ] Commit `道具、寶箱與武器圖示`

### Task 7: 拉長失眠森林(1-3)

**Files:** `src/levels/forest.ts`、`tests/levels.test.ts`、`e2e/forest.spec.ts`
- 世界寬 5600 → **約 11000**,五段加關主:
  | 段落 | 長度 | 重點 |
  |---|---|---|
  | 1 林間小路 | 0–2200 | 教學:鬧鐘蟲、咖啡豆;邊走邊打;明顯寶箱;戰鬥區 A |
  | 2 蘑菇坡 | 2200–4200 | 上上下下的平台路線,上路比較安全、下路魔物多;蝙蝠登場 |
  | 3 低矮樹洞 | 4200–6200 | 蹲著過的通道、隱藏寶箱(高台階梯);戰鬥區 B |
  | 4 刺蝟谷 | 6200–8400 | 刺蝟登場,混合魔物連續出現;明顯寶箱;戰鬥區 C |
  | 5 貓頭鷹之巢前 | 8400–10000 | 前面所有魔物的綜合考驗,沒有戰鬥區、魔物從前後持續出現 |
  | 關主 | 10000–10960 | 熬夜貓頭鷹 |
- 零星魔物(邊走邊打)從現在約 7 組增加到約 30 組,節奏「一小群 → 喘口氣 → 一小群」;戰鬥區維持 3 個。
- 寶箱 3 → **4 個**(多一個在蘑菇坡上路的盡頭,獎勵走上路的人)。
- 預估時間:純走路約 50 秒;零星魔物與 3 個戰鬥區約 2.5 分鐘;關主約 1 分鐘;合計約 4–5 分鐘(要你試玩時看結算的通關時間再調)。
- 資料測試沿用 3c 的規則(檢查點不在戰鬥區畫面內、通道只能蹲著過、階梯每級 ≤ 140、鎖定點在世界內),新增:`'零星魔物至少 25 組且分布在每一段'`、`'寶箱 4 個'`。
- [ ] Commit `失眠森林拉長成五段`

### Task 8: 企劃文件與試玩清單

- 企劃新增「十大世界」一節(草案,請你改):每個世界 3 小關,第 3 小關打世界關主。
  | # | 世界 | 地形/氣候 | 關主(草案) | 新玩法 |
  |---|---|---|---|---|
  | 1 | 失眠森林 | 溫帶森林 | 熬夜貓頭鷹 | 基本操作 |
  | 2 | 沙漠金字塔王國 | 沙漠 | 睡不著的人面獅身 | 流沙、金字塔內部機關 |
  | 3 | 亞特蘭提斯海底王國 | 海底 | 尼斯湖水怪 | 水中游泳(新的移動方式) |
  | 4 | 冰雪極地 | 極地 | 失眠雪怪 | 滑溜冰面 |
  | 5 | 火山島 | 火山 | 熬夜火龍 | 熔岩、噴發 |
  | 6 | 熱帶雨林 | 雨林 | 吵鬧大猩猩 | 藤蔓擺盪 |
  | 7 | 非洲大草原 | 草原 | 失眠獅子王 | 獸群奔跑 |
  | 8 | 雲端高山 | 高山 | 熬夜雷鳥 | 強風、雲朵平台 |
  | 9 | 地底洞窟 | 洞穴 | 失眠巨鼴鼠 | 黑暗、只看得到附近 |
  | 10 | 月亮城堡(晚安王國王城) | 夜空 | 偷走睡意的失眠魔王 | 綜合 |
- 企劃 4.5 愛心改 6 顆;2 節範圍改成「第一版:世界 1 的三小關」。
- 試玩清單 `m3d-checklist.md`:美術看起來如何、6 顆愛心的難度、1-3 一局花多久(結算時間)、哪一段太長或太短。
- [ ] Commit `十大世界企劃、第三步之四試玩清單`

---

## 之後(不在這一步)

- **3e:** 1-1、1-2 兩小關(各 4–5 分鐘,有小頭目)、世界 1 的選關畫面。
- 美術待補:關著的寶箱、刺蝟正面刺盾、子彈素材、介面風格(美術指南 4.5)、2 倍解析度。
- 畫角色(企劃第 7 節)、音樂音效、連線。
