import { useCallback, useEffect, useRef, useState, type ComponentType, type RefAttributes } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import GameServer from './modules/game-server';
import { buyFullVersion, listenPurchases, restoreFullVersion, storeStatus, type PurchaseResult } from './src/store';
import { shareImage } from './src/share';

const BACKGROUND = '#1d1a3a';

/** react-native-webview 的型別宣告在新版 TypeScript 會變成 never,這裡換成只用到的部分。 */
interface WebViewHandle {
  injectJavaScript(script: string): void;
  reload(): void;
}
const GameWebView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebViewHandle>>;

/** 遊戲傳來的訊息(跟遊戲的 src/platform/native.ts 一樣)。 */
type FromGame =
  | { type: 'ready' }
  | { type: 'buy' }
  | { type: 'restore' }
  | { type: 'openUrl'; url: string }
  | { type: 'shareImage'; dataUrl: string; name: string };

type ToGame = { type: 'store'; full: boolean; price: string | null } | { type: 'purchase'; result: PurchaseResult; full: boolean };

/** 晚安王國 App:整個畫面就是遊戲(從手機本機載入),App 負責 Apple 內購、用 Safari 開說明頁、分享守衛圖片。 */
export default function App() {
  useKeepAwake();
  const web = useRef<WebViewHandle>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const requesting = useRef(false);
  /** WebView 被系統收掉或載入失敗:伺服器重新開好後再載入一次。 */
  const needsReload = useRef(false);

  const toGame = useCallback((m: ToGame) => {
    web.current?.injectJavaScript(`window.__gkNative && window.__gkNative(${JSON.stringify(m)}); true;`);
  }, []);

  const purchaseResult = useCallback(
    (result: PurchaseResult, full: boolean) => {
      requesting.current = false;
      toGame({ type: 'purchase', result, full });
    },
    [toGame],
  );

  // 開本機伺服器;App 從背景回來時再確認一次(系統可能把它關了)。
  useEffect(() => {
    const start = (): void => {
      GameServer.start().then(
        (u) => {
          setFailed(false);
          setUrl(u);
          if (needsReload.current) {
            needsReload.current = false;
            web.current?.reload();
          }
        },
        () => setFailed(true),
      );
    };
    start();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && start());
    return () => sub.remove();
  }, []);

  const reloadWhenServerReady = useCallback(() => {
    needsReload.current = true;
    GameServer.start().then(
      () => {
        if (!needsReload.current) return;
        needsReload.current = false;
        web.current?.reload();
      },
      () => setFailed(true),
    );
  }, []);

  useEffect(() => listenPurchases(purchaseResult, () => requesting.current), [purchaseResult]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let m: FromGame;
      try {
        m = JSON.parse(e.nativeEvent.data) as FromGame;
      } catch {
        return;
      }
      switch (m.type) {
        case 'ready':
          void storeStatus().then((s) => toGame({ type: 'store', ...s }));
          break;
        case 'buy':
          requesting.current = true;
          void buyFullVersion().then((r) => {
            if (r) purchaseResult(r, false);
            // 購買視窗關了卻沒有結果:多半是「購買前詢問」在等家長,不要讓按鈕一直不能按。
            else setTimeout(() => requesting.current && purchaseResult('pending', false), 4000);
          });
          break;
        case 'restore':
          requesting.current = true;
          void restoreFullVersion().then(({ result, full }) => purchaseResult(result, full));
          break;
        case 'openUrl':
          if (/^https:\/\//.test(m.url)) void Linking.openURL(m.url);
          break;
        case 'shareImage':
          void shareImage(m.dataUrl, m.name).catch(() => undefined);
          break;
      }
    },
    [toGame, purchaseResult],
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {url && (
        <GameWebView
          ref={web}
          source={{ uri: url }}
          style={styles.root}
          originWhitelist={['http://127.0.0.1:*', 'https://*']}
          onMessage={onMessage}
          // 遊戲以外的網址(說明頁等)交給 Safari,不在 App 裡打開。
          onShouldStartLoadWithRequest={(r) => r.url.startsWith(new URL(url).origin) || r.url === 'about:blank'}
          // 音樂、雙人連線的畫面要能自己播放。
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          bounces={false}
          scrollEnabled={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          setSupportMultipleWindows={false}
          allowsLinkPreview={false}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView
          webviewDebuggingEnabled={__DEV__}
          // WebView 被系統收掉(記憶體不足)或載入失敗時,確認伺服器開著再重新載入;遊戲存檔還在。
          onContentProcessDidTerminate={reloadWhenServerReady}
          onError={reloadWhenServerReady}
          onHttpError={reloadWhenServerReady}
        />
      )}
      {failed && (
        <View style={styles.center}>
          <Text style={styles.message}>遊戲打不開,請把 App 完全關掉再打開。{'\n'}The game could not start. Please close the app completely and open it again.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 32 },
  message: { color: '#f3e9d2', fontSize: 18, textAlign: 'center', lineHeight: 28 },
});
