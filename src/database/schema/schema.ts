export const schema = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, ticketCode TEXT NOT NULL UNIQUE, plateNumber TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('ACTIVE','COMPLETED','CANCELLED')), data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_plate ON sessions(plateNumber) WHERE status = 'ACTIVE';
PRAGMA user_version = 1;
`;
