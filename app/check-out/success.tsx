import { Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Button, DetailRow, EmptyState, Screen, SecondaryButton } from '@/components/ui';
import { FeeBreakdown } from '@/components/parking';
import { useParkingStore } from '@/stores/parking-store';
import { dateTime, duration } from '@/utils/format';
import { displayPlate } from '@/utils/plate';
export default function Success() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useParkingStore((s) => s.sessions.find((s) => s.id === id));
  if (!session || session.status !== 'COMPLETED')
    return (
      <Screen>
        <AppHeader title="Biên nhận" back />
        <EmptyState title="Không tìm thấy biên nhận" description="Kiểm tra lại lịch sử gửi xe." />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader title="Biên nhận xe ra" />
      <View className="items-center gap-3 py-5">
        <CheckCircle2 color="#15803D" size={40} />
        <Text className="text-center text-xl font-bold text-ink">Đã hoàn tất lượt gửi xe</Text>
        <Text className="text-sm text-muted">Dữ liệu đã được lưu vào lịch sử</Text>
      </View>
      <Text selectable className="text-center text-3xl font-bold tracking-wider text-ink">
        {displayPlate(session.plateNumber)}
      </Text>
      <View>
        <DetailRow label="Mã vé" value={session.ticketCode} />
        <DetailRow label="Xe vào" value={dateTime(session.checkedInAt)} />
        <DetailRow label="Xe ra" value={dateTime(session.checkedOutAt!)} />
        <DetailRow
          label="Thời gian gửi"
          value={duration(session.checkedInAt, session.checkedOutAt!)}
        />
        <DetailRow
          label="Thanh toán"
          value={session.paymentStatus === 'CASH' ? 'Đã thu tiền mặt (demo)' : 'Chưa thanh toán'}
        />
      </View>
      {session.feeRuleSnapshot ? (
        <FeeBreakdown snapshot={session.feeRuleSnapshot} amount={session.feeAmount ?? 0} />
      ) : null}
      <Button onPress={() => router.dismissTo('/')}>Về tổng quan</Button>
      <SecondaryButton onPress={() => router.dismissTo('/scan')}>Tiếp tục quét xe</SecondaryButton>
    </Screen>
  );
}
