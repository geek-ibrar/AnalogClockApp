import { DB, open } from '@op-engineering/op-sqlite';
import { TimeZone } from '../../types';
import {
  DB_NAME,
  TABLE_TIMEZONES,
  TABLE_PREFERENCES,
  CACHE_EXPIRY_MS,
} from '../../constants';

// Singleton DB connection 
let db: DB | null = null;

// Init 

/**
 * Opens the SQLite database and creates tables if they don't exist.
 * Must be called once before any other DB operations.
 * Failures are caught and logged — the app continues in degraded mode.
 */
export const initDatabase = async (): Promise<void> => {
  try {
    db = open({ name: DB_NAME });

    // Timezones cache table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_TIMEZONES} (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        zoneName    TEXT    NOT NULL UNIQUE,
        countryCode TEXT    NOT NULL,
        countryName TEXT    NOT NULL,
        gmtOffset   INTEGER NOT NULL,
        cachedAt    INTEGER NOT NULL
      );
    `);

    // User preferences table (key-value store)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_PREFERENCES} (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    console.log('[DB] Initialized successfully.');
  } catch (error) {
    // Non-fatal: app can still run using API data only
    console.error('[DB] Initialization failed:', error);
    db = null;
  }
};

// Timezones 

/**
 * Persists a fresh list of timezones into SQLite using a single transaction.
 * Uses INSERT OR REPLACE to handle updates atomically.
 */
export const saveTimezonesToDB = async (timezones: TimeZone[]): Promise<void> => {
  if (!db) throw new Error('[DB] Not initialized');

  const now = Date.now();

  await db.execute('BEGIN TRANSACTION');
  try {
    for (const tz of timezones) {
      await db.execute(
        `INSERT OR REPLACE INTO ${TABLE_TIMEZONES}
         (zoneName, countryCode, countryName, gmtOffset, cachedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [tz.zoneName, tz.countryCode, tz.countryName, tz.gmtOffset, now],
      );
    }
    await db.execute('COMMIT');
    console.log(`[DB] Saved ${timezones.length} timezones.`);
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
};

/**
 * Reads cached timezones from SQLite.
 *
 * Returns an empty array when:
 *   - DB is not initialized
 *   - Table is empty
 *
 * Returns stale data when cache has expired (caller decides what to do).
 * `isCacheStale` flag allows the caller to trigger a background refresh.
 */
export const fetchTimezonesFromDB = async (): Promise<{
  timezones: TimeZone[];
  isCacheStale: boolean;
}> => {
  if (!db) throw new Error('[DB] Not initialized');

  const result = await db.execute(
    `SELECT zoneName, countryCode, countryName, gmtOffset, cachedAt
     FROM ${TABLE_TIMEZONES}
     ORDER BY zoneName ASC`,
  );

  const rows: any[] = result.rows ?? [];
  if (rows.length === 0) return { timezones: [], isCacheStale: true };

  const cachedAt: number = rows[0].cachedAt;
  const isCacheStale = Date.now() - cachedAt > CACHE_EXPIRY_MS;

  const timezones: TimeZone[] = rows.map((row) => ({
    zoneName: row.zoneName,
    countryCode: row.countryCode,
    countryName: row.countryName,
    gmtOffset: row.gmtOffset,
  }));

  return { timezones, isCacheStale };
};

// Preferences 

const PREF_KEY_TIMEZONE = 'selectedTimezone';

/**
 * Persists the user's selected timezone so it survives app restarts.
 */
export const saveSelectedTimezone = async (timezone: TimeZone): Promise<void> => {
  if (!db) throw new Error('[DB] Not initialized');

  await db.execute(
    `INSERT OR REPLACE INTO ${TABLE_PREFERENCES} (key, value) VALUES (?, ?)`,
    [PREF_KEY_TIMEZONE, JSON.stringify(timezone)],
  );
};

/**
 * Restores the user's previously selected timezone.
 * Returns null if no preference has been saved or if parsing fails.
 */
export const getSelectedTimezone = async (): Promise<TimeZone | null> => {
  if (!db) return null;

  try {
    const result = await db.execute(
      `SELECT value FROM ${TABLE_PREFERENCES} WHERE key = ?`,
      [PREF_KEY_TIMEZONE],
    );
    const rows: any[] = result.rows ?? [];
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].value) as TimeZone;
  } catch {
    // Corrupted JSON — treat as no preference
    return null;
  }
};

// Maintenance 

/**
 * Wipes all cached data. Called when cache corruption is detected.
 */
export const clearAllCachedData = async (): Promise<void> => {
  if (!db) return;
  await db.execute(`DELETE FROM ${TABLE_TIMEZONES}`);
  await db.execute(`DELETE FROM ${TABLE_PREFERENCES}`);
  console.log('[DB] Cache cleared.');
};
