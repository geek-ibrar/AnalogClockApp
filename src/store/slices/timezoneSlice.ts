import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { TimeZone, TimezoneState } from '../../types';
import {
  fetchTimezonesFromDB,
  saveTimezonesToDB,
  getSelectedTimezone,
  saveSelectedTimezone,
  clearAllCachedData,
} from '../../services/database/sqliteService';
import { fetchTimezonesFromAPI } from '../../services/api/timezoneApi';

// Thunks 

/**
 * Bootstrap thunk — runs once on app start.
 *
 * Strategy (stale-while-revalidate):
 *   1. Immediately serve cached timezones (fast startup)
 *   2. Fetch fresh data from API in the background
 *   3. Update cache and Redux store when API responds
 *   4. If both API and cache fail → reject with a user-friendly message
 */
export const initializeTimezones = createAsyncThunk(
  'timezone/initialize',
  async (_, { rejectWithValue }) => {
    let cachedTimezones: TimeZone[] = [];
    let isOffline = false;

    // ── Step 1: Load from SQLite (non-blocking fast path) ──
    try {
      const { timezones, isCacheStale } = await fetchTimezonesFromDB();
      cachedTimezones = timezones;
      isOffline = true; // will flip to false if API succeeds
    } catch (dbError) {
      console.warn('[Store] DB read failed, proceeding to API:', dbError);
    }

    // ── Step 2: Fetch from API ──
    try {
      const fresh = await fetchTimezonesFromAPI();
      await saveTimezonesToDB(fresh);
      cachedTimezones = fresh;
      isOffline = false;
    } catch (apiError) {
      console.warn('[Store] API fetch failed, using cache:', apiError);
      if (cachedTimezones.length === 0) {
        return rejectWithValue(
          'No internet connection and no cached data available. ' +
          'Please connect to the internet and relaunch the app.',
        );
      }
      isOffline = true;
    }

    // ── Step 3: Restore user preference ──
    let savedTimezone: TimeZone | null = null;
    try {
      savedTimezone = await getSelectedTimezone();
    } catch {
      // Non-fatal — user just won't see their last selection
    }

    return { timezones: cachedTimezones, isOffline, savedTimezone };
  },
);

/**
 * Persists the user's timezone selection to SQLite and updates Redux.
 */
export const selectTimezone = createAsyncThunk(
  'timezone/select',
  async (timezone: TimeZone, { rejectWithValue }) => {
    try {
      await saveSelectedTimezone(timezone);
      return timezone;
    } catch (error) {
      // Return timezone anyway — state update succeeds even if save fails
      console.error('[Store] Failed to persist timezone selection:', error);
      return timezone;
    }
  },
);

/**
 * Clears the SQLite cache and re-fetches from API.
 * Useful for corruption recovery.
 */
export const resetAndRefetch = createAsyncThunk(
  'timezone/resetAndRefetch',
  async (_, { dispatch }) => {
    await clearAllCachedData();
    return dispatch(initializeTimezones());
  },
);

// Slice

const initialState: TimezoneState = {
  timezones: [],
  selectedTimezone: null,
  loading: false,
  error: null,
  isOffline: false,
};

const timezoneSlice = createSlice({
  name: 'timezone',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── initializeTimezones ──
    builder.addCase(initializeTimezones.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(initializeTimezones.fulfilled, (state, action) => {
      state.loading = false;
      state.timezones = action.payload.timezones;
      state.isOffline = action.payload.isOffline;

      // Restore saved timezone only if it still exists in the fetched list
      if (action.payload.savedTimezone) {
        const stillValid = action.payload.timezones.find(
          (tz) => tz.zoneName === action.payload.savedTimezone?.zoneName,
        );
        state.selectedTimezone = stillValid ?? null;
      }
    });
    builder.addCase(initializeTimezones.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ── selectTimezone ──
    builder.addCase(selectTimezone.fulfilled, (state, action) => {
      state.selectedTimezone = action.payload;
    });
  },
});

export const { clearError } = timezoneSlice.actions;
export default timezoneSlice.reducer;
