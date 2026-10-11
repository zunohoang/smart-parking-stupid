import type { ParkingSession, VehicleType } from '../../types/parking';
import { historySince, isToday } from '../../utils/format';
import { normalizePlate } from '../../utils/plate';
export function findActiveSession(sessions: ParkingSession[], plate: string): ParkingSession {
  const matches = sessions.filter(
    (s) => s.status === 'ACTIVE' && s.plateNumber === normalizePlate(plate),
  );
  if (!matches.length)
    throw new Error('Không tìm thấy xe trong bãi. Sửa biển số hoặc tìm trong danh sách xe.');
  if (matches.length > 1)
    throw new Error('Có nhiều vé khớp biển số. Vui lòng đối chiếu trong danh sách xe.');
  return matches[0]!;
}
function matchesQuery(session: ParkingSession, query: string): boolean {
  return (
    session.plateNumber.includes(normalizePlate(query)) ||
    session.ticketCode.includes(query.toUpperCase().trim())
  );
}
export function activeVehicles(
  sessions: ParkingSession[],
  query = '',
  filter: VehicleType | 'ALL' = 'ALL',
  newest = true,
): ParkingSession[] {
  return sessions
    .filter(
      (s) =>
        s.status === 'ACTIVE' &&
        (filter === 'ALL' || s.vehicleType === filter) &&
        matchesQuery(s, query),
    )
    .sort((a, b) =>
      newest
        ? b.checkedInAt.localeCompare(a.checkedInAt)
        : a.checkedInAt.localeCompare(b.checkedInAt),
    );
}
export function completedVehicles(
  sessions: ParkingSession[],
  query: string,
  days: number | null,
  now: number,
): ParkingSession[] {
  return sessions
    .filter(
      (s) =>
        s.status === 'COMPLETED' &&
        s.checkedOutAt &&
        (days === null ||
          new Date(s.checkedOutAt).getTime() >= historySince(days, new Date(now))) &&
        matchesQuery(s, query),
    )
    .sort((a, b) => (b.checkedOutAt ?? '').localeCompare(a.checkedOutAt ?? ''));
}
export function cashRevenue(sessions: ParkingSession[]): number {
  return sessions
    .filter((s) => s.status === 'COMPLETED' && s.paymentStatus === 'CASH')
    .reduce((sum, s) => sum + (s.feeAmount ?? 0), 0);
}
export function dashboardSummary(sessions: ParkingSession[], capacity: number, now: number) {
  const active = activeVehicles(sessions);
  const today = new Date(now);
  const exits = sessions.filter(
    (s) => s.status === 'COMPLETED' && s.checkedOutAt && isToday(s.checkedOutAt, today),
  );
  return {
    activeCount: active.length,
    entriesToday: sessions.filter((s) => isToday(s.checkedInAt, today)).length,
    exitsToday: exits.length,
    revenueToday: cashRevenue(exits),
    occupancy: Math.round((active.length / capacity) * 100),
    events: sessions
      .flatMap((s) => [
        { session: s, type: 'in' as const, at: s.checkedInAt },
        ...(s.checkedOutAt ? [{ session: s, type: 'out' as const, at: s.checkedOutAt }] : []),
      ])
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6),
  };
}
