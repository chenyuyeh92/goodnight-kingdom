/** 只往前推的鏡頭:回傳新的 scrollX。 */
export function advanceCamera(
  prevScrollX: number,
  playerX: number,
  viewW: number,
  worldW: number,
  leadRatio: number,
): number {
  const wanted = Math.max(prevScrollX, playerX - viewW * leadRatio);
  return Math.min(Math.max(wanted, 0), worldW - viewW);
}

export function minPlayerX(scrollX: number, margin: number): number {
  return scrollX + margin;
}
