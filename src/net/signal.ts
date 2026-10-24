import { isSignalMsg, type SignalMsg } from './room';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/online';

/** 交換連線資訊的管道:同一個房間號碼的裝置互相傳訊息。 */
export interface Signal {
  /** 連上管道後才 resolve;連不上就 reject。 */
  ready: Promise<void>;
  send(m: SignalMsg): void;
  onMessage(cb: (m: SignalMsg) => void): void;
  close(): void;
}

const EVENT = 'sig';
/** 連線服務這麼久還沒連上就放棄,顯示連不上網路。 */
const READY_TIMEOUT_MS = 10000;

/** 正式用:Supabase Realtime 的廣播頻道(不存資料,只轉送)。套件用到才載入,不拖慢遊戲開啟。 */
export function supabaseSignal(code: string): Signal {
  const listeners: ((m: SignalMsg) => void)[] = [];
  let close = (): void => undefined;
  let send = (_m: SignalMsg): void => undefined;
  const ready = import('@supabase/realtime-js').then(
    ({ RealtimeClient }) =>
      new Promise<void>((resolve, reject) => {
        const client = new RealtimeClient(`${SUPABASE_URL.replace(/^http/, 'ws')}/realtime/v1`, { params: { apikey: SUPABASE_ANON_KEY } });
        const channel = client.channel(`gk-room-${code}`, { config: { broadcast: { self: false, ack: false } } });
        channel.on('broadcast', { event: EVENT }, ({ payload }) => {
          if (isSignalMsg(payload)) listeners.forEach((cb) => cb(payload));
        });
        send = (m) => void channel.send({ type: 'broadcast', event: EVENT, payload: m });
        close = () => {
          void channel.unsubscribe();
          client.disconnect();
        };
        // 網路很差時不要一直卡在「連線中」。
        const timer = setTimeout(() => {
          close();
          reject(new Error('timeout'));
        }, READY_TIMEOUT_MS);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            resolve();
          } else {
            clearTimeout(timer);
            reject(new Error(status));
          }
        });
      }),
  );
  return {
    ready,
    send: (m) => send(m),
    onMessage: (cb) => void listeners.push(cb),
    close: () => close(),
  };
}

/** 測試用(網址加 ?net=local):同一個瀏覽器的分頁之間用 BroadcastChannel 傳,不連外部網路。 */
export function localSignal(code: string): Signal {
  const bc = new BroadcastChannel(`gk-room-${code}`);
  const listeners: ((m: SignalMsg) => void)[] = [];
  bc.onmessage = (e: MessageEvent) => {
    if (isSignalMsg(e.data)) listeners.forEach((cb) => cb(e.data as SignalMsg));
  };
  return {
    ready: Promise.resolve(),
    send: (m) => bc.postMessage(m),
    onMessage: (cb) => void listeners.push(cb),
    close: () => bc.close(),
  };
}

export function openSignal(code: string, local: boolean): Signal {
  return local ? localSignal(code) : supabaseSignal(code);
}
