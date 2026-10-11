import { create } from 'zustand';
import { openDatabaseAsync } from 'expo-sqlite';
import { SQLiteParkingRepository } from '../database/repositories/parking-repository';
import type { CheckInInput, ParkingSession, ParkingSettings } from '../types/parking';
import { deleteImages } from '../services/images';
import { errorMessage } from '../utils/format';
let repository: SQLiteParkingRepository | null = null;
let initializing: Promise<void> | null = null;
interface State {
  sessions: ParkingSession[];
  settings: ParkingSettings | null;
  ready: boolean;
  error: string | null;
  initialize(): Promise<void>;
  refresh(): Promise<void>;
  checkIn(input: CheckInInput): Promise<ParkingSession>;
  checkOut(
    id: string,
    verified: boolean,
    paid: boolean,
    exitImageUri?: string,
  ): Promise<ParkingSession>;
  saveSettings(settings: ParkingSettings): Promise<void>;
  resetDemo(): Promise<void>;
}
function repo() {
  if (!repository) throw new Error('Dữ liệu chưa sẵn sàng.');
  return repository;
}
export const useParkingStore = create<State>((set, get) => ({
  sessions: [],
  settings: null,
  ready: false,
  error: null,
  initialize: () => {
    if (initializing) return initializing;
    set({ error: null });
    initializing = (async () => {
      try {
        repository = new SQLiteParkingRepository(await openDatabaseAsync('smart-parking.db'));
        await repository.initialize();
        await get().refresh();
        set({ ready: true });
      } catch (error) {
        set({ error: errorMessage(error) });
      } finally {
        initializing = null;
      }
    })();
    return initializing;
  },
  refresh: async () => {
    const sessions = await repo().list();
    const settings = await repo().getSettings();
    set({ sessions, settings });
  },
  checkIn: async (input) => {
    const session = await repo().checkIn(input);
    set((s) => ({ sessions: [session, ...s.sessions] }));
    return session;
  },
  checkOut: async (id, verified, paid, image) => {
    const session = await repo().checkOut(id, verified, paid, image);
    set((s) => ({ sessions: s.sessions.map((item) => (item.id === id ? session : item)) }));
    return session;
  },
  saveSettings: async (settings) => {
    await repo().saveSettings(settings);
    set({
      settings: {
        ...settings,
        lotName: settings.lotName.trim(),
        updatedAt: new Date().toISOString(),
      },
    });
  },
  resetDemo: async () => {
    const images = await repo().resetDemo();
    await get().refresh();
    await deleteImages(images);
  },
}));
