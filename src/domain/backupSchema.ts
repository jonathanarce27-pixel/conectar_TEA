import type {
  CommunicationEvent,
  CustomPictogram,
  DiaryEntry,
  FavoriteEntry,
  PlannerWeek,
  UserProfile,
} from '../db/types';

// Esquema de Backend §10 — versiona el FORMATO del archivo de backup en sí,
// independiente de la versión de esquema de Dexie (db/schema.ts).
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  profile: UserProfile | null;
  customPictograms: CustomPictogram[];
  favorites: FavoriteEntry[];
  plannerWeeks: PlannerWeek[];
  diaryEntries: DiaryEntry[];
  communicationEvents: CommunicationEvent[];
  settings: Record<string, unknown>;
}

export interface BackupFile {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  checksum: string;
  encrypted: boolean;
  data: BackupData;
}

// Esquema de Backend §10, último punto: "La exportación 'filtrada por
// rango' ... usa el mismo esquema, pero con data.diaryEntries limitado al
// rango pedido y un campo adicional exportRange" — nunca un formato paralelo.
export interface FilteredBackupFile extends BackupFile {
  exportRange: { from: string; to: string };
}

/** sha256:<hex> sobre el JSON de `data` — permite detectar un archivo
 * corrupto o editado a mano antes de intentar importarlo (Esquema de
 * Backend §10). Usa Web Crypto (`crypto.subtle`), disponible sin red. */
export async function computeChecksum(data: BackupData): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

export async function buildBackupFile(data: BackupData, appVersion: string): Promise<BackupFile> {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    checksum: await computeChecksum(data),
    encrypted: false,
    data,
  };
}

export async function buildFilteredBackupFile(
  data: BackupData,
  appVersion: string,
  range: { from: string; to: string },
): Promise<FilteredBackupFile> {
  const base = await buildBackupFile(data, appVersion);
  return { ...base, exportRange: range };
}
