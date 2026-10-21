import Phaser from 'phaser';

/**
 * 所有 Phaser 文字的預設樣式。Phaser 預設用拉丁字母量字高,中文字在 Windows / iOS 上上緣會被切掉;
 * 改用中文字量高度並留一點上下空間,也指定各平台的中文字型。
 */
export const BASE_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Noto Sans CJK TC", sans-serif',
  testString: '|MÉqgy晚安王國選單通關',
  padding: { x: 2, y: 6 },
};

let installed = false;

/** 讓 scene.add.text 自動套用預設樣式(各處傳入的樣式優先)。 */
export function installTextDefaults(): void {
  if (installed) return;
  installed = true;
  const proto = Phaser.GameObjects.GameObjectFactory.prototype;
  const original = proto.text;
  proto.text = function (this: Phaser.GameObjects.GameObjectFactory, x, y, text, style) {
    return original.call(this, x, y, text, { ...BASE_TEXT_STYLE, ...style });
  };
}
