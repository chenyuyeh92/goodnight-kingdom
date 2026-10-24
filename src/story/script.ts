import type { LevelId } from '../levels/levelDef';
import { lang, type Text } from '../i18n/lang';

/** 故事的一幕:畫面由 StoryScene 依 id 拼出來,文字一到兩句(中文、英文)。 */
export interface StoryBeat {
  id: string;
  zh: readonly string[];
  en: readonly string[];
}

/** 這一幕在目前語言的文字。 */
export function beatLines(b: StoryBeat): readonly string[] {
  return lang() === 'zh' ? b.zh : b.en;
}

/** 開場(第一次按開始遊戲播放;主選單「故事」可以重看)。 */
export const OPENING: readonly StoryBeat[] = [
  {
    id: 'kingdom',
    zh: ['在很遠很遠的地方,有一個晚安王國。', '這裡的每個晚上,都很安靜、很溫柔。'],
    en: ['Far, far away, there was a Goodnight Kingdom.', 'Every night, all was quiet and gentle.'],
  },
  {
    id: 'lightsOff',
    zh: ['最近,大家睡得特別好。', '一個惡夢……都沒有。'],
    en: ['Lately, everyone had been sleeping so well.', 'Not a single nightmare…'],
  },
  {
    id: 'shadow',
    zh: ['沒有人發現,每天晚上,', '城堡的屋頂上,有一個影子靜靜地坐著。'],
    en: ['No one noticed that every night,', 'a shadow sat quietly on the castle roof.'],
  },
  {
    id: 'blackSnow',
    zh: ['直到有一天晚上——', '森林裡的魔物們,突然全部睡不著了!'],
    en: ['Until one night—', "every monster in the forest suddenly couldn't sleep!"],
  },
  {
    id: 'noisy',
    zh: ['牠們吵得整個王國都睡不著。', '大家都說:一定是有人偷走了睡意。'],
    en: ["They were so noisy the whole kingdom couldn't sleep.", 'Everyone said: someone must have stolen our sleep.'],
  },
  {
    id: 'setOff',
    zh: ['兩位睡眠不足的守衛,揉揉眼睛,出發了。', '目標——把所有魔物,一隻一隻哄睡!'],
    en: ['Two sleepy guards rubbed their eyes and set off.', 'Their mission: lull every monster to sleep, one by one!'],
  },
];

/** 結局(打倒夢貘後播放)。 */
export const ENDING: readonly StoryBeat[] = [
  {
    id: 'closeEyes',
    zh: ['夢貘的眼睛,慢慢閉上了。'],
    en: ["The Dream Tapir's eyes slowly closed."],
  },
  {
    id: 'bubbles',
    zh: ['一顆、兩顆、三顆……', '好多好多泡泡,從牠的嘴裡飄了出來。'],
    en: ['One, two, three…', 'Bubble after bubble floated out of its mouth.'],
  },
  {
    id: 'nightmares',
    zh: ['泡泡裡,是大家的惡夢。', '考試、打破的杯子、黑黑的衣櫥、找不到回家的路……'],
    en: ["Inside the bubbles were everyone's nightmares.", 'Tests, broken cups, dark closets, getting lost on the way home…'],
  },
  {
    id: 'guardsDream',
    zh: ['其中一顆泡泡裡……是守衛自己的惡夢。', '那是他們很久很久以前,早就忘記的惡夢。'],
    en: ["In one bubble… was the guards' very own nightmare.", 'One they had forgotten a long, long time ago.'],
  },
  {
    id: 'realize',
    zh: ['原來,大家睡得那麼好,不是因為沒有惡夢——', '是因為每天晚上,都有人替我們吃掉了。'],
    en: ['So that was why everyone slept so well. Not because there were no nightmares—', 'but because every night, someone ate them for us.'],
  },
  {
    id: 'sleepTalk',
    zh: ['「大家的煩惱,越來越多……我吃不完了……」', '「對不起……吵到大家了……」'],
    en: ["“Everyone's worries keep growing… I can't eat them all…”", "“I'm sorry… for waking everyone up…”"],
  },
  {
    id: 'lullaby',
    zh: ['守衛沒有說話。', '他們坐下來,輕輕唱起一路上唱過好多次的搖籃曲。'],
    en: ["The guards didn't say a word.", "They sat down and softly sang the lullaby they'd sung so many times."],
  },
  {
    id: 'friends',
    zh: ['貓頭鷹來了,人面獅身來了,水怪、雪怪、火龍……', '一路上被哄睡的大家,都來了。'],
    en: ['The Owl came, the Sphinx came, Nessie, the Yeti, the Fire Dragon…', 'Everyone they had lulled to sleep along the way came too.'],
  },
  {
    id: 'stars',
    zh: ['惡夢泡泡,一顆一顆,變成了星星。'],
    en: ['One by one, the nightmare bubbles turned into stars.'],
  },
  {
    id: 'smile',
    zh: ['「每天晚上照顧大家的你——', '今天晚上,換我們照顧你。」'],
    en: ['“You took care of everyone, every single night—', "tonight, it's our turn to take care of you.”"],
  },
  {
    id: 'townSleeps',
    zh: ['那天晚上,晚安王國的每一個人,都睡得好好的。', '包括那隻,好久好久沒有睡覺的夢貘。'],
    en: ['That night, everyone in the Goodnight Kingdom slept soundly.', "Even the Dream Tapir, who hadn't slept in so very long."],
  },
  {
    id: 'goodnight',
    zh: ['晚安。'],
    en: ['Good night.'],
  },
  {
    id: 'message',
    zh: ['如果你身邊,也有一個每天晚上替你擔心、替你煩惱的人——', '今天晚上,記得跟他說一聲:晚安。'],
    en: ['If someone near you worries for you every night—', 'remember to tell them tonight: good night.'],
  },
];

/** 每個世界第一關第一次進去時的一句話(魔物們夢到的都是人的煩惱)。 */
export const WORLD_INTRO: Readonly<Record<number, Text>> = {
  1: {
    zh: '貓頭鷹說,牠做了一個好奇怪的夢——夢裡,牠在考數學。',
    en: 'The Owl said it had the strangest dream—in the dream, it was taking a math test.',
  },
  2: {
    zh: '人面獅身說,牠夢到自己忘記帶便當。可是,人面獅身從來不帶便當。',
    en: 'The Sphinx dreamed it forgot its lunch box. But the Sphinx never brings a lunch box.',
  },
  3: {
    zh: '水怪小聲地說:「好黑……我不敢一個人睡……」水怪明明住在最黑的海底。',
    en: "Nessie whispered, “It's so dark… I'm scared to sleep alone…” Yet Nessie lives at the darkest bottom of the sea.",
  },
  4: {
    zh: '雪怪在夢裡一直說:「對不起,我不是故意打破杯子的。」',
    en: "In its dream, the Yeti kept saying, “I'm sorry, I didn't mean to break the cup.”",
  },
  5: {
    zh: '火龍說,這些惡夢是從天上掉下來的,像黑色的雪。',
    en: 'The Fire Dragon said these nightmares fell from the sky, like black snow.',
  },
  6: {
    zh: '大猩猩說,黑色的雪,是從月亮城堡的方向飄過來的。',
    en: 'The Gorilla said the black snow drifted over from the Moon Castle.',
  },
  7: {
    zh: '獅子王說:「我小時候,聽說過一種會吃夢的動物……」',
    en: 'The Lion King said, “When I was little, I heard of an animal that eats dreams…”',
  },
  8: {
    zh: '雷鳥說,城堡屋頂上有一個好大的影子,一直吃,一直吃,好像停不下來。',
    en: "The Thunderbird said there's a huge shadow on the castle roof, eating and eating, as if it can't stop.",
  },
  9: {
    zh: '巨鼴鼠說:「這些惡夢,原本都不是我們的。那……是誰的呢?」',
    en: 'The Giant Mole said, “These nightmares were never ours. Then… whose are they?”',
  },
  10: {
    zh: '城堡裡好安靜。地上到處都是黑色的雪……還有一個好大好大的影子。',
    en: 'The castle is so quiet. Black snow everywhere… and a very, very big shadow.',
  },
};

/** 每個世界的第一關(w1-1 … w10-1)放開頭句;其他關沒有。 */
export function introWorldOf(level: LevelId): number | null {
  const m = /^w(\d+)-1$/.exec(level);
  return m ? Number(m[1]) : null;
}

/** 夢貘在魔王戰裡的話(頭上的對話框)。 */
export const TAPIR_LINES: Readonly<Record<'enter' | 2 | 3, Text>> = {
  enter: { zh: '不要過來……你們不懂……', en: "Don't come closer… You don't understand…" },
  2: { zh: '我……快裝不下了……!', en: "I… can't hold any more…!" },
  3: { zh: '如果我睡著了……這些惡夢,要去哪裡?', en: 'If I fall asleep… where will all these nightmares go?' },
};
