# 新武器與故事畫面：美術交付

2026-10-23，對應遊戲組的 `docs/art/story-weapons-assets.md`。產生方式：`docs/art/tools/make_story.py`（程式畫）、`process_story.py`（AI 圖處理與合成）。

| 檔案 | 內容 | 大小（寬×高 px） | 備註 |
|---|---|---|---|
| `public/assets/weapons/yarn-ball.png` | 彈彈毛線球（R） | 23×36 | 籃子發射器；比清單建議的窄一點 |
| `public/assets/weapons/marshmallow-bomb.png` | 晚安棉花糖炸彈（SR） | 42×33 | 一團棉花糖；沒有畫引信，程式可以加小火花 |
| `public/assets/weapons/hypno-watch.png` | 催眠懷錶（SR） | 36×40 | 鍊子在左上，錶面有月亮 |
| `public/assets/weapons/wishing-star.png` | 許願流星杖（SSR） | 24×44 | 左下握、右上星星 |
| `public/assets/bullets/yarn-ball.png` | 毛線球子彈 | 16×16 | 程式畫 |
| `public/assets/bullets/marshmallow.png` | 棉花糖子彈 | 20×18 | 程式畫 |
| `public/assets/bullets/hypno-wave.png` | 催眠波 | 24×48 | 程式畫，「)」形、淡紫半透明 |
| `public/assets/bullets/meteor.png` | 流星 | 24×40 | 程式畫，星星在下、尾巴往上 |
| `public/assets/story/tapir-silhouette.png` | 夢貘剪影 | 167×160 | 用夢貘圖填成深紫剪影；是站姿 |
| `public/assets/story/castle-roof.png` | 城堡屋頂一角 | 400×200 | 夜晚、月亮在後面 |
| `public/assets/story/town-houses.png` | 城下一排小房子 | 960×220 | 程式畫；窗戶是深色方格，位置在 `story/town-houses-windows.json`（28 扇） |
| `public/assets/story/nightmare-exam.png` | 惡夢：考卷 | 96×96 | 程式畫，紅叉叉、圈起來的分數（沒有字） |
| `public/assets/story/nightmare-cup.png` | 惡夢：打破的杯子 | 96×96 | 程式畫 |
| `public/assets/story/nightmare-closet.png` | 惡夢：衣櫥 | 61×96 | 門開一條縫 |
| `public/assets/story/nightmare-lost.png` | 惡夢：找不到回家的路 | 96×96 | 程式畫，岔路和路標 |
| `public/assets/story/nightmare-lunch.png` | 惡夢：忘記帶的便當 | 87×96 | 空便當盒加問號 |
| `public/assets/story/nightmare-gate.png` | 守衛的惡夢：到不了的城門 | 160×160 | 方形整張圖，請程式裁成圓形泡泡 |
| `public/assets/story/guards-back.png` | 兩位守衛的背影 | 140×94 | 穿睡衣的小綿羊，坐著，看不到臉 |
| `public/assets/story/opening-3.png` | 開場第 3 幕（整幕插圖） | 960×540 | 屋頂上的夢貘剪影，黑霧從城下飄過來 |
| `public/assets/story/ending-3.png` | 結局第 3 幕（整幕插圖） | 960×540 | 王座前五顆惡夢泡泡 |
| `public/assets/story/ending-9.png` | 結局第 9 幕（整幕插圖） | 960×540 | 泡泡往上飄、變成星星 |
| `public/assets/story/ending-10.png` | 結局第 10 幕（整幕插圖） | 960×540 | 夢貘睡在王座上，兩邊是睡著的小綿羊抱枕 |

## 已知問題

- 夢貘剪影是站姿，不是坐姿；開場第 3 幕的整幕插圖裡是坐在屋頂上的樣子。
- 棉花糖炸彈沒有引信，毛線球發射器比較窄。
- 整幕插圖只先做了遊戲組建議優先的 4 幕，其他幕之後再畫。
