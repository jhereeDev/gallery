import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FILTER_PRESETS, type FilterType } from '@/utils/filters';
import { triggerHaptic } from '@/utils/haptics';
import { SPRING_CONFIG } from '@/utils/animations';

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
          <FilterChip
            key={filter.type}
            filter={filter}
            count={count}
            isActive={isActive}
            onPress={() => {
              triggerHaptic('light');
              onFilterChange(filter.type);
            }}
            activeColor={tintColor}
          />
        );
      })}
    </ScrollView>
  );
}

function FilterChip({ 
  filter, 
  count, 
  isActive, 
  onPress,
  activeColor
}: { 
  filter: any; 
  count: number; 
  isActive: boolean; 
  onPress: () => void;
  activeColor: string;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.1, SPRING_CONFIG),
        withSpring(1, SPRING_CONFIG)
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.filterChip,
          isActive && { backgroundColor: activeColor },
          !isActive && styles.filterChipInactive,
        ]}
      >
        <ThemedText style={styles.icon}>{filter.icon}</ThemedText>
        <ThemedText
          style={[styles.label, isActive && styles.labelActive]}
        >
          {filter.label}
        </ThemedText>
        {count > 0 && (
          <View style={[styles.countContainer, isActive && styles.countActiveContainer]}>
            <ThemedText style={[styles.count, isActive && styles.countActive]}>
              {count}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipInactive: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
  countContainer: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActiveContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  count: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  countActive: {
    color: '#fff',
  },
});
