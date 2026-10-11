export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[\s.\-]/g, '');
}
export function isValidPlate(raw: string): boolean {
  // Civilian formats: 59X112345, 51F67890, 59AA24680; also old four-digit suffixes.
  return /^\d{2}[A-Z]{1,2}\d?\d{4,5}$/.test(normalizePlate(raw));
}
export function displayPlate(plate: string): string {
  const match = normalizePlate(plate).match(/^(\d{2}[A-Z]{1,2}\d?)(\d{5})$/);
  return match ? `${match[1]}-${match[2]?.slice(0, 3)}.${match[2]?.slice(3)}` : plate;
}
