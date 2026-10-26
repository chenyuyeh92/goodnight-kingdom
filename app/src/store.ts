import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap';

/** App Store Connect 裡的內購項目(非消耗型,NT$100)。 */
export const FULL_VERSION_SKU = 'goodnight_kingdom_full';

/** 跟遊戲的 src/platform/native.ts 一樣。 */
export type PurchaseResult = 'ok' | 'restored' | 'pending' | 'cancelled' | 'failed' | 'nothingToRestore';

const owns = (purchases: Purchase[]): boolean => purchases.some((p) => p.productId === FULL_VERSION_SKU && p.purchaseState !== 'pending');

/** 錯誤 → 告訴遊戲的結果。「購買前詢問」(孩子的帳號)在 StoreKit 2 是以錯誤 deferred-payment/pending 回來。 */
function errorResult(error: unknown): PurchaseResult {
  if (isUserCancelledError(error)) return 'cancelled';
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'deferred-payment' || code === 'pending' ? 'pending' : 'failed';
}

let connecting: Promise<boolean> | null = null;
function connect(): Promise<boolean> {
  connecting ??= initConnection().then(
    () => true,
    () => {
      connecting = null;
      return false;
    },
  );
  return connecting;
}

/** 商店狀態:買過沒有、價格(查不到時是 null,例如沒有網路)。 */
export async function storeStatus(): Promise<{ full: boolean; price: string | null }> {
  if (!(await connect())) return { full: false, price: null };
  const [products, purchases] = await Promise.all([
    fetchProducts({ skus: [FULL_VERSION_SKU], type: 'in-app' }).catch(() => []),
    getAvailablePurchases().catch(() => []),
  ]);
  const product = (products ?? []).find((p) => p.id === FULL_VERSION_SKU);
  return { full: owns(purchases ?? []), price: product?.displayPrice ?? null };
}

/**
 * 監聽購買結果。買的結果(包括「購買前詢問」的家長之後才同意)都從這裡來,不是從 requestPurchase 的回傳值。
 * onError 只在玩家剛按了購買時才轉給遊戲(App 打開時的其他錯誤不用告訴孩子)。
 */
export function listenPurchases(onResult: (result: PurchaseResult, full: boolean) => void, isRequesting: () => boolean): () => void {
  const updated = purchaseUpdatedListener((purchase) => {
    if (purchase.productId !== FULL_VERSION_SKU) return;
    if (purchase.purchaseState === 'pending') {
      onResult('pending', false);
      return;
    }
    // 非消耗型也要 finish,不然下次打開 App 會再收到一次。
    void finishTransaction({ purchase, isConsumable: false })
      .catch(() => undefined)
      .then(() => onResult('ok', true));
  });
  const failed = purchaseErrorListener((error) => {
    if (isRequesting()) onResult(errorResult(error), false);
  });
  return () => {
    updated.remove();
    failed.remove();
  };
}

/**
 * 按「解鎖完整版」:跳出 Apple 的購買視窗;結果通常從 listenPurchases 來。
 * 回傳 null 表示購買視窗已經結束、等 listenPurchases(App.tsx 等一下還沒有結果就當作等家長同意)。
 */
export async function buyFullVersion(): Promise<PurchaseResult | null> {
  if (!(await connect())) return 'failed';
  try {
    await requestPurchase({ request: { apple: { sku: FULL_VERSION_SKU } }, type: 'in-app' });
    return null;
  } catch (error) {
    return errorResult(error);
  }
}

/** 按「恢復購買」:換手機、重新安裝後,用同一個 Apple 帳號拿回完整版。 */
export async function restoreFullVersion(): Promise<{ result: PurchaseResult; full: boolean }> {
  if (!(await connect())) return { result: 'failed', full: false };
  try {
    await restorePurchases();
    const full = owns(await getAvailablePurchases());
    return { result: full ? 'restored' : 'nothingToRestore', full };
  } catch (error) {
    // 登入 Apple 帳號的視窗按了取消,不是網路問題。
    return { result: isUserCancelledError(error) ? 'cancelled' : 'failed', full: false };
  }
}
