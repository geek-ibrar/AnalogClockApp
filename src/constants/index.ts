// ─── API ──────────────────────────────────────────────────────────────────────
/**
 * We can get another free key from https://timezonedb.com/register 
 * 
 * The API key is not removed for demonstration purposes; in a production app, 
 * it should be stored securely (in env file) and not exposed in client code.
 * */
export const TIMEZONEDB_API_KEY = '5G9X1WUKPF08';
export const TIMEZONEDB_BASE_URL = 'https://api.timezonedb.com/v2.1';

// ─── Database ─────────────────────────────────────────────────────────────────
export const DB_NAME = 'analog_clock.db';
export const TABLE_TIMEZONES = 'timezones';
export const TABLE_PREFERENCES = 'user_preferences';

/** Stale-while-revalidate: serve cache, refresh in background after 24h */
export const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ─── Layout ───────────────────────────────────────────────────────────────────
/** Clock diameter = this ratio × shorter screen dimension */
export const CLOCK_SIZE_RATIO = 0.82;

// ─── Clock Visuals ────────────────────────────────────────────────────────────
export const CLOCK_THEME = {
  face: '#FEFEFE',
  faceStroke: '#1A1A2E',
  hourHand: '#1A1A2E',
  minuteHand: '#2C3E50',
  secondHand: '#E74C3C',
  center: '#E74C3C',
  centerInner: '#FFFFFF',
  hourMarker: '#1A1A2E',
  minuteMarker: '#BDC3C7',
  numbers: '#1A1A2E',
};
