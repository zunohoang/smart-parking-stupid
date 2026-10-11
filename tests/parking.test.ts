import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SQLiteParkingRepository,
  type DatabaseConnection,
} from '../src/database/repositories/parking-repository';
import { calculateFee } from '../src/services/pricing/calculate';
import { defaultSettings } from '../src/constants/defaults';
import { isValidPlate, normalizePlate } from '../src/utils/plate';
import { historySince, isToday } from '../src/utils/format';
import { DemoLicensePlateRecognizer } from '../src/services/recognition/recognizer';
async function fixture(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  const adapter: DatabaseConnection = {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    runAsync: async (sql, ...params) => db.prepare(sql).run(...params),
    getAllAsync: async <T>(sql: string, ...params: (string | number | null)[]) =>
      db.prepare(sql).all(...params) as T[],
    getFirstAsync: async <T>(sql: string, ...params: (string | number | null)[]) =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
  };
  const repo = new SQLiteParkingRepository(adapter);
  await repo.initialize();
  return { db, repo, adapter };
}
const input = {
  plate: ' 59-z1 111.22 ',
  rawPlateText: '59-z1 111.22',
  vehicleType: 'MOTORBIKE' as const,
  notes: 'test',
};
test('SQLite data and settings survive closing and reopening the database file', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'smart-parking-test-'));
  const filename = join(directory, 'parking.db');
  try {
    const first = await fixture(filename);
    const session = await first.repo.checkIn(input);
    await first.repo.saveSettings({
      ...(await first.repo.getSettings()),
      lotName: 'Bãi kiểm thử lưu trữ',
    });
    first.db.close();
    const second = await fixture(filename);
    try {
      assert.equal(
        (await second.repo.list()).find((s) => s.id === session.id)?.ticketCode,
        session.ticketCode,
      );
      assert.equal((await second.repo.getSettings()).lotName, 'Bãi kiểm thử lưu trữ');
    } finally {
      second.db.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
test('plate normalization accepts common car, motorcycle, electric-bike and older formats', () => {
  assert.equal(normalizePlate(input.plate), '59Z111122');
  for (const plate of ['59-X1 123.45', '51F-678.90', '59-AA 246.80', '30A-1234'])
    assert.equal(isValidPlate(plate), true, plate);
  for (const plate of ['', 'ABC', '59!X1-12345', '11']) assert.equal(isValidPlate(plate), false);
});
test('started blocks: exact boundary, one millisecond later, zero duration and invalid time', () => {
  const start = '2026-10-14T01:00:00Z';
  assert.equal(calculateFee(start, start, 'MOTORBIKE', defaultSettings).amount, 5000);
  assert.equal(calculateFee(start, '2026-10-14T02:00:00Z', 'CAR', defaultSettings).amount, 20000);
  assert.equal(
    calculateFee(start, '2026-10-14T02:00:00.001Z', 'CAR', defaultSettings).amount,
    40000,
  );
  assert.throws(() => calculateFee(start, '2026-10-13T00:00:00Z', 'CAR', defaultSettings));
});
test('concurrent duplicate check-in is prevented atomically; reload preserves tickets', async () => {
  const { db, repo, adapter } = await fixture();
  try {
    const results = await Promise.allSettled([
      repo.checkIn(input),
      repo.checkIn({ ...input, plate: '59Z1-11122' }),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
    const second = new SQLiteParkingRepository(adapter);
    await second.initialize();
    const matching = (await second.list()).filter((s) => s.plateNumber === '59Z111122');
    assert.equal(matching.length, 1);
    assert.equal(matching[0]?.status, 'ACTIVE');
  } finally {
    db.close();
  }
});
test('capacity blocks check-in and explicit override permits it', async () => {
  const { db, repo } = await fixture();
  try {
    const settings = await repo.getSettings();
    await repo.saveSettings({ ...settings, capacity: 1 });
    await assert.rejects(repo.checkIn(input), /đã đầy/);
    await repo.saveSettings({ ...settings, capacity: 1, allowCapacityOverride: true });
    assert.equal((await repo.checkIn(input)).status, 'ACTIVE');
  } finally {
    db.close();
  }
});
test('verification is required; repeat checkout blocked; historical pricing stays fixed', async () => {
  const { db, repo } = await fixture();
  try {
    const session = await repo.checkIn(input);
    await assert.rejects(repo.checkOut(session.id, false, true), /kiểm tra/);
    const done = await repo.checkOut(session.id, true, false);
    assert.equal(done.status, 'COMPLETED');
    assert.equal(done.paymentStatus, 'UNPAID');
    assert.equal(done.feeAmount, 5000);
    await assert.rejects(repo.checkOut(session.id, true, true), /đã ra/);
    const settings = await repo.getSettings();
    await repo.saveSettings({
      ...settings,
      vehiclePricing: { ...settings.vehiclePricing, MOTORBIKE: 99000 },
    });
    const historical = (await repo.list()).find((s) => s.id === session.id);
    assert.equal(historical?.feeAmount, 5000);
    assert.equal(historical?.feeRuleSnapshot?.rate, 5000);
    assert.equal((await repo.checkIn(input)).status, 'ACTIVE');
  } finally {
    db.close();
  }
});
test('reset is explicit demo-only, returns managed image references and persists settings', async () => {
  const { db, repo } = await fixture();
  try {
    await repo.checkIn({ ...input, entryImageUri: 'file:///managed/test.jpg' });
    const settings = await repo.getSettings();
    await repo.saveSettings({ ...settings, demoMode: false, lotName: 'Bãi thử nghiệm' });
    await assert.rejects(repo.resetDemo(), /chế độ demo/);
    await repo.saveSettings({ ...settings, demoMode: true, lotName: 'Bãi thử nghiệm' });
    assert.deepEqual(await repo.resetDemo(), ['file:///managed/test.jpg']);
    assert.equal((await repo.getSettings()).lotName, 'Bãi thử nghiệm');
    assert.equal(
      (await repo.list()).some((s) => s.plateNumber === '59Z111122'),
      false,
    );
  } finally {
    db.close();
  }
});
test('daily boundaries use local calendar dates and seven-day filter includes today', () => {
  const today = new Date(2026, 9, 14, 0, 0, 1);
  assert.equal(isToday(new Date(2026, 9, 13, 23, 59, 59).toISOString(), today), false);
  assert.equal(isToday(new Date(2026, 9, 14, 0, 0, 0).toISOString(), today), true);
  assert.equal(historySince(7, today), new Date(2026, 9, 8).getTime());
});
test('demo recognition always exposes its simulated source', async () => {
  const result = await new DemoLicensePlateRecognizer().recognize(null, '51F-678.90');
  assert.equal(result.source, 'DEMO');
  assert.equal(result.normalizedPlate, '51F67890');
  assert.match(result.message, /mô phỏng/);
});
