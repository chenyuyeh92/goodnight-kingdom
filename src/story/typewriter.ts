/** 分頁切走回來時一次最多算這麼久(不會一下子跳很多)。 */
const MAX_STEP_MS = 1000;

/** 每個字出現的間隔。 */
export const TYPE_MS = 50;

/** 一幕的文字一個字一個字出現:shown 是已經出現幾個字(整幕的字一起算,一句打完接下一句)。 */
export interface Typewriter {
  lines: readonly string[];
  elapsedMs: number;
  shown: number;
  done: boolean;
}

const total = (lines: readonly string[]): number => lines.reduce((n, l) => n + [...l].length, 0);

export function initialTypewriter(lines: readonly string[]): Typewriter {
  return { lines, elapsedMs: 0, shown: 0, done: total(lines) === 0 };
}

export function stepTypewriter(t: Typewriter, dtMs: number): Typewriter {
  if (t.done) return t;
  const elapsedMs = t.elapsedMs + Math.min(dtMs, MAX_STEP_MS);
  const shown = Math.min(total(t.lines), Math.floor(elapsedMs / TYPE_MS));
  return { ...t, elapsedMs, shown, done: shown >= total(t.lines) };
}

/** 點一下:還在打字就整幕顯示完;已經打完就到下一幕。 */
export function tapTypewriter(t: Typewriter): { state: Typewriter; advance: boolean } {
  if (t.done) return { state: t, advance: true };
  return { state: { ...t, shown: total(t.lines), done: true }, advance: false };
}

/** 現在每一句畫出來的文字。 */
export function typedText(t: Typewriter): string[] {
  let left = t.shown;
  return t.lines.map((l) => {
    const chars = [...l];
    const n = Math.max(0, Math.min(chars.length, left));
    left -= chars.length;
    return chars.slice(0, n).join('');
  });
}
