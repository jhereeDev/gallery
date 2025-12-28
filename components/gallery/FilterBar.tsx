import React from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FILTER_PRESETS, type FilterType } from '@/utils/filters';

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
}

export function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      {FILTER_PRESETS.map(filter => {
        const count = counts[filter.type];
        const isActive = activeFilter === filter.type;

        // Don't show filters with 0 count (except 'all')
        if (count === 0 && filter.type !== 'all') {
          return null;
        }

        return (
          <Pressable
            key={filter.type}
            style={[
              styles.filterChip,
              isActive && { backgroundColor: tintColor },
              !isActive && styles.filterChipInactive,
            ]}
            onPress={() => onFilterChange(filter.type)}
          >
            <ThemedText style={styles.icon}>{filter.icon}</ThemedText>
            <ThemedText
              style={[styles.label, isActive && styles.labelActive]}
            >
              {filter.label}
            </ThemedText>
            {count > 0 && (
              <ThemedText
                style={[styles.count, isActive && styles.countActive]}
              >
                {count}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipInactive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelActive: {
    color: '#fff',
  },
  count: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  countActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: '#fff',
  },
});
