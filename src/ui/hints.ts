import type { PlayMode } from '../input/playMode';
import { lang, pick, type Text } from '../i18n/lang';

/** 路邊的教學告示牌(1-1 教操作,世界 2 教流沙與壓力板)。 */
export type HintKind = 'move' | 'jump' | 'aimUp' | 'crouch' | 'melee' | 'chest' | 'quicksand' | 'plate' | 'swim' | 'dive' | 'current' | 'ice' | 'icicle' | 'lava' | 'eruption' | 'vine' | 'stampede' | 'wind' | 'cloudGap' | 'dark' | 'star' | 'darkHall';

export const HINT_KINDS: readonly HintKind[] = ['move', 'jump', 'aimUp', 'crouch', 'melee', 'chest', 'quicksand', 'plate', 'swim', 'dive', 'current', 'ice', 'icicle', 'lava', 'eruption', 'vine', 'stampede', 'wind', 'cloudGap', 'dark', 'star', 'darkHall'];

const WHAT: Record<HintKind, Text> = {
  move: { zh: '往右走,邊走邊射擊', en: 'Walk right and shoot as you go' },
  jump: { zh: '跳過荊棘', en: 'Jump over the thorns' },
  aimUp: { zh: '往上射天上的魔物', en: 'Shoot up at monsters in the sky' },
  crouch: { zh: '蹲下躲開低飛的蝙蝠', en: 'Crouch to dodge low-flying bats' },
  melee: { zh: '貼近魔物會揮枕頭,傷害更高', en: 'Get close to swing your pillow for more damage' },
  chest: { zh: '寶箱裡有新武器,碰到就打開', en: 'Chests hold new weapons. Touch one to open it' },
  quicksand: { zh: '流沙會變慢,站太久會陷下去,快走過去或跳過去', en: "Quicksand slows you down. Don't stand still—walk or jump across" },
  plate: { zh: '踩到壓力板會掉沙磚,看到影子快躲開', en: 'Pressure plates drop sand blocks. Dodge when you see a shadow' },
  swim: { zh: '在水裡按跳躍往上游,放開會慢慢沉下去', en: 'In water, press jump to swim up. Let go to sink slowly' },
  dive: { zh: '按住下可以往下潛,子彈也會往下射', en: 'Hold down to dive. Your shots go down too' },
  current: { zh: '水流會把你推著走,氣泡柱會把你往上送', en: 'Currents push you along. Bubble columns lift you up' },
  ice: { zh: '冰面很滑,起步慢、停不下來,提早放開', en: 'Ice is slippery: slow to start, hard to stop. Let go early' },
  icicle: { zh: '上面的冰柱會掉下來,看到影子快走開', en: 'Icicles fall from above. Move away when you see a shadow' },
  lava: { zh: '熔岩碰到會燙傷,跳過去或踩岩石平台', en: 'Lava burns! Jump over it or use the rock platforms' },
  eruption: { zh: '火山噴發時會掉石頭,看到影子快走開', en: 'Eruptions drop rocks. Move away when you see a shadow' },
  vine: { zh: '跳起來抓住藤蔓,按跳躍放手飛過河', en: 'Jump to grab a vine, press jump to let go and fly across' },
  stampede: { zh: '地面震動、揚起沙塵,角馬群要衝過來了!一組一組跳過去或站到岩石上', en: 'The ground shakes and dust rises—a herd is coming! Jump over each group or stand on a rock' },
  wind: { zh: '強風一陣一陣往回吹,風停的時候快往前走', en: 'Strong gusts blow you back. Move forward when the wind stops' },
  cloudGap: { zh: '小心雲海!踩著雲朵平台跳過去', en: 'Watch out for the sea of clouds! Hop across on the cloud platforms' },
  dark: { zh: '洞裡很暗,只看得到身邊和發光水晶附近,慢慢走', en: 'The cave is dark. You can only see near you and the glowing crystals. Go slowly' },
  star: { zh: '月亮城堡到處藏著星星,能找到幾顆呢?(不拿也能過關)', en: 'Stars are hidden all over the Moon Castle. How many can you find? (Optional)' },
  darkHall: { zh: '大廳的燈熄了,跟著燭台的光慢慢走', en: 'The hall lights are out. Follow the candlelight slowly' },
};

const KEYS: Record<HintKind, { a: string | Text; b: string | Text; touch: Text } | null> = {
  move: { a: { zh: 'A D 走  C 射擊', en: 'A D walk  C shoot' }, b: { zh: '← → 走  , 射擊', en: '← → walk  , shoot' }, touch: { zh: '左邊拖曳走路、右邊按射擊', en: 'drag on the left to walk, tap shoot on the right' } },
  jump: { a: 'V', b: '.', touch: { zh: '跳躍鈕', en: 'jump button' } },
  aimUp: { a: { zh: '按住 W', en: 'hold W' }, b: { zh: '按住 ↑', en: 'hold ↑' }, touch: { zh: '左邊往上拖', en: 'drag up on the left' } },
  crouch: { a: { zh: '按住 S', en: 'hold S' }, b: { zh: '按住 ↓', en: 'hold ↓' }, touch: { zh: '左邊往下拖', en: 'drag down on the left' } },
  melee: { a: 'C', b: ',', touch: { zh: '射擊鈕', en: 'shoot button' } },
  chest: null,
  quicksand: null,
  plate: null,
  swim: { a: 'V', b: '.', touch: { zh: '跳躍鈕', en: 'jump button' } },
  dive: { a: { zh: '按住 S', en: 'hold S' }, b: { zh: '按住 ↓', en: 'hold ↓' }, touch: { zh: '左邊往下拖', en: 'drag down on the left' } },
  current: null,
  ice: null,
  icicle: null,
  lava: null,
  eruption: null,
  vine: { a: 'V', b: '.', touch: { zh: '跳躍鈕', en: 'jump button' } },
  stampede: null,
  wind: null,
  cloudGap: null,
  dark: null,
  star: null,
  darkHall: null,
};

/** 告示牌文字:依單人/雙人與是否觸控顯示對應的按鍵。 */
export function hintText(kind: HintKind, mode: PlayMode, touch: boolean): string {
  const k = KEYS[kind];
  const what = pick(WHAT[kind]);
  const say = (v: string | Text): string => (typeof v === 'string' ? v : pick(v));
  if (!k) return what;
  const keys = touch ? say(k.touch) : mode === 'duo' ? `A:${say(k.a)}  B:${say(k.b)}` : say(k.a);
  // 英文句子長,按鍵放下一行比較好讀。
  return lang() === 'zh' ? `${what}(${keys})` : `${what}\n(${keys})`;
}
