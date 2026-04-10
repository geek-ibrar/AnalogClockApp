import { useEffect, useState } from 'react';
import { ClockTime, TimeZone } from '../types';

/**
 * Computes the current clock time for a given timezone.
 *
 * When `timezone` is null, returns local device time.
 * When `timezone` is provided, converts UTC to that zone using its gmtOffset.
 */
const computeTime = (timezone: TimeZone | null): ClockTime => {
  const now = new Date();

  if (!timezone) {
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    };
  }

  // UTC epoch ms → apply target timezone offset
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const zoneDate = new Date(utcMs + timezone.gmtOffset * 1_000);

  return {
    hours: zoneDate.getHours(),
    minutes: zoneDate.getMinutes(),
    seconds: zoneDate.getSeconds(),
  };
};

/**
 * Returns live clock time updated every second.
 * Re-initialises immediately when the selected timezone changes.
 *
 * @param timezone - The timezone to display, or null for local time
 */
export const useClock = (timezone: TimeZone | null): ClockTime => {
  const [time, setTime] = useState<ClockTime>(() => computeTime(timezone));

  useEffect(() => {
    // Snap to correct time immediately on timezone change
    setTime(computeTime(timezone));

    const id = setInterval(() => setTime(computeTime(timezone)), 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return time;
};
