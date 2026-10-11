import { defaultSettings } from '../../constants/defaults';
import { calculateFee } from '../../services/pricing/calculate';
import { newId } from '../../services/tickets/reference';
import type {
  CheckInInput,
  ParkingRepository,
  ParkingSession,
  ParkingSettings,
  VehicleType,
} from '../../types/parking';
import { isValidPlate, normalizePlate } from '../../utils/plate';
import { schema } from '../schema/schema';

type SqlValue = string | number | null;
export interface DatabaseConnection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}
export class SQLiteParkingRepository implements ParkingRepository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private db: DatabaseConnection) {}
  // Every access uses one queue; no unrelated query can join an open transaction.
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.catch(() => undefined);
    return result;
  }
  private async transaction<T>(work: () => Promise<T>): Promise<T> {
    await this.db.execAsync('BEGIN IMMEDIATE');
    try {
      const result = await work();
      await this.db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }
  private async settings(): Promise<ParkingSettings> {
    const row = await this.db.getFirstAsync<{ data: string }>(
      'SELECT data FROM settings WHERE id = ?',
      'default',
    );
    if (!row) throw new Error('Chưa có cấu hình bãi xe.');
    return JSON.parse(row.data) as ParkingSettings;
  }
  private async insert(session: ParkingSession): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO sessions (id,ticketCode,plateNumber,status,data) VALUES (?,?,?,?,?)',
      session.id,
      session.ticketCode,
      session.plateNumber,
      session.status,
      JSON.stringify(session),
    );
  }
  initialize() {
    return this.serial(async () => {
      await this.db.execAsync(schema);
      await this.transaction(async () => {
        const row = await this.db.getFirstAsync<{ id: string }>('SELECT id FROM settings LIMIT 1');
        if (!row) {
          await this.db.runAsync(
            'INSERT INTO settings (id,data) VALUES (?,?)',
            'default',
            JSON.stringify(defaultSettings),
          );
          await this.seed(defaultSettings);
        }
      });
    });
  }
  list() {
    return this.serial(async () =>
      (await this.db.getAllAsync<{ data: string }>('SELECT data FROM sessions'))
        .map((row) => JSON.parse(row.data) as ParkingSession)
        .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt)),
    );
  }
  getSettings() {
    return this.serial(() => this.settings());
  }
  checkIn(input: CheckInInput) {
    return this.serial(() =>
      this.transaction(async () => {
        const plate = normalizePlate(input.plate);
        if (!isValidPlate(plate))
          throw new Error('Biển số không hợp lệ. Ví dụ: 59-X1 123.45 hoặc 51F-678.90.');
        const settings = await this.settings();
        if (!(input.vehicleType in settings.vehiclePricing))
          throw new Error('Vui lòng chọn loại phương tiện.');
        const duplicate = await this.db.getFirstAsync<{ id: string }>(
          'SELECT id FROM sessions WHERE plateNumber = ? AND status = ?',
          plate,
          'ACTIVE',
        );
        if (duplicate)
          throw new Error('Biển số này đã có xe đang gửi. Vui lòng kiểm tra vé hiện có.');
        const count = await this.db.getFirstAsync<{ total: number }>(
          'SELECT COUNT(*) AS total FROM sessions WHERE status = ?',
          'ACTIVE',
        );
        if ((count?.total ?? 0) >= settings.capacity && !settings.allowCapacityOverride)
          throw new Error('Bãi xe đã đầy. Không thể nhận thêm xe.');
        const now = new Date().toISOString();
        const id = newId();
        const session: ParkingSession = {
          id,
          ticketCode: `SP-${id.toUpperCase()}`,
          plateNumber: plate,
          rawPlateText: input.rawPlateText || input.plate,
          vehicleType: input.vehicleType,
          status: 'ACTIVE',
          checkedInAt: now,
          checkedOutAt: null,
          entryImageUri: input.entryImageUri ?? null,
          exitImageUri: null,
          notes: input.notes.trim(),
          feeAmount: null,
          feeRuleSnapshot: null,
          paymentStatus: 'UNPAID',
          createdAt: now,
          updatedAt: now,
        };
        await this.insert(session);
        return session;
      }),
    );
  }
  checkOut(id: string, verified: boolean, paid: boolean, exitImageUri?: string) {
    return this.serial(() =>
      this.transaction(async () => {
        if (!verified) throw new Error('Cần kiểm tra thông tin xe và xác nhận trả xe.');
        const row = await this.db.getFirstAsync<{ data: string }>(
          'SELECT data FROM sessions WHERE id = ? AND status = ?',
          id,
          'ACTIVE',
        );
        if (!row) throw new Error('Xe đã ra bãi hoặc không tìm thấy lượt gửi xe.');
        const session = JSON.parse(row.data) as ParkingSession;
        const now = new Date().toISOString();
        const fee = calculateFee(
          session.checkedInAt,
          now,
          session.vehicleType,
          await this.settings(),
        );
        const completed: ParkingSession = {
          ...session,
          status: 'COMPLETED',
          checkedOutAt: now,
          updatedAt: now,
          exitImageUri: exitImageUri ?? null,
          feeAmount: fee.amount,
          feeRuleSnapshot: fee.snapshot,
          paymentStatus: paid ? 'CASH' : 'UNPAID',
        };
        await this.db.runAsync(
          'UPDATE sessions SET status = ?, data = ? WHERE id = ? AND status = ?',
          'COMPLETED',
          JSON.stringify(completed),
          id,
          'ACTIVE',
        );
        return completed;
      }),
    );
  }
  saveSettings(settings: ParkingSettings) {
    return this.serial(async () => {
      if (
        !settings.lotName.trim() ||
        !Number.isSafeInteger(settings.capacity) ||
        settings.capacity < 1 ||
        !Number.isSafeInteger(settings.blockDurationMinutes) ||
        settings.blockDurationMinutes < 1 ||
        Object.values(settings.vehiclePricing).some(
          (rate) => !Number.isSafeInteger(rate) || rate < 0,
        )
      )
        throw new Error('Vui lòng kiểm tra tên bãi xe, sức chứa và bảng giá.');
      await this.db.runAsync(
        'UPDATE settings SET data = ? WHERE id = ?',
        JSON.stringify({
          ...settings,
          id: 'default',
          lotName: settings.lotName.trim(),
          updatedAt: new Date().toISOString(),
        }),
        'default',
      );
    });
  }
  resetDemo() {
    return this.serial(() =>
      this.transaction(async () => {
        const settings = await this.settings();
        if (!settings.demoMode) throw new Error('Hãy bật chế độ demo trước khi đặt lại dữ liệu.');
        const rows = await this.db.getAllAsync<{ data: string }>('SELECT data FROM sessions');
        const images = rows.flatMap((row) => {
          const s = JSON.parse(row.data) as ParkingSession;
          return [s.entryImageUri, s.exitImageUri].filter((uri): uri is string => Boolean(uri));
        });
        await this.db.runAsync('DELETE FROM sessions');
        await this.seed(settings);
        return images;
      }),
    );
  }
  private async seed(settings: ParkingSettings): Promise<void> {
    const samples: [string, VehicleType, number, number | null][] = [
      ['59X112345', 'MOTORBIKE', 25, null],
      ['51F67890', 'CAR', 92, null],
      ['59AA24680', 'E_BIKE', 180, null],
      ['59Y256789', 'MOTORBIKE', 240, null],
      ['30A45678', 'CAR', 360, null],
      ['59H198765', 'MOTORBIKE', 72, 12],
      ['51G12345', 'CAR', 155, 35],
      ['59B112346', 'MOTORBIKE', 1600, 1500],
      ['59C112347', 'OTHER', 4500, 4400],
    ];
    let active = 0;
    for (const [plate, type, entryMinutes, exitMinutes] of samples) {
      if (exitMinutes === null && active >= settings.capacity && !settings.allowCapacityOverride)
        continue;
      if (exitMinutes === null) active++;
      const now = Date.now();
      const start = new Date(now - entryMinutes * 60000).toISOString();
      const end = exitMinutes === null ? null : new Date(now - exitMinutes * 60000).toISOString();
      const id = newId();
      const fee = end ? calculateFee(start, end, type, settings) : null;
      await this.insert({
        id,
        ticketCode: `SP-${id.toUpperCase()}`,
        plateNumber: plate,
        rawPlateText: plate,
        vehicleType: type,
        status: end ? 'COMPLETED' : 'ACTIVE',
        checkedInAt: start,
        checkedOutAt: end,
        entryImageUri: null,
        exitImageUri: null,
        notes: 'Dữ liệu mô phỏng',
        feeAmount: fee?.amount ?? null,
        feeRuleSnapshot: fee?.snapshot ?? null,
        paymentStatus: end ? 'CASH' : 'UNPAID',
        createdAt: start,
        updatedAt: end ?? start,
      });
    }
  }
}
