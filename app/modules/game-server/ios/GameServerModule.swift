import ExpoModulesCore

/// 給 JavaScript 用的介面:GameServer.start() 回傳遊戲網址。
public class GameServerModule: Module {
  private let server = LocalGameServer()

  public func definition() -> ModuleDefinition {
    Name("GameServer")

    AsyncFunction("start") { (promise: Promise) in
      self.server.start { result in
        switch result {
        case .success(let port):
          promise.resolve("http://127.0.0.1:\(port)\(LocalGameServer.basePath)")
        case .failure(let error):
          promise.reject("E_GAME_SERVER", error.localizedDescription)
        }
      }
    }

    // 回到前景就確認伺服器還在(系統可能在背景把它關了),不用等 JavaScript。
    OnAppEntersForeground {
      self.server.start { _ in }
    }
  }
}
