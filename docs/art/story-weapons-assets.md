# 新武器與故事畫面素材清單（給美術組）

2026-10-23 第一版。規格同前：PNG 原檔、遊戲內 1 倍大小、透明背景；**武器朝右、子彈朝右（往右飛）**。不畫人臉。
設計說明見 `docs/superpowers/specs/2026-10-23-feel-weapons-story-design.md`。美術畫好之前，程式先用程式畫的暫時圖，畫好後放到下面的檔名就會自動換上。

## 一、新武器（必要，4 把）

武器圖同時用在「角色手上拿著」和「左上角的圖示」，所以要像拿在手上的樣子：**握把在左下、槍口（發射的地方）在右邊**。

| 檔案 | 內容 | 大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/weapons/yarn-ball.png` | 彈彈毛線球（R） | 約 40×36 | 手持的毛線球發射器，例如一個裝著毛線球的小籃子或彈弓；顏色淡粉、淡藍 |
| `public/assets/weapons/marshmallow-bomb.png` | 晚安棉花糖炸彈（SR） | 約 42×36 | 拿在手上的一包或一串棉花糖，旁邊有小小的引信（可愛，不要像真的炸彈） |
| `public/assets/weapons/hypno-watch.png` | 催眠懷錶（SR） | 約 36×40 | 有鍊子的金色懷錶，鍊子在左邊（手握的地方），錶面上有月亮或星星 |
| `public/assets/weapons/wishing-star.png` | 許願流星杖（SSR） | 約 30×44 | 頂端有一顆大星星的魔法杖，杖身斜放（左下握、右上是星星），金色、有一點發光感 |

## 二、新武器的子彈（必要，4 種）

| 檔案 | 內容 | 大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/bullets/yarn-ball.png` | 毛線球 | 16×16 | 圓的，程式會讓它旋轉 |
| `public/assets/bullets/marshmallow.png` | 棉花糖 | 20×18 | 白色、軟軟的；爆炸效果程式畫 |
| `public/assets/bullets/hypno-wave.png` | 催眠波 | 24×48 | 往右的弧形波（像「)」），淡紫色半透明、有一圈一圈的紋路；集氣越久程式會放越大 |
| `public/assets/bullets/meteor.png` | 流星 | 24×40 | 星星在下、尾巴往上（從天上往下掉）；爆炸效果程式畫 |

## 三、故事畫面

呈現方式還在決定（三種方案見設計文件「呈現方式」）。下面先列**方案二（動態繪本，建議）**需要的圖：背景與角色大多用現有的遊戲圖，只要補這些。

### 必要（方案二）

| 檔案 | 內容 | 大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/story/tapir-silhouette.png` | 坐在城堡屋頂上的夢貘剪影 | 約 200×160 | 全黑或深紫剪影，看不出表情；開場第 3 幕用（伏筆，玩家會以為是壞人） |
| `public/assets/story/castle-roof.png` | 月亮城堡的屋頂一角 | 約 400×200 | 給夢貘剪影坐；夜晚、月亮在後面 |
| `public/assets/story/town-houses.png` | 城下的一排小房子（窗戶是空的，程式畫燈光） | 約 960×220 | 夜晚，屋頂有煙囪；窗戶的位置請另外告訴程式（或畫成方便辨認的方格） |
| `public/assets/story/nightmare-exam.png` | 惡夢泡泡內容：考卷（紅色的叉叉、分數） | 約 96×96 | 放在圓形泡泡裡，程式會加泡泡外框；不要人物 |
| `public/assets/story/nightmare-cup.png` | 惡夢泡泡內容：打破的杯子 | 約 96×96 | 同上 |
| `public/assets/story/nightmare-closet.png` | 惡夢泡泡內容：黑黑的衣櫥，門縫有一點光 | 約 96×96 | 不要太可怕 |
| `public/assets/story/nightmare-lost.png` | 惡夢泡泡內容：找不到回家的路（岔路、路標） | 約 96×96 | 同上 |
| `public/assets/story/nightmare-lunch.png` | 惡夢泡泡內容：忘記帶的便當（空空的桌子上一個問號） | 約 96×96 | 同上 |
| `public/assets/story/nightmare-gate.png` | 守衛自己的惡夢：遠方的城門，路一直延伸、怎麼跑都到不了 | 約 160×160 | 結局第 4 幕，比其他泡泡大 |
| `public/assets/story/guards-back.png` | 兩位守衛的背影（穿睡衣、戴睡帽，拿著哈欠泡泡），坐著 | 約 140×100 | 結局第 7 幕坐在夢貘旁邊；只有背影，沒有臉 |

### 選做（之後想換成插圖再畫）

方案一（繪本式）或想讓某幾幕更漂亮時，每一幕可以畫一張完整插圖（960×540），檔名 `public/assets/story/opening-1.png` ～ `opening-6.png`、`ending-1.png` ～ `ending-11.png`。每一幕要畫什麼見設計文件的開場、結局表格。程式會優先用插圖，沒有插圖的幕用方案二的拼法。

### 已經有、不用畫

- 晚安王國夜景、森林：用世界 10、世界 1 的背景。
- 夢貘醒著、睡著（`tapir`、`tapir-sleep`）。
- 十個魔王與月兔、孔雀的睡著圖（結局第 8 幕大家圍著夢貘坐）。
- 星星（世界 10 收集用的 `w10-star`）。
