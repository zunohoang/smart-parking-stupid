import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, ShieldCheck } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Button, DetailRow, EmptyState, Notice, Screen } from '@/components/ui';
import { FeeBreakdown } from '@/components/parking';
import { useParkingStore } from '@/stores/parking-store';
import { useNow } from '@/hooks/use-now';
import { dateTime, duration, errorMessage } from '@/utils/format';
import { displayPlate } from '@/utils/plate';
import { vehicleLabels } from '@/types/parking';
import { calculateFee } from '@/services/pricing/calculate';
import { persistImage, deleteImages } from '@/services/images';
function Checkbox({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange(value: boolean): void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      className="min-h-12 flex-row items-center gap-3 py-2"
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-sm border ${value ? 'border-primary bg-primary' : 'border-slate-400 bg-white'}`}
      >
        {value ? <Check size={17} color="white" /> : null}
      </View>
      <Text className="flex-1 text-sm leading-5 text-ink">{label}</Text>
    </Pressable>
  );
}
export default function CheckOut() {
  const { id, image } = useLocalSearchParams<{ id: string; image?: string }>();
  const session = useParkingStore((s) => s.sessions.find((s) => s.id === id));
  const settings = useParkingStore((s) => s.settings)!;
  const checkOut = useParkingStore((s) => s.checkOut);
  const now = useNow();
  const [verified, setVerified] = useState(false);
  const [paid, setPaid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!session || session.status !== 'ACTIVE')
    return (
      <Screen>
        <AppHeader title="Xác nhận xe ra" back />
        <EmptyState
          title="Xe không còn trong bãi"
          description="Lượt gửi xe đã hoàn tất hoặc không tồn tại."
        />
        <Button onPress={() => router.replace('/vehicles')}>Về danh sách xe</Button>
      </Screen>
    );
  const fee = calculateFee(
    session.checkedInAt,
    new Date(now).toISOString(),
    session.vehicleType,
    settings,
  );
  async function submit() {
    if (busy || !verified) return;
    setBusy(true);
    setError(null);
    let savedImage: string | undefined;
    try {
      savedImage = image ? await persistImage(image) : undefined;
      const result = await checkOut(id, verified, paid, savedImage);
      router.replace({ pathname: '/check-out/success', params: { id: result.id } });
    } catch (e) {
      if (savedImage) await deleteImages([savedImage]).catch(() => undefined);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <AppHeader title="Xác nhận xe ra" subtitle="Đối chiếu xe trước khi hoàn tất" back />
      <Text selectable className="text-3xl font-bold tracking-wider text-ink">
        {displayPlate(session.plateNumber)}
      </Text>
      {session.entryImageUri ? (
        <View className="gap-2">
          <Text className="text-sm text-muted">Ảnh lúc vào</Text>
          <Image
            source={{ uri: session.entryImageUri }}
            style={{ height: 170, borderRadius: 6 }}
            contentFit="contain"
          />
        </View>
      ) : null}
      {image ? (
        <View className="gap-2">
          <Text className="text-sm text-muted">Ảnh lúc ra</Text>
          <Image
            source={{ uri: image }}
            style={{ height: 170, borderRadius: 6 }}
            contentFit="contain"
          />
        </View>
      ) : null}
      <View>
        <DetailRow label="Mã vé" value={session.ticketCode} />
        <DetailRow label="Loại xe" value={vehicleLabels[session.vehicleType]} />
        <DetailRow label="Thời gian vào" value={dateTime(session.checkedInAt)} />
        <DetailRow label="Thời gian ra dự kiến" value={dateTime(new Date(now).toISOString())} />
        <DetailRow label="Thời gian gửi" value={duration(session.checkedInAt, now)} />
        <DetailRow label="Ghi chú" value={session.notes || 'Không có'} />
      </View>
      <FeeBreakdown snapshot={fee.snapshot} amount={fee.amount} />
      <Notice>
        Đối chiếu phương tiện, vé và bằng chứng sở hữu trước khi trả xe. Chỉ biết biển số không đủ
        để xác nhận quyền nhận xe.
      </Notice>
      <View className="gap-2">
        <Checkbox
          value={verified}
          onChange={setVerified}
          label="Đã kiểm tra thông tin xe và xác nhận trả xe"
        />
        <Checkbox value={paid} onChange={setPaid} label="Đã thu tiền mặt (thanh toán demo)" />
      </View>
      <Text className="text-xs leading-5 text-muted">
        Phí và thời gian ra được tính lại khi xác nhận. Bỏ chọn thu tiền để lưu trạng thái chưa
        thanh toán.
      </Text>
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        loading={busy}
        disabled={!verified}
        icon={<ShieldCheck color="white" size={20} />}
        onPress={() => void submit()}
      >
        Xác nhận trả xe
      </Button>
    </Screen>
  );
}
