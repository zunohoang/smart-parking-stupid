import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { newId } from './tickets/reference';
export async function persistImage(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Không lưu được ảnh.'));
      reader.readAsDataURL(blob);
    });
  }
  const directory = new Directory(Paths.document, 'parking-images');
  directory.create({ idempotent: true, intermediates: true });
  const destination = new File(directory, `${newId()}.jpg`);
  await new File(uri).copy(destination);
  return destination.uri;
}
export async function deleteImages(uris: string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  for (const uri of new Set(uris)) {
    if (uri.startsWith(new Directory(Paths.document, 'parking-images').uri)) {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  }
}
