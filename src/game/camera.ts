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

/** 雙人鏡頭:跟著醒著角色的中點,但不能讓最落後的角色離開畫面左緣。 */
export function advanceTeamCamera(
  prevScrollX: number,
  xs: readonly number[],
  viewW: number,
  worldW: number,
  leadRatio: number,
  margin: number,
): number {
  if (xs.length === 0) return prevScrollX;
  const focus = xs.reduce((a, b) => a + b, 0) / xs.length;
  const wanted = advanceCamera(prevScrollX, focus, viewW, worldW, leadRatio);
  return Math.min(wanted, Math.max(prevScrollX, Math.min(...xs) - margin));
}

/** 限制鏡頭每格最多前進 maxStep,避免落後的隊友睡著時畫面瞬間跳過去。 */
export function limitCameraStep(prevScrollX: number, targetScrollX: number, maxStep: number): number {
  return Math.min(targetScrollX, prevScrollX + maxStep);
}

/** 戰鬥區鎖住時,鏡頭不超過鎖定位置。 */
export function applyLock(targetScrollX: number, lockScrollX: number | null): number {
  return lockScrollX === null ? targetScrollX : Math.min(targetScrollX, lockScrollX);
}
