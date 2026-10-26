import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** 分享畫好的守衛:先存成暫存的 PNG,再打開系統的分享選單(存到照片、傳給家人)。 */
export async function shareImage(dataUrl: string, name: string): Promise<void> {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match || !(await Sharing.isAvailableAsync())) return;
  const safeName = name.replace(/[\\/:*?"<>|]/g, '_') || 'guard.png';
  const file = new File(Paths.cache, safeName);
  if (file.exists) file.delete();
  file.create();
  await file.write(match[1], { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, { mimeType: 'image/png', UTI: 'public.png' });
}
