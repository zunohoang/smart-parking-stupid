import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { AppHeader, Choice, EmptyState, Screen, SearchInput } from '@/components/ui';
import { VehicleListItem } from '@/components/parking';
import { useParkingStore } from '@/stores/parking-store';
import { vehicleLabels, vehicleTypes, type VehicleType } from '@/types/parking';
import { activeVehicles } from '@/features/parking/selectors';
import { useNow } from '@/hooks/use-now';
export default function Vehicles() {
  const sessions = useParkingStore((s) => s.sessions);
  const now = useNow();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [sort, setSort] = useState('NEW');
  const active = sessions.filter((s) => s.status === 'ACTIVE');
  const filtered = useMemo(
    () => activeVehicles(sessions, query, filter, sort === 'NEW'),
    [sessions, query, filter, sort],
  );
  return (
    <Screen scroll={false}>
      <View className="gap-4 pb-3">
        <AppHeader title="Xe trong bãi" subtitle={`${active.length} xe đang gửi`} />
        <SearchInput value={query} onChangeText={setQuery} />
        <Choice<VehicleType | 'ALL'>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'ALL' as const, label: 'Tất cả' },
            ...vehicleTypes.map((type) => ({ value: type, label: vehicleLabels[type] })),
          ]}
        />
        <Choice
          value={sort}
          onChange={setSort}
          options={[
            { value: 'NEW', label: 'Vào mới nhất' },
            { value: 'OLD', label: 'Vào lâu nhất' },
          ]}
        />
        <Text className="text-xs text-muted">{filtered.length} kết quả</Text>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <VehicleListItem session={item} now={now} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            title="Không có xe phù hợp"
            description={
              active.length
                ? 'Thử sửa biển số hoặc thay đổi bộ lọc.'
                : 'Các xe vào bãi sẽ xuất hiện tại đây.'
            }
          />
        }
      />
    </Screen>
  );
}
