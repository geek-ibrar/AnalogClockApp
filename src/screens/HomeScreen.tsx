import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalogClock from '../components/AnalogClock';
import TimeZoneSelector from '../components/TimeZoneSelector';
import { useClock } from '../hooks/useClock';
import { useOrientation } from '../hooks/useOrientation';
import { initDatabase } from '../services/database/sqliteService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearError,
  initializeTimezones,
  resetAndRefetch,
  selectTimezone,
} from '../store/slices/timezoneSlice';
import { TimeZone } from '../types';

/** Pads a number to 2 digits: 9 → "09" */
const pad = (n: number) => String(n).padStart(2, '0');

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timezones, selectedTimezone, loading, error, isOffline } =
    useAppSelector((state) => state.timezone);

  const time = useClock(selectedTimezone);
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await initDatabase();        // open / create SQLite tables
      dispatch(initializeTimezones()); // load cache then fetch API
    })();
  }, [dispatch]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (tz: TimeZone) => dispatch(selectTimezone(tz)),
    [dispatch],
  );

  const handleRefresh = useCallback(
    () => dispatch(initializeTimezones()),
    [dispatch],
  );

  const handleRecoverCache = useCallback(
    () => dispatch(resetAndRefetch()),
    [dispatch],
  );

  const handleDismissError = useCallback(
    () => dispatch(clearError()),
    [dispatch],
  );

  // ── Derived display values ─────────────────────────────────────────────────
  const digitalTime = `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`;
  const showInitialLoader = loading && timezones.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFF3FF" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isLandscape && styles.scrollLandscape,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header bar ── */}
        <View style={styles.header}>
          <Text style={styles.appName}>Analog Clock</Text>
          {isOffline && (
            <View style={styles.offlinePill}>
              <Text style={styles.offlineLabel}>⚡ Offline mode</Text>
            </View>
          )}
        </View>

        {/* ── Clock + Info (side-by-side in landscape) ── */}
        <View style={[styles.clockRow, isLandscape && styles.clockRowLandscape]}>
          {/* Clock face */}
          <AnalogClock time={time} />

          {/* Info panel */}
          <View style={[styles.info, isLandscape && styles.infoLandscape]}>
            <Text style={styles.digital}>{digitalTime}</Text>

            <Text style={styles.zoneName} numberOfLines={2}>
              {selectedTimezone ? selectedTimezone.zoneName : 'Local Time'}
            </Text>

            {selectedTimezone && (
              <Text style={styles.countryName}>
                {selectedTimezone.countryName}
              </Text>
            )}

            {selectedTimezone && (
              <TouchableOpacity
                onPress={() => dispatch(selectTimezone(null as any))}
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnLabel}>Use local time</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Error banner ── */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorMsg}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity onPress={handleRecoverCache} style={styles.errorBtn}>
                <Text style={styles.errorBtnLabel}>Reset cache</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDismissError} style={styles.errorBtn}>
                <Text style={styles.errorBtnLabel}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Timezone selector ── */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorHeading}>Time Zone</Text>

          {showInitialLoader ? (
            <ActivityIndicator color="#6C63FF" size="small" style={styles.spinner} />
          ) : (
            <TimeZoneSelector
              timezones={timezones}
              selectedTimezone={selectedTimezone}
              onSelect={handleSelect}
              loading={showInitialLoader}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EFF3FF',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  scrollLandscape: {},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  offlinePill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offlineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },

  // Clock row
  clockRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clockRowLandscape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Info panel
  info: {
    alignItems: 'center',
    marginTop: 20,
  },
  infoLandscape: {
    alignItems: 'flex-start',
    marginTop: 0,
    marginLeft: 36,
    flex: 1,
  },
  digital: {
    fontSize: 40,
    fontWeight: '200',
    color: '#1A1A2E',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A6A',
    marginTop: 6,
    textAlign: 'center',
  },
  countryName: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },
  resetBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  resetBtnLabel: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
  },

  // Error banner
  errorBanner: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    padding: 14,
  },
  errorMsg: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  errorBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#991B1B',
  },
  errorBtnLabel: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },

  // Selector section
  selectorSection: {
    marginTop: 24,
  },
  selectorHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 24,
    marginBottom: 10,
  },
  spinner: {
    marginTop: 8,
  },
});

export default HomeScreen;
