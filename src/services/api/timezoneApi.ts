import { TimeZone } from '../../types';
import { TIMEZONEDB_API_KEY, TIMEZONEDB_BASE_URL } from '../../constants';

interface TimezoneDBResponse {
  status: 'OK' | 'FAILED';
  message: string;
  zones: Array<{
    countryCode: string;
    countryName: string;
    zoneName: string;
    gmtOffset: number;
    timestamp: number;
  }>;
}

/**
 * Fetches all available timezones from the TimezoneDB public API.
 *
 * @throws {Error} on network failure or non-OK API response.
 */
export const fetchTimezonesFromAPI = async (): Promise<TimeZone[]> => {
  const url =
    `${TIMEZONEDB_BASE_URL}/list-time-zone` +
    `?key=${TIMEZONEDB_API_KEY}&format=json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: TimezoneDBResponse = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`TimezoneDB API error: ${data.message}`);
  }

  return data.zones.map((zone) => ({
    zoneName: zone.zoneName,
    countryCode: zone.countryCode,
    countryName: zone.countryName,
    gmtOffset: zone.gmtOffset,
  }));
};
