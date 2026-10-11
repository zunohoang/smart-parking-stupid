import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bike, Car, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Choice, DetailRow, Input, StatusBadge } from '../ui';
import {
  vehicleLabels,
  vehicleTypes,
  type ParkingSession,
  type VehicleType,
  type FeeRuleSnapshot,
} from '../../types/parking';
import { dateTime, duration, money } from '../../utils/format';
import { displayPlate } from '../../utils/plate';
export function VehicleTypeSelector({
  value,
  onChange,
}: {
  value: VehicleType;
  onChange(value: VehicleType): void;
}) {
  return (
    <Choice
      options={vehicleTypes.map((type) => ({ value: type, label: vehicleLabels[type] }))}
      value={value}
      onChange={onChange}
    />
  );
}
export function PlateNumberInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      autoCapitalize="characters"
      autoCorrect={false}
      maxLength={24}
      placeholder="59-X1 123.45"
      className="text-xl font-bold tracking-widest"
    />
  );
}
export const VehicleListItem = memo(function VehicleListItem({
  session,
  now,
}: {
  session: ParkingSession;
  now: number;
}) {
  const Icon = session.vehicleType === 'CAR' ? Car : Bike;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xe ${displayPlate(session.plateNumber)}, ${vehicleLabels[session.vehicleType]}`}
      onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: session.id } })}
      className="flex-row items-center gap-3 border-b border-line py-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-md bg-slate-100">
        <Icon size={22} color="#64748B" />
      </View>
      <View className="flex-1 gap-1">
        <Text selectable className="text-base font-bold tracking-wide text-ink">
          {displayPlate(session.plateNumber)}
        </Text>
        <Text className="text-xs text-muted">
          {vehicleLabels[session.vehicleType]} · {dateTime(session.checkedInAt)}
        </Text>
        <Text className="text-xs text-muted">
          {duration(session.checkedInAt, session.checkedOutAt ?? now)}
          {session.status === 'COMPLETED' ? ` · ${money(session.feeAmount ?? 0)}` : ''}
        </Text>
      </View>
      <View className="items-end gap-2">
        <StatusBadge completed={session.status === 'COMPLETED'} />
        <ChevronRight color="#94A3B8" size={16} />
      </View>
    </Pressable>
  );
});
export function MetricSummary({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View className="flex-row flex-wrap rounded-md border border-line bg-white">
      {items.map((item, i) => (
        <View
          key={item.label}
          className={`w-1/2 gap-2 p-4 ${i < 2 ? 'border-b border-line' : ''} ${i % 2 === 0 ? 'border-r border-line' : ''}`}
        >
          <Text className="text-xs font-medium text-muted">{item.label}</Text>
          <Text
            selectable
            className="text-2xl font-bold text-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
export function FeeBreakdown({ snapshot, amount }: { snapshot: FeeRuleSnapshot; amount: number }) {
  return (
    <View className="rounded-md border border-line bg-white px-4">
      <DetailRow
        label="Đơn giá"
        value={`${money(snapshot.rate)} / ${snapshot.blockDurationMinutes} phút`}
      />
      <DetailRow label="Số block (làm tròn lên)" value={`${snapshot.blocks} block`} />
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-base font-semibold text-ink">Tổng tiền</Text>
        <Text className="text-2xl font-bold text-primary">{money(amount)}</Text>
      </View>
    </View>
  );
}
