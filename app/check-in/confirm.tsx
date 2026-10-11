import { useState } from 'react';
import { Text } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader, Button, Field, Input, Notice, Screen, DetailRow } from '@/components/ui';
import { PlateNumberInput, VehicleTypeSelector } from '@/components/parking';
import { vehicleTypes } from '@/types/parking';
import { useParkingStore } from '@/stores/parking-store';
import { persistImage, deleteImages } from '@/services/images';
import { dateTime, errorMessage } from '@/utils/format';
import { isValidPlate } from '@/utils/plate';
const formSchema = z.object({
  plate: z.string().refine(isValidPlate, 'Biển số không hợp lệ.'),
  type: z.enum(vehicleTypes),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự.'),
});
type Form = z.infer<typeof formSchema>;
export default function CheckIn() {
  const params = useLocalSearchParams<{ plate?: string; raw?: string; image?: string }>();
  const settings = useParkingStore((s) => s.settings)!;
  const sessions = useParkingStore((s) => s.sessions);
  const checkIn = useParkingStore((s) => s.checkIn);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(formSchema),
    defaultValues: { plate: params.plate ?? '', type: 'MOTORBIKE', notes: '' },
  });
  const full = sessions.filter((s) => s.status === 'ACTIVE').length >= settings.capacity;
  async function submit(data: Form) {
    setError(null);
    let image: string | undefined;
    try {
      image = params.image ? await persistImage(params.image) : undefined;
      const session = await checkIn({
        plate: data.plate,
        rawPlateText: params.raw ?? data.plate,
        vehicleType: data.type,
        notes: data.notes,
        entryImageUri: image,
      });
      router.replace({ pathname: '/ticket/[id]', params: { id: session.id, created: '1' } });
    } catch (e) {
      if (image) await deleteImages([image]).catch(() => undefined);
      setError(errorMessage(e));
    }
  }
  return (
    <Screen>
      <AppHeader title="Xác nhận xe vào" subtitle={settings.lotName} back />
      {params.image ? (
        <Image
          source={{ uri: params.image }}
          style={{ height: 170, borderRadius: 6 }}
          contentFit="contain"
        />
      ) : null}
      <Field label="Biển số xe" error={errors.plate?.message}>
        <Controller
          control={control}
          name="plate"
          render={({ field }) => (
            <PlateNumberInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </Field>
      <Field label="Loại phương tiện">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <VehicleTypeSelector value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>
      <DetailRow label="Thời gian vào" value={dateTime(new Date().toISOString())} />
      <Text className="text-xs text-muted">Thời gian chính xác được ghi khi xác nhận nhận xe.</Text>
      <Field label="Ghi chú (không bắt buộc)" error={errors.notes?.message}>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Input
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={3}
              placeholder="Màu xe, vị trí đỗ…"
            />
          )}
        />
      </Field>
      {full ? (
        <Notice>
          {settings.allowCapacityOverride
            ? 'Bãi xe đã đầy. Cấu hình hiện tại cho phép nhận vượt sức chứa.'
            : 'Bãi xe đã đầy. Không thể nhận thêm xe.'}
        </Notice>
      ) : null}
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        loading={isSubmitting}
        disabled={full && !settings.allowCapacityOverride}
        onPress={() => void handleSubmit(submit)()}
      >
        Xác nhận nhận xe · Tạo vé
      </Button>
    </Screen>
  );
}
