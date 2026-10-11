import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { AppHeader, Choice, EmptyState, Screen, SearchInput } from '@/components/ui';
import { VehicleListItem } from '@/components/parking';
import { useParkingStore } from '@/stores/parking-store';
import { money } from '@/utils/format';
import { completedVehicles, cashRevenue } from '@/features/parking/selectors';
import { useNow } from '@/hooks/use-now';
export default function HistoryScreen() {
  const sessions = useParkingStore((s) => s.sessions);
  const now = useNow();
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('1');
  const rows = useMemo(
    () => completedVehicles(sessions, query, range === 'ALL' ? null : Number(range), now),
    [sessions, range, query, now],
  );
  const revenue = cashRevenue(rows);
  return (
    <Screen scroll={false}>
      <View className="gap-4 pb-3">
        <AppHeader title="Lịch sử" subtitle="Các lượt gửi xe đã hoàn tất" />
        <SearchInput value={query} onChangeText={setQuery} />
        <Choice
          value={range}
          onChange={setRange}
          options={[
            { value: '1', label: 'Hôm nay' },
            { value: '7', label: '7 ngày' },
            { value: '30', label: '30 ngày' },
            { value: 'ALL', label: 'Tất cả' },
          ]}
        />
        <View className="flex-row items-center justify-between border-b border-line pb-4">
          <Text className="text-sm text-muted">{rows.length} lượt · Đã thu tiền mặt</Text>
          <Text className="text-lg font-bold text-ink">{money(revenue)}</Text>
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <VehicleListItem session={item} now={now} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có lượt gửi xe"
            description="Lịch sử được lưu sau khi xác nhận xe ra bãi."
          />
        }
      />
    </Screen>
  );
}
