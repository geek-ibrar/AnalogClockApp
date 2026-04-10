/**
 * Represents a single timezone entry returned by the TimezoneDB API
 * and stored in the local SQLite cache.
 */
export interface TimeZone {
  zoneName: string;    // e.g. "Asia/Karachi"
  countryCode: string; // e.g. "PK"
  countryName: string; // e.g. "Pakistan"
  gmtOffset: number;   // UTC offset in seconds (e.g. 18000 for UTC+5)
}

/**
 * Decomposed time values used to drive the analog clock hands.
 */
export interface ClockTime {
  hours: number;   // 0–23
  minutes: number; // 0–59
  seconds: number; // 0–59
}

/**
 * Redux state shape for the timezone feature.
 */
export interface TimezoneState {
  timezones: TimeZone[];
  selectedTimezone: TimeZone | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}
