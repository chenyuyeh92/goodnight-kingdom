/** 兩次點擊間隔小於這個時間就當成「雙擊」。 */
const DOUBLE_TAP_MS = 350;

/**
 * 手機瀏覽器擋掉雙擊放大與雙指縮放(遊戲畫面一放大就會跑版)。
 * iOS Safari 不理會 user-scalable=no,要在事件層擋:
 * - 很快的第二次 touchend 取消預設動作(就是雙擊放大);
 * - 雙指移動、Safari 的 gesturestart 取消預設動作(雙指縮放);
 * - dblclick 取消預設動作。
 * 畫畫介面的按鈕要能連續點(例如連按復原),所以不擋。
 */
export function preventZoom(doc: Document = document): () => void {
  let lastTouchEnd = 0;
  const onTouchEnd = (e: TouchEvent): void => {
    const now = e.timeStamp || Date.now();
    const target = e.target as HTMLElement | null;
    const inStudio = !!target?.closest?.('#draw-studio');
    if (!inStudio && now - lastTouchEnd < DOUBLE_TAP_MS && e.cancelable) e.preventDefault();
    lastTouchEnd = now;
  };
  const onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 1 && e.cancelable) e.preventDefault();
  };
  const block = (e: Event): void => {
    if (e.cancelable) e.preventDefault();
  };
  const opts = { passive: false } as const;
  doc.addEventListener('touchend', onTouchEnd, opts);
  doc.addEventListener('touchmove', onTouchMove, opts);
  doc.addEventListener('gesturestart', block, opts);
  doc.addEventListener('dblclick', block, opts);
  return () => {
    doc.removeEventListener('touchend', onTouchEnd);
    doc.removeEventListener('touchmove', onTouchMove);
    doc.removeEventListener('gesturestart', block);
    doc.removeEventListener('dblclick', block);
  };
}
