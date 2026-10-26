import { requireNativeModule } from 'expo';

interface GameServerModule {
  /** 開好手機本機的小伺服器,回傳遊戲網址(重複呼叫沒關係;App 回到前景時會再呼叫,伺服器被系統關掉就重開)。 */
  start(): Promise<string>;
}

export default requireNativeModule<GameServerModule>('GameServer');
