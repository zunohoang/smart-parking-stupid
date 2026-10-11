import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Button, EmptyState, Notice, Screen, SecondaryButton } from '@/components/ui';
import { TicketCard } from '@/components/ticket/ticket-card';
import { useParkingStore } from '@/stores/parking-store';
export default function Ticket() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const session = useParkingStore((s) => s.sessions.find((item) => item.id === id));
  const settings = useParkingStore((s) => s.settings)!;
  if (!session)
    return (
      <Screen>
        <AppHeader title="Vé điện tử" back />
        <EmptyState
          title="Không tìm thấy vé"
          description="Vé có thể đã được đặt lại trong chế độ demo."
        />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader title="Vé điện tử" back />
      {created ? <Notice success>Đã ghi nhận xe vào bãi</Notice> : null}
      <TicketCard session={session} lotName={settings.lotName} />
      <Notice>
        Cho khách lưu lại mã vé. Khi trả xe, cần đối chiếu xe và bằng chứng sở hữu; biển số hoặc mã
        QR đơn lẻ chưa đủ để xác nhận quyền nhận xe.
      </Notice>
      <Button onPress={() => router.dismissTo('/')}>Hoàn tất</Button>
      <SecondaryButton
        onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: session.id } })}
      >
        Xem chi tiết
      </SecondaryButton>
    </Screen>
  );
}
