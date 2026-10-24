import type { StorageLike } from '../config/tuning';

/** 遊戲的語言:繁體中文、英文。 */
export type Lang = 'zh' | 'en';
/** 設定裡的選擇:自動(跟著裝置)或固定一種。 */
export type LangChoice = Lang | 'auto';

/** 一段兩種語言的文字(資料表用;畫面上的字用 tr)。 */
export interface Text {
  zh: string;
  en: string;
}

const KEY = 'gk.lang.v1';
let current: Lang = 'zh';

/** 裝置的第一個語言是中文(zh-TW、zh-HK、zh-CN…)就用中文,其他都用英文。 */
export function detectLang(languages: readonly string[]): Lang {
  return languages[0]?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function savedChoice(s: StorageLike | null): LangChoice {
  try {
    const v = s?.getItem(KEY);
    return v === 'zh' || v === 'en' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** 開遊戲時決定語言:網址 ?lang= > 設定裡選的 > 裝置語言。 */
export function initLang(s: StorageLike | null, languages: readonly string[], urlLang: string | null): void {
  const choice = savedChoice(s);
  current = urlLang === 'zh' || urlLang === 'en' ? urlLang : choice === 'auto' ? detectLang(languages) : choice;
}

/** 設定裡換語言(記在這台裝置);auto 是跟著裝置。 */
export function setLang(choice: LangChoice, s: StorageLike | null, languages: readonly string[] = []): void {
  try {
    s?.setItem(KEY, choice);
  } catch {
    // 無法存檔時只是記不住。
  }
  current = choice === 'auto' ? detectLang(languages) : choice;
}

export function lang(): Lang {
  return current;
}

/** 畫面上的字:依目前語言挑一個。 */
export function tr(zh: string, en: string): string {
  return current === 'zh' ? zh : en;
}

export function pick(t: Text): string {
  return current === 'zh' ? t.zh : t.en;
}
