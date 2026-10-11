import type { FeeRuleSnapshot, ParkingSettings, VehicleType } from '../../types/parking';
export function calculateFee(
  start: string,
  end: string,
  type: VehicleType,
  settings: ParkingSettings,
): { amount: number; snapshot: FeeRuleSnapshot } {
  const elapsed = new Date(end).getTime() - new Date(start).getTime();
  const rate = settings.vehiclePricing[type];
  if (!Number.isFinite(elapsed) || elapsed < 0)
    throw new Error('Thời gian ra phải sau thời gian vào.');
  if (
    !Number.isSafeInteger(rate) ||
    rate < 0 ||
    !Number.isSafeInteger(settings.blockDurationMinutes) ||
    settings.blockDurationMinutes <= 0
  )
    throw new Error('Bảng giá không hợp lệ.');
  const blocks = Math.max(1, Math.ceil(elapsed / (settings.blockDurationMinutes * 60000)));
  const amount = blocks * rate;
  if (!Number.isSafeInteger(amount)) throw new Error('Số tiền vượt giới hạn cho phép.');
  return {
    amount,
    snapshot: {
      version: 1,
      blockDurationMinutes: settings.blockDurationMinutes,
      rate,
      blocks,
      durationMilliseconds: elapsed,
    },
  };
}
