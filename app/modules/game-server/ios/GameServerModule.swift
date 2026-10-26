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
  }
}
