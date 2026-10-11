export const vehicleTypes = ['MOTORBIKE', 'CAR', 'E_BIKE', 'OTHER'] as const;
export type VehicleType = (typeof vehicleTypes)[number];
export const vehicleLabels: Record<VehicleType, string> = {
  MOTORBIKE: 'Xe máy',
  CAR: 'Ô tô',
  E_BIKE: 'Xe đạp điện',
  OTHER: 'Khác',
};
export interface FeeRuleSnapshot {
  version: 1;
  blockDurationMinutes: number;
  rate: number;
  blocks: number;
  durationMilliseconds: number;
}
export interface ParkingSession {
  id: string;
  ticketCode: string;
  plateNumber: string;
  rawPlateText: string;
  vehicleType: VehicleType;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  checkedInAt: string;
  checkedOutAt: string | null;
  entryImageUri: string | null;
  exitImageUri: string | null;
  notes: string;
  feeAmount: number | null;
  feeRuleSnapshot: FeeRuleSnapshot | null;
  paymentStatus: 'UNPAID' | 'CASH';
  createdAt: string;
  updatedAt: string;
}
export interface ParkingSettings {
  id: string;
  lotName: string;
  capacity: number;
  allowCapacityOverride: boolean;
  demoMode: boolean;
  blockDurationMinutes: number;
  vehiclePricing: Record<VehicleType, number>;
  updatedAt: string;
}
export interface CheckInInput {
  plate: string;
  rawPlateText: string;
  vehicleType: VehicleType;
  notes: string;
  entryImageUri?: string;
}
export interface ParkingRepository {
  initialize(): Promise<void>;
  list(): Promise<ParkingSession[]>;
  getSettings(): Promise<ParkingSettings>;
  checkIn(input: CheckInInput): Promise<ParkingSession>;
  checkOut(
    id: string,
    verified: boolean,
    paid: boolean,
    exitImageUri?: string,
  ): Promise<ParkingSession>;
  saveSettings(settings: ParkingSettings): Promise<void>;
  resetDemo(): Promise<string[]>;
}
