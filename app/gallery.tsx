import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Pressable, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown, FadeIn, FadeInUp, Layout, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGallery } from '@/hooks/useGallery';
import { useThemeColor } from '@/hooks/use-theme-color';
import { PhotoDetailsModal } from '@/components/gallery/PhotoDetailsModal';
import { triggerHaptic } from '@/utils/haptics';
import type { Photo, PhotoDecision } from '@/types/gallery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = SCREEN_WIDTH / COLUMN_COUNT;

type StatusFilter = 'all' | 'keep' | 'delete' | 'pending';

export default function GalleryScreen() {
  const router = useRouter();
  const { state, markPhoto, undoLastDecision, loadMorePhotos } = useGallery();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [focusedPhoto, setFocusedPhoto] = useState<Photo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [columnCount, setColumnCount] = useState(3);

  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const itemSize = SCREEN_WIDTH / columnCount;

  // Filter photos based on status
  const filteredPhotos = useMemo(() => {
    return state.photos.filter(photo => {
      const decision = state.decisions.get(photo.id);
      if (statusFilter === 'all') return true;
      if (statusFilter === 'keep') return decision === 'keep';
      if (statusFilter === 'delete') return decision === 'delete';
      if (statusFilter === 'pending') return !decision;
      return true;
    });
  }, [state.photos, state.decisions, statusFilter]);

  const toggleSelection = useCallback((id: string) => {
    triggerHaptic('light');
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handlePhotoPress = useCallback((photo: Photo) => {
    if (isSelectionMode) {
      toggleSelection(photo.id);
    } else {
      setFocusedPhoto(photo);
      setIsModalVisible(true);
    }
  }, [isSelectionMode, toggleSelection]);

  const handleLongPress = useCallback((photo: Photo) => {
    if (!isSelectionMode) {
      triggerHaptic('medium');
      setIsSelectionMode(true);
      toggleSelection(photo.id);
    }
  }, [isSelectionMode, toggleSelection]);

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkAction = (decision: PhotoDecision) => {
    triggerHaptic('heavy');
    selectedIds.forEach(id => {
      markPhoto(id, decision);
    });
    cancelSelection();
  };

  const renderItem = ({ item, index }: { item: Photo; index: number }) => {
    const decision = state.decisions.get(item.id);
    const isSelected = selectedIds.has(item.id);

    // Calculate stagger delay (max 1000ms for first 50 items)
    const staggerDelay = Math.min(index * 15, 1000);

    return (
      <Animated.View
        entering={ZoomIn.delay(staggerDelay).duration(350).springify().damping(15).stiffness(100)}
        layout={Layout.springify().damping(15).stiffness(100)}
        style={[styles.itemContainer, { width: itemSize, height: itemSize }]}
      >
        <Pressable
          onPress={() => handlePhotoPress(item)}
          onLongPress={() => handleLongPress(item)}
          style={styles.cardPressable}
        >
          <View style={styles.cardWrapper}>
            <Image
              source={{ uri: item.uri }}
              style={styles.image}
              contentFit="cover"
              transition={500}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />

            {/* Gradient Overlay for Status Badges */}
            {decision && !isSelectionMode && (
              <View style={styles.gradientOverlay} />
            )}

            {/* Status Indicators */}
            {decision === 'keep' && !isSelectionMode && (
              <Animated.View
                entering={ZoomIn.duration(250).springify()}
                style={[styles.statusBadge, { backgroundColor: '#10b981' }]}
              >
                <Ionicons name="heart" size={14} color="#fff" />
              </Animated.View>
            )}
            {decision === 'delete' && !isSelectionMode && (
              <Animated.View
                entering={ZoomIn.duration(250).springify()}
                style={[styles.statusBadge, { backgroundColor: '#ef4444' }]}
              >
                <Ionicons name="trash" size={14} color="#fff" />
              </Animated.View>
            )}

            {/* Selection Overlay */}
            {isSelectionMode && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[styles.selectionOverlay, isSelected && styles.selectedOverlay]}
              >
                <View style={[styles.checkbox, isSelected && { backgroundColor: tintColor, borderColor: tintColor }]}>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#fff"
                    />
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: isSelectionMode ? `${selectedIds.size} Selected` : 'Library',
          headerRight: () => isSelectionMode ? (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <Pressable onPress={() => {
                if (selectedIds.size === filteredPhotos.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(filteredPhotos.map(p => p.id)));
                }
              }}>
                <ThemedText style={{ color: tintColor, fontWeight: '600' }}>
                  {selectedIds.size === filteredPhotos.length ? 'Deselect All' : 'Select All'}
                </ThemedText>
              </Pressable>
              <Pressable onPress={cancelSelection}>
                <ThemedText style={{ color: tintColor, fontWeight: '600' }}>Cancel</ThemedText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                setIsSelectionMode(true);
              }}
              style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons
                name="checkbox-outline"
                size={24}
                color={tintColor}
              />
            </Pressable>
          ),
          headerLeft: () => !isSelectionMode ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable
                onPress={() => router.back()}
                style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={textColor}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setColumnCount(prev => prev === 3 ? 4 : 3);
                }}
                style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons
                  name={columnCount === 3 ? "grid-outline" : "apps-outline"}
                  size={20}
                  color={textColor}
                />
              </Pressable>
            </View>
          ) : null,
        }} 
      />

      {/* Filter Tabs */}
      {!isSelectionMode && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.filterContainer}>
          {(['pending', 'keep', 'delete'] as StatusFilter[]).map(filter => (
            <Pressable
              key={filter}
              onPress={() => {
                triggerHaptic('light');
                setStatusFilter(filter);
              }}
              style={[
                styles.filterTab,
                statusFilter === filter && {
                  backgroundColor: tintColor,
                  borderColor: tintColor,
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                  transform: [{ scale: 1.02 }],
                }
              ]}
            >
              <ThemedText style={[
                styles.filterText,
                statusFilter === filter && { color: '#fff', opacity: 1 }
              ]}>
                {filter.toUpperCase()}
              </ThemedText>
            </Pressable>
          ))}
        </Animated.View>
      )}

      <FlashList
        key={columnCount} // Force re-render when column count changes
        data={filteredPhotos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={columnCount}
        estimatedItemSize={itemSize}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMorePhotos}
        onEndReachedThreshold={0.5}
      />

      {/* Floating Action Button - Only show when NOT in selection mode */}
      {!isSelectionMode && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          style={styles.fabContainer}
        >
          <Pressable
            style={[styles.fab, { backgroundColor: tintColor }]}
            onPress={() => {
              triggerHaptic('medium');
              router.back();
            }}
          >
            <Ionicons name="layers" size={28} color="#fff" />
          </Pressable>
        </Animated.View>
      )}

      {/* Bulk Action Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          style={[styles.bulkActionBar, { backgroundColor: surfaceColor }]}
        >
          <Pressable
            style={[styles.bulkButton, { backgroundColor: '#10b981' }]}
            onPress={() => handleBulkAction('keep')}
          >
            <Ionicons name="heart" size={26} color="#fff" />
            <ThemedText style={styles.bulkButtonText}>Keep</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.bulkButton, { backgroundColor: '#ef4444' }]}
            onPress={() => handleBulkAction('delete')}
          >
            <Ionicons name="trash" size={26} color="#fff" />
            <ThemedText style={styles.bulkButtonText}>Delete</ThemedText>
          </Pressable>
        </Animated.View>
      )}

      {/* Photo Details Modal */}
      <PhotoDetailsModal
        visible={isModalVisible}
        photo={focusedPhoto}
        analysis={focusedPhoto ? state.analyses.get(focusedPhoto.id) : undefined}
        onClose={() => setIsModalVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: 'transparent',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  itemContainer: {
    padding: 6,
  },
  cardPressable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    flex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 10,
  },
  selectedOverlay: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  bulkActionBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

