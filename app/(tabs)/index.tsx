import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ScanLine } from 'lucide-react-native';
import { AppHeader, Button, Screen, SectionTitle, EmptyState } from '@/components/ui';
import { MetricSummary } from '@/components/parking';
import { useParkingStore } from '@/stores/parking-store';
import { useNow } from '@/hooks/use-now';
import { dateTime, money } from '@/utils/format';
import { displayPlate } from '@/utils/plate';
import { vehicleLabels } from '@/types/parking';
import { dashboardSummary } from '@/features/parking/selectors';
export default function Dashboard() {
  const sessions = useParkingStore((s) => s.sessions);
  const settings = useParkingStore((s) => s.settings)!;
  const now = useNow();
  const summary = dashboardSummary(sessions, settings.capacity, now);
  const { activeCount, events, occupancy: occupied } = summary;
  return (
    <Screen>
      <AppHeader title="Tổng quan" subtitle="Quản lý bãi giữ xe" settings />
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-medium text-ink">{settings.lotName}</Text>
        <Text className="text-xs text-muted">{new Date(now).toLocaleDateString('vi-VN')}</Text>
      </View>
      {settings.demoMode ? (
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-warning" />
          <Text className="text-xs text-warning">Chế độ demo · dữ liệu lưu trên thiết bị</Text>
        </View>
      ) : null}
      <MetricSummary
        items={[
          { label: 'Xe đang gửi', value: String(activeCount) },
          { label: 'Lượt xe vào hôm nay', value: String(summary.entriesToday) },
          { label: 'Lượt xe ra hôm nay', value: String(summary.exitsToday) },
          { label: 'Doanh thu hôm nay', value: money(summary.revenueToday) },
        ]}
      />
      <View className="gap-3">
        <SectionTitle aside={`${occupied}% đã sử dụng`}>Sức chứa bãi xe</SectionTitle>
        <View className="h-2 overflow-hidden rounded-sm bg-slate-200">
          <View className="h-2 bg-primary" style={{ width: `${Math.min(occupied, 100)}%` }} />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">
            {activeCount} / {settings.capacity} chỗ
          </Text>
          <Text
            className={`text-sm font-medium ${activeCount >= settings.capacity ? 'text-warning' : 'text-success'}`}
          >
            {activeCount >= settings.capacity
              ? 'Bãi đã đầy'
              : `Còn ${settings.capacity - activeCount} chỗ trống`}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            icon={<ScanLine color="white" size={19} />}
            onPress={() => router.navigate({ pathname: '/scan', params: { mode: 'in' } })}
          >
            Quét xe vào
          </Button>
        </View>
        <View className="flex-1">
          <Button
            secondary
            icon={<ScanLine color="#0F172A" size={19} />}
            onPress={() => router.navigate({ pathname: '/scan', params: { mode: 'out' } })}
          >
            Quét xe ra
          </Button>
        </View>
      </View>
      <View>
        <SectionTitle>Hoạt động gần đây</SectionTitle>
        {events.length === 0 ? (
          <EmptyState
            title="Chưa có hoạt động"
            description="Quét hoặc nhập biển số để ghi nhận lượt gửi xe."
          />
        ) : (
          events.map((event) => (
            <Pressable
              accessibilityRole="button"
              key={`${event.session.id}-${event.type}`}
              onPress={() =>
                router.push({ pathname: '/vehicle/[id]', params: { id: event.session.id } })
              }
              className="flex-row items-center gap-3 border-b border-line py-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                {event.type === 'in' ? (
                  <ArrowDownLeft color="#2563EB" size={21} />
                ) : (
                  <ArrowUpRight color="#64748B" size={21} />
                )}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold tracking-wide text-ink">
                  {displayPlate(event.session.plateNumber)}
                </Text>
                <Text className="text-xs text-muted">
                  {vehicleLabels[event.session.vehicleType]} · {dateTime(event.at)}
                </Text>
              </View>
              <Text
                className={`text-xs font-medium ${event.type === 'in' ? 'text-primary' : 'text-muted'}`}
              >
                {event.type === 'in' ? 'Xe vào' : 'Xe ra'}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
