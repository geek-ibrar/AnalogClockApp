import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TimeZone } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts a raw gmtOffset (seconds) into a display string: "UTC+5:30" */
const formatOffset = (gmtOffset: number): string => {
  const sign = gmtOffset >= 0 ? '+' : '-';
  const totalMinutes = Math.floor(Math.abs(gmtOffset) / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
};

// ─── List row height — required for getItemLayout optimisation ───────────────
const ITEM_HEIGHT = 66;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RowProps {
  item: TimeZone;
  isSelected: boolean;
  onPress: (tz: TimeZone) => void;
}

const TimezoneRow = memo<RowProps>(({ item, isSelected, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.row,
      isSelected && styles.rowSelected,
      pressed && styles.rowPressed,
    ]}
    onPress={() => onPress(item)}
    android_ripple={{ color: '#DDE5FF' }}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowZone} numberOfLines={1}>{item.zoneName}</Text>
      <Text style={styles.rowCountry} numberOfLines={1}>{item.countryName}</Text>
    </View>
    <Text style={styles.rowOffset}>{formatOffset(item.gmtOffset)}</Text>
  </Pressable>
));

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  timezones: TimeZone[];
  selectedTimezone: TimeZone | null;
  onSelect: (timezone: TimeZone) => void;
  loading?: boolean;
}

/**
 * Timezone picker — tap the button to open a full-screen searchable list.
 *
 * Performance notes:
 *  - Rows are memoized
 *  - FlatList uses getItemLayout (fixed-height rows) for O(1) scroll
 *  - Search filtering is memoized
 */
const TimeZoneSelector: React.FC<Props> = ({
  timezones,
  selectedTimezone,
  onSelect,
  loading = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return timezones;
    return timezones.filter(
      (tz) =>
        tz.zoneName.toLowerCase().includes(q) ||
        tz.countryName.toLowerCase().includes(q),
    );
  }, [timezones, query]);

  // ── Handlers ──
  const openModal = useCallback(() => setModalVisible(true), []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setQuery('');
  }, []);

  const handleSelect = useCallback(
    (tz: TimeZone) => {
      onSelect(tz);
      closeModal();
    },
    [onSelect, closeModal],
  );

  const renderItem = useCallback(
    ({ item }: { item: TimeZone }) => (
      <TimezoneRow
        item={item}
        isSelected={item.zoneName === selectedTimezone?.zoneName}
        onPress={handleSelect}
      />
    ),
    [selectedTimezone, handleSelect],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  // ── Trigger button label ──
  const buttonLabel = loading
    ? 'Loading timezones…'
    : selectedTimezone
    ? selectedTimezone.zoneName
    : 'Select Time Zone';

  return (
    <>
      {/* ── Trigger button ── */}
      <TouchableOpacity
        style={[styles.trigger, (loading || timezones.length === 0) && styles.triggerDisabled]}
        onPress={openModal}
        disabled={loading}
        activeOpacity={0.75}
      >
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {buttonLabel}
        </Text>
        {selectedTimezone && (
          <Text style={styles.triggerOffset}>
            {formatOffset(selectedTimezone.gmtOffset)}
          </Text>
        )}
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {/* ── Full-screen modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={[styles.modal, { paddingTop: insets.top }]}>

          {/* Header */}
          <SafeAreaView style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Time Zone</Text>
            <TouchableOpacity
              onPress={closeModal}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Search */}
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or country…"
              placeholderTextColor="#AAA"
              value={query}
              onChangeText={setQuery}
              autoFocus
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {/* Count badge */}
          <Text style={styles.count}>
            {filtered.length} timezone{filtered.length !== 1 ? 's' : ''}
          </Text>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.zoneName}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={25}
            maxToRenderPerBatch={25}
            windowSize={10}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          />
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  triggerDisabled: { opacity: 0.55 },
  triggerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  triggerOffset: {
    fontSize: 13,
    color: '#777',
    marginRight: 8,
  },
  chevron: {
    fontSize: 16,
    color: '#AAA',
  },
  // Modal shell
  modal: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  closeBtn: {
    fontSize: 18,
    color: '#888',
    fontWeight: '500',
  },
  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#1A1A2E',
  },
  count: {
    fontSize: 11,
    color: '#AAA',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  rowSelected: { backgroundColor: '#EEF2FF' },
  rowPressed: { backgroundColor: '#F5F5F5' },
  rowLeft: { flex: 1, marginRight: 8 },
  rowZone: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  rowCountry: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  rowOffset: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    fontVariant: ['tabular-nums'],
  },
});

export default memo(TimeZoneSelector);
