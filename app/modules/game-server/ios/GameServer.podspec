Pod::Spec.new do |s|
  s.name           = 'GameServer'
  s.version        = '1.0.0'
  s.summary        = '晚安王國:在手機本機提供打包好的遊戲檔案'
  s.description    = 'A tiny loopback-only HTTP server that serves the bundled web game to the WebView.'
  s.author         = 'Chen-Yu Yeh'
  s.homepage       = 'https://chenyuyeh92.github.io/goodnight-kingdom/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '*.swift'
  # 遊戲檔案(scripts/build-web.mjs 產生)整個資料夾放進 App,保留資料夾結構。
  s.resources = ['GoodnightGame']
end
