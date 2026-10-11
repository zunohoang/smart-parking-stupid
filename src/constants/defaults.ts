import type { ParkingSettings } from '../types/parking';
export const defaultSettings: ParkingSettings = {
  id: 'default',
  lotName: 'Bãi xe Trung tâm',
  capacity: 100,
  allowCapacityOverride: false,
  demoMode: true,
  blockDurationMinutes: 60,
  vehiclePricing: { MOTORBIKE: 5000, CAR: 20000, E_BIKE: 3000, OTHER: 10000 },
  updatedAt: new Date().toISOString(),
};
export const demoPlates = ['59-X1 123.45', '51F-678.90', '59-AA 246.80', '30A-456.78'];
