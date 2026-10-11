import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppHeader,
  Button,
  DetailRow,
  EmptyState,
  Screen,
  SecondaryButton,
  StatusBadge,
} from '@/components/ui';
import { FeeBreakdown } from '@/components/parking';
import { useParkingStore } from '@/stores/parking-store';
import { useNow } from '@/hooks/use-now';
import { dateTime, duration } from '@/utils/format';
import { displayPlate } from '@/utils/plate';
import { vehicleLabels } from '@/types/parking';
import { calculateFee } from '@/services/pricing/calculate';
export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useParkingStore((s) => s.sessions.find((item) => item.id === id));
  const settings = useParkingStore((s) => s.settings)!;
  const now = useNow();
  if (!session)
    return (
      <Screen>
        <AppHeader title="Chi tiết xe" back />
        <EmptyState
          title="Không tìm thấy lượt gửi xe"
          description="Dữ liệu có thể đã được đặt lại trong chế độ demo."
        />
      </Screen>
    );
  const active = session.status === 'ACTIVE';
  const estimated = active
    ? calculateFee(session.checkedInAt, new Date(now).toISOString(), session.vehicleType, settings)
    : null;
  return (
    <Screen>
      <AppHeader title={active ? 'Chi tiết xe' : 'Chi tiết lịch sử'} back />
      <View className="gap-3">
        <Text selectable className="text-3xl font-bold tracking-wider text-ink">
          {displayPlate(session.plateNumber)}
        </Text>
        <StatusBadge completed={!active} />
      </View>
      {session.entryImageUri ? (
        <View className="gap-2">
          <Text className="text-sm text-muted">Ảnh khi vào bãi</Text>
          <Image
            source={{ uri: session.entryImageUri }}
            style={{ height: 190, borderRadius: 6 }}
            contentFit="contain"
          />
        </View>
      ) : null}
      <View>
        <DetailRow label="Mã vé" value={session.ticketCode} />
        <DetailRow label="Phương tiện" value={vehicleLabels[session.vehicleType]} />
        <DetailRow label="Thời gian vào" value={dateTime(session.checkedInAt)} />
        {session.checkedOutAt ? (
          <DetailRow label="Thời gian ra" value={dateTime(session.checkedOutAt)} />
        ) : null}
        <DetailRow
          label="Thời gian gửi"
          value={duration(session.checkedInAt, session.checkedOutAt ?? now)}
        />
        <DetailRow label="Ghi chú" value={session.notes || 'Không có'} />
        {!active ? (
          <DetailRow
            label="Thanh toán"
            value={session.paymentStatus === 'CASH' ? 'Đã thu tiền mặt (demo)' : 'Chưa thanh toán'}
          />
        ) : null}
      </View>
      {session.exitImageUri ? (
        <View className="gap-2">
          <Text className="text-sm text-muted">Ảnh khi ra bãi</Text>
          <Image
            source={{ uri: session.exitImageUri }}
            style={{ height: 170, borderRadius: 6 }}
            contentFit="contain"
          />
        </View>
      ) : null}
      {estimated ? (
        <View className="gap-2">
          <Text className="text-sm text-muted">Phí tạm tính tại thời điểm hiện tại</Text>
          <FeeBreakdown snapshot={estimated.snapshot} amount={estimated.amount} />
        </View>
      ) : session.feeRuleSnapshot ? (
        <FeeBreakdown snapshot={session.feeRuleSnapshot} amount={session.feeAmount ?? 0} />
      ) : null}
      {active ? (
        <Button onPress={() => router.push({ pathname: '/check-out/confirm', params: { id } })}>
          Làm thủ tục xe ra
        </Button>
      ) : null}
      <SecondaryButton onPress={() => router.push({ pathname: '/ticket/[id]', params: { id } })}>
        Xem vé điện tử
      </SecondaryButton>
    </Screen>
  );
}
