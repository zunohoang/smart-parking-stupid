import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AppHeader,
  Button,
  ConfirmActionSheet,
  Field,
  Input,
  Notice,
  Screen,
  SecondaryButton,
  SectionTitle,
} from '@/components/ui';
import { useParkingStore } from '@/stores/parking-store';
import { vehicleLabels, vehicleTypes } from '@/types/parking';
import { errorMessage } from '@/utils/format';
const schema = z.object({
  lotName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên bãi xe.')
    .max(80, 'Tên bãi xe tối đa 80 ký tự.'),
  capacity: z.number().int().min(1, 'Sức chứa tối thiểu là 1.').max(100000),
  blockDurationMinutes: z.number().int().min(1, 'Thời lượng tối thiểu là 1 phút.').max(1440),
  MOTORBIKE: z.number().int().min(0).max(100000000),
  CAR: z.number().int().min(0).max(100000000),
  E_BIKE: z.number().int().min(0).max(100000000),
  OTHER: z.number().int().min(0).max(100000000),
  allowCapacityOverride: z.boolean(),
  demoMode: z.boolean(),
});
type Form = z.infer<typeof schema>;
export default function SettingsScreen() {
  const settings = useParkingStore((s) => s.settings)!;
  const saveSettings = useParkingStore((s) => s.saveSettings);
  const resetDemo = useParkingStore((s) => s.resetDemo);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      lotName: settings.lotName,
      capacity: settings.capacity,
      blockDurationMinutes: settings.blockDurationMinutes,
      ...settings.vehiclePricing,
      allowCapacityOverride: settings.allowCapacityOverride,
      demoMode: settings.demoMode,
    },
  });
  async function submit(data: Form) {
    setNotice(null);
    setError(null);
    try {
      await saveSettings({
        ...settings,
        ...data,
        vehiclePricing: {
          MOTORBIKE: data.MOTORBIKE,
          CAR: data.CAR,
          E_BIKE: data.E_BIKE,
          OTHER: data.OTHER,
        },
      });
      setNotice('Đã lưu cấu hình bãi xe.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function resetData() {
    setResetBusy(true);
    setError(null);
    setNotice(null);
    try {
      await resetDemo();
      setResetOpen(false);
      setNotice('Đã đặt lại dữ liệu mẫu và xóa các ảnh được lưu cùng lượt gửi xe.');
    } catch (e) {
      setError(errorMessage(e));
      setResetOpen(false);
    } finally {
      setResetBusy(false);
    }
  }
  const numeric = (
    name: 'capacity' | 'blockDurationMinutes' | 'MOTORBIKE' | 'CAR' | 'E_BIKE' | 'OTHER',
    label: string,
  ) => (
    <Field
      key={name}
      label={label}
      error={errors[name] ? 'Nhập số nguyên trong phạm vi hợp lệ.' : undefined}
    >
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            accessibilityLabel={label}
            keyboardType="number-pad"
            value={String(field.value)}
            onChangeText={(text) => field.onChange(text === '' ? 0 : Number(text))}
            onBlur={field.onBlur}
          />
        )}
      />
    </Field>
  );
  return (
    <Screen>
      <AppHeader title="Cài đặt bãi xe" subtitle="Cấu hình lưu trên thiết bị này" back />
      <Field label="Tên bãi xe" error={errors.lotName?.message}>
        <Controller
          control={control}
          name="lotName"
          render={({ field }) => (
            <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
          )}
        />
      </Field>
      {numeric('capacity', 'Sức chứa tối đa (xe)')}
      <SectionTitle>Bảng giá theo block</SectionTitle>
      <Text className="text-xs leading-5 text-muted">
        Giá khởi tạo là số liệu demo. Điều chỉnh theo bảng giá thực tế của bãi xe. Mỗi block đã bắt
        đầu được tính trọn phí.
      </Text>
      {numeric('blockDurationMinutes', 'Thời lượng một block (phút)')}
      <View className="flex-row flex-wrap gap-4">
        {vehicleTypes.map((type) => (
          <View key={type} style={{ width: '47%' }}>
            {numeric(type, `${vehicleLabels[type]} (đồng)`)}
          </View>
        ))}
      </View>
      {(['allowCapacityOverride', 'demoMode'] as const).map((name) => (
        <View
          key={name}
          className="flex-row items-center justify-between gap-4 border-b border-line py-3"
        >
          <View className="flex-1 gap-1">
            <Text className="text-sm font-medium text-ink">
              {name === 'demoMode' ? 'Chế độ demo' : 'Cho phép vượt sức chứa'}
            </Text>
            <Text className="text-xs leading-5 text-muted">
              {name === 'demoMode'
                ? 'Bật nhận diện mô phỏng và chức năng đặt lại dữ liệu.'
                : 'Cho phép nhận xe ngay cả khi bãi đã đầy.'}
            </Text>
          </View>
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <Switch
                accessibilityLabel={name === 'demoMode' ? 'Chế độ demo' : 'Cho phép vượt sức chứa'}
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              />
            )}
          />
        </View>
      ))}
      {error ? <Notice error>{error}</Notice> : null}
      {notice ? <Notice success>{notice}</Notice> : null}
      <Button loading={isSubmitting} onPress={() => void handleSubmit(submit)()}>
        Lưu cài đặt
      </Button>
      <View className="gap-3 border-t border-line pt-5">
        <SectionTitle>Dữ liệu demo</SectionTitle>
        <Text className="text-sm leading-5 text-muted">
          Đặt lại sẽ xóa toàn bộ lượt gửi xe và ảnh, gồm cả lịch sử đã hoàn tất, rồi tạo bộ dữ liệu
          mẫu mới. Cấu hình bãi xe được giữ lại.
        </Text>
        <SecondaryButton
          disabled={!settings.demoMode || isSubmitting}
          onPress={() => setResetOpen(true)}
        >
          Đặt lại dữ liệu demo
        </SecondaryButton>
        {!settings.demoMode ? (
          <Text className="text-xs text-muted">
            Bật và lưu chế độ demo để sử dụng chức năng này.
          </Text>
        ) : null}
      </View>
      <ConfirmActionSheet
        visible={resetOpen}
        title="Đặt lại toàn bộ dữ liệu?"
        message="Các vé đang gửi, lịch sử hoàn tất và ảnh đã lưu sẽ bị xóa. Thao tác không thể hoàn tác. Chỉ tiếp tục với dữ liệu thử nghiệm."
        busy={resetBusy}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => void resetData()}
      />
    </Screen>
  );
}
