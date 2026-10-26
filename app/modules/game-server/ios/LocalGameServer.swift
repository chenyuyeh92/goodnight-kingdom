import Foundation
import Network

/// 只給這支手機自己連的小網頁伺服器:把打包在 App 裡的遊戲檔案交給 WebView。
///
/// - 用固定的埠:網址不變,遊戲存檔(localStorage 跟著網址存)才會一直在。
/// - 遊戲是照網站的路徑 /goodnight-kingdom/ 打包的,這裡把這段拿掉再找檔案。
/// - 所有工作都在同一個佇列上做,不需要鎖。
final class LocalGameServer: @unchecked Sendable {
  static let basePath = "/goodnight-kingdom/"
  /// 第一個一直被占用時才換下一個(換了埠,之前的存檔會看不到;用過的埠會記住)。
  static let ports: [UInt16] = [47291, 47292, 47293, 47294]

  enum ServerError: LocalizedError {
    case noGameFiles
    case noFreePort

    var errorDescription: String? {
      switch self {
      case .noGameFiles: return "The game files are missing from the app bundle."
      case .noFreePort: return "Could not open a local port for the game."
      }
    }
  }

  private let queue = DispatchQueue(label: "goodnight-kingdom.game-server")
  private let root = LocalGameServer.findGameFolder()
  private var listener: NWListener?
  private var readyPort: UInt16?
  /// 用過的埠(記在手機裡):每次打開 App 都用同一個,網址才一樣、存檔才看得到。
  private var savedIndex: Int? = {
    let i = UserDefaults.standard.object(forKey: "GoodnightGamePortIndex") as? Int
    return i.flatMap { LocalGameServer.ports.indices.contains($0) ? $0 : nil }
  }()
  /// 這次打開 App 已經開好過(從背景回來時伺服器被系統關掉,要用同一個埠重開,已經載入的遊戲才連得到)。
  private var servedThisLaunch = false
  private var waiting: [(Result<UInt16, Error>) -> Void] = []

  func start(_ done: @escaping (Result<UInt16, Error>) -> Void) {
    queue.async {
      if let port = self.readyPort {
        done(.success(port))
        return
      }
      guard self.root != nil else {
        done(.failure(ServerError.noGameFiles))
        return
      }
      self.waiting.append(done)
      if self.listener == nil { self.listen(portIndex: self.savedIndex ?? 0, attempt: 0) }
    }
  }

  private func finish(_ result: Result<UInt16, Error>) {
    let callbacks = waiting
    waiting.removeAll()
    callbacks.forEach { $0(result) }
  }

  private func listen(portIndex: Int, attempt: Int) {
    guard portIndex < Self.ports.count, let port = NWEndpoint.Port(rawValue: Self.ports[portIndex]) else {
      finish(.failure(ServerError.noFreePort))
      return
    }
    let parameters = NWParameters.tcp
    parameters.requiredInterfaceType = .loopback
    parameters.allowLocalEndpointReuse = true
    guard let listener = try? NWListener(using: parameters, on: port) else {
      retry(portIndex: portIndex, attempt: attempt)
      return
    }
    self.listener = listener
    listener.newConnectionHandler = { [weak self] connection in self?.serve(connection) }
    listener.stateUpdateHandler = { [weak self, weak listener] state in
      guard let self, let listener, self.listener === listener else { return }
      switch state {
      case .ready:
        self.servedThisLaunch = true
        if self.savedIndex != portIndex {
          self.savedIndex = portIndex
          UserDefaults.standard.set(portIndex, forKey: "GoodnightGamePortIndex")
        }
        self.readyPort = port.rawValue
        self.finish(.success(port.rawValue))
      case .failed, .waiting:
        // 埠被占用,或 App 在背景時被系統關掉:重開(見 retry)。
        listener.cancel()
        self.listener = nil
        self.readyPort = nil
        self.retry(portIndex: portIndex, attempt: attempt)
      case .cancelled:
        if self.listener === listener {
          self.listener = nil
          self.readyPort = nil
        }
      default:
        break
      }
    }
    listener.start(queue: queue)
  }

  /// 開不起來時:同一個埠過一下再試。這次已經開好過,就一直用同一個埠;
  /// 第一次開而且一直被別的 App 占用,才換下一個埠(換了之前的存檔會看不到,所以先等一等)。
  private func retry(portIndex: Int, attempt: Int) {
    let keepPort = servedThisLaunch || attempt < 6
    if !keepPort {
      listen(portIndex: portIndex + 1, attempt: 0)
      return
    }
    if attempt >= 20 { finish(.failure(ServerError.noFreePort)) }
    let delay = min(0.25 * Double(attempt + 1), 3)
    queue.asyncAfter(deadline: .now() + delay) {
      if self.listener == nil { self.listen(portIndex: portIndex, attempt: attempt + 1) }
    }
  }

  // MARK: - 回應 WebView 的請求

  private func serve(_ connection: NWConnection) {
    connection.start(queue: queue)
    receiveHead(connection, Data())
  }

  /// 讀到請求的標頭結束(空行)為止;只需要第一行。
  private func receiveHead(_ connection: NWConnection, _ received: Data) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 16 * 1024) { [weak self] data, _, isComplete, error in
      guard let self else {
        connection.cancel()
        return
      }
      var buffer = received
      if let data { buffer.append(data) }
      if let end = buffer.range(of: Data("\r\n\r\n".utf8)) {
        self.respond(connection, head: String(decoding: buffer[buffer.startIndex..<end.lowerBound], as: UTF8.self))
      } else if error != nil || isComplete || buffer.count > 64 * 1024 {
        connection.cancel()
      } else {
        self.receiveHead(connection, buffer)
      }
    }
  }

  private func respond(_ connection: NWConnection, head: String) {
    let requestLine = head.components(separatedBy: "\r\n").first ?? ""
    let parts = requestLine.split(separator: " ")
    guard parts.count >= 2 else {
      send(connection, status: "400 Bad Request")
      return
    }
    let method = parts[0]
    guard method == "GET" || method == "HEAD" else {
      send(connection, status: "405 Method Not Allowed")
      return
    }
    guard let root, let file = Self.file(for: String(parts[1]), in: root),
          let body = try? Data(contentsOf: file, options: .alwaysMapped) else {
      send(connection, status: "404 Not Found")
      return
    }
    send(connection, status: "200 OK", type: Self.contentType(file.pathExtension), body: body, includeBody: method == "GET")
  }

  private func send(_ connection: NWConnection, status: String, type: String = "text/plain; charset=utf-8", body: Data = Data(), includeBody: Bool = true) {
    var head = "HTTP/1.1 \(status)\r\n"
    head += "Content-Type: \(type)\r\n"
    head += "Content-Length: \(body.count)\r\n"
    // 檔案跟著 App 一起更新,不要讓 WebView 留著舊版的快取。
    head += "Cache-Control: no-store\r\n"
    head += "Connection: close\r\n\r\n"
    let close = NWConnection.SendCompletion.contentProcessed { _ in connection.cancel() }
    if includeBody && !body.isEmpty {
      // 標頭和檔案分開送,大的音樂檔不用再複製一份。
      connection.send(content: Data(head.utf8), isComplete: false, completion: .idempotent)
      connection.send(content: body, contentContext: .finalMessage, isComplete: true, completion: close)
    } else {
      connection.send(content: Data(head.utf8), contentContext: .finalMessage, isComplete: true, completion: close)
    }
  }

  // MARK: - 找檔案

  /// 網址路徑 → App 裡的檔案;拿掉 /goodnight-kingdom/、查詢字串,不准用 .. 跑到資料夾外面。
  static func file(for target: String, in root: URL) -> URL? {
    var path = String(target.prefix { $0 != "?" && $0 != "#" })
    path = path.removingPercentEncoding ?? path
    if path + "/" == basePath { path = "/" }
    if path.hasPrefix(basePath) { path = "/" + path.dropFirst(basePath.count) }
    if path.hasSuffix("/") { path += "index.html" }
    let parts = path.split(separator: "/")
    guard !parts.isEmpty, !parts.contains(where: { $0 == ".." || $0 == "." }) else { return nil }
    let url = parts.reduce(root) { $0.appendingPathComponent(String($1)) }
    var isDirectory: ObjCBool = false
    guard FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory), !isDirectory.boolValue else { return nil }
    return url
  }

  static func contentType(_ ext: String) -> String {
    switch ext.lowercased() {
    case "html": return "text/html; charset=utf-8"
    case "js", "mjs": return "text/javascript; charset=utf-8"
    case "css": return "text/css; charset=utf-8"
    case "json", "map": return "application/json"
    case "txt", "md": return "text/plain; charset=utf-8"
    case "png": return "image/png"
    case "webp": return "image/webp"
    case "jpg", "jpeg": return "image/jpeg"
    case "svg": return "image/svg+xml"
    case "ico": return "image/x-icon"
    case "mp3": return "audio/mpeg"
    case "m4a": return "audio/mp4"
    case "ogg": return "audio/ogg"
    case "wav": return "audio/wav"
    case "woff2": return "font/woff2"
    case "woff": return "font/woff"
    case "ttf": return "font/ttf"
    default: return "application/octet-stream"
    }
  }

  /// 遊戲檔案放在 App 裡的 GoodnightGame 資料夾(podspec 的 resources)。
  static func findGameFolder() -> URL? {
    for bundle in [Bundle.main, Bundle(for: LocalGameServer.self)] {
      if let url = bundle.url(forResource: "GoodnightGame", withExtension: nil),
         FileManager.default.fileExists(atPath: url.appendingPathComponent("index.html").path) {
        return url
      }
    }
    return nil
  }
}
