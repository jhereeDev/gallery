import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
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
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={[styles.outerContainer, { backgroundColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {FILTER_PRESETS.map(filter => {
          const count = counts[filter.type];
          const isActive = activeFilter === filter.type;

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
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function FilterChip({ 
  filter, 
  count, 
  isActive, 
  onPress,
}: { 
  filter: any; 
  count: number; 
  isActive: boolean; 
  onPress: () => void;
}) {
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textColor = useThemeColor({}, 'text');
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

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.filterChip,
          { backgroundColor: isActive ? tintColor : surfaceColor },
          isActive && styles.activeShadow,
        ]}
      >
        <ThemedText style={[styles.icon, { color: isActive ? '#fff' : textColor }]}>
          {filter.icon}
        </ThemedText>
        <ThemedText
          style={[styles.label, { color: isActive ? '#fff' : textColor }]}
        >
          {filter.label}
        </ThemedText>
        {count > 0 && (
          <View style={[styles.countContainer, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }]}>
            <ThemedText style={[styles.count, { color: isActive ? '#fff' : textSecondary }]}>
              {count}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingVertical: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  activeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  countContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 11,
    fontWeight: '800',
  },
});
