import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useParkingStore } from '@/stores/parking-store';
import { Button, LoadingState, Notice, Screen } from '@/components/ui';
export { ErrorBoundary } from 'expo-router';
export default function RootLayout() {
  const ready = useParkingStore((s) => s.ready);
  const error = useParkingStore((s) => s.error);
  const initialize = useParkingStore((s) => s.initialize);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {error ? (
        <Screen>
          <Notice error>{error}</Notice>
          <Button onPress={() => void initialize()}>Thử mở lại dữ liệu</Button>
        </Screen>
      ) : !ready ? (
        <LoadingState />
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings/index" />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
