/** 結局第 8 幕:一路哄睡過的魔王圍著夢貘坐下,左右交錯、前後兩排。 */
export interface Spot {
  x: number;
  y: number;
}

/** 第 i 隻:偶數在左、奇數在右,越後面離中間越遠;每隔一組往後退一排(y 小 30)。 */
export function friendSpots(count: number, width: number, baseY: number): Spot[] {
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const k = Math.floor(i / 2);
    return { x: width / 2 + side * (150 + k * 56), y: baseY - (k % 2) * 30 };
  });
}

/** 畫的順序:後排(y 小)先畫,前排後畫才會在上面;同一排照原本順序。 */
export function backRowFirst(spots: readonly Spot[]): number[] {
  return spots.map((_, i) => i).sort((a, b) => spots[a].y - spots[b].y || a - b);
}
