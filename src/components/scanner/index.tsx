import { Text, View } from 'react-native';
import { Choice } from '../ui';
export type ScanMode = 'in' | 'out';
export function ScanModeSelector({
  value,
  onChange,
}: {
  value: ScanMode;
  onChange(mode: ScanMode): void;
}) {
  return (
    <Choice
      value={value}
      onChange={onChange}
      options={[
        { value: 'in', label: 'Xe vào' },
        { value: 'out', label: 'Xe ra' },
      ]}
    />
  );
}
export function CameraFrameOverlay() {
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <View
        style={{ width: '82%', height: 112, borderWidth: 2, borderColor: 'white', borderRadius: 4 }}
      />
      <Text className="mt-4 text-center text-sm text-white">Đặt biển số trong khung hình</Text>
    </View>
  );
}
