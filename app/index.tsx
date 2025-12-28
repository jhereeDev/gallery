import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { useGallery } from '@/hooks/useGallery';
import { usePermissions } from '@/hooks/usePermissions';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SwipeCard } from '@/components/gallery/SwipeCard';
import { ProgressHeader } from '@/components/gallery/ProgressHeader';
import { ActionButtons } from '@/components/gallery/ActionButtons';
import { PhotoStack } from '@/components/gallery/PhotoStack';
import { AchievementToast } from '@/components/gallery/AchievementToast';
import { FilterBar } from '@/components/gallery/FilterBar';
import { EmptyState } from '@/components/gallery/EmptyStates';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PhotoDetailsModal } from '@/components/gallery/PhotoDetailsModal';
import { QuickActionsMenu } from '@/components/gallery/QuickActionsMenu';
import { LoadingSkeleton } from '@/components/gallery/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PRELOAD_THRESHOLD } from '@/constants/config';
import { storage } from '@/utils/storage';
import { applyFilter, getFilterCounts, type FilterType } from '@/utils/filters';
import type { Achievement } from '@/types/gallery';

import Animated, { useSharedValue } from 'react-native-reanimated';
import { SPRING_CONFIG } from '@/utils/animations';

export default function SwiperScreen() {
  const router = useRouter();
  const { state, dispatch, loadPhotos, loadMorePhotos, markPhoto, undoLastDecision, startSession, endSession, checkAndUpdateAchievements, analyzePhotos } = useGallery();
  const { status: permissionStatus, requestPermissions } = usePermissions();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filteredIndex, setFilteredIndex] = useState(0);
  const [photoDetailsVisible, setPhotoDetailsVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const background = useThemeColor({}, 'background');

  // Shared values for reactive UI
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Load photos on mount when permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted' && state.photos.length === 0) {
      loadPhotos();
    }
  }, [permissionStatus]);

  // Start session when photos are loaded
  useEffect(() => {
    if (state.photos.length > 0 && !state.currentSession) {
      startSession();
    }
  }, [state.photos.length]);

  // Trigger photo analysis after photos are loaded
  useEffect(() => {
    if (state.photos.length > 0 && state.analyses.size === 0) {
      analyzePhotos();
    }
  }, [state.photos.length]);

  // Save current photo ID to storage whenever filtered index changes
  useEffect(() => {
    if (filteredPhotos && filteredPhotos[filteredIndex]) {
      const currentPhoto = filteredPhotos[filteredIndex];
      storage.saveLastPhotoId(currentPhoto.id);
    }
  }, [filteredIndex, filteredPhotos]);

  // Resume from last photo when photos are first loaded (only for 'all' filter)
  useEffect(() => {
    if (
      activeFilter === 'all' &&
      filteredPhotos &&
      filteredPhotos.length > 0 &&
      state.lastResumePhotoId &&
      filteredIndex === 0 &&
      state.decisions.size === 0
    ) {
      const resumeIndex = filteredPhotos.findIndex(p => p.id === state.lastResumePhotoId);
      if (resumeIndex >= 0) {
        // Resume from the next photo after the saved one
        const targetIndex = Math.min(resumeIndex + 1, filteredPhotos.length - 1);
        setFilteredIndex(targetIndex);
        console.log(`Auto-resumed to photo index ${targetIndex}`);
      }
    }
  }, [filteredPhotos, state.lastResumePhotoId, activeFilter, filteredIndex]);

  // Preload more photos when approaching the end (only for 'all' filter)
  useEffect(() => {
    if (activeFilter !== 'all') return;

    const shouldLoadMore =
      state.photos.length > 0 &&
      state.currentIndex >= state.photos.length - PRELOAD_THRESHOLD &&
      state.hasMorePhotos &&
      !state.isLoading;

    if (shouldLoadMore) {
      loadMorePhotos();
    }
  }, [filteredIndex, state.photos.length, activeFilter]);

  // Calculate smart suggestions (photos recommended for deletion)
  const smartSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    state.photos.forEach(photo => {
      const analysis = state.analyses.get(photo.id);
      if (!analysis) return;

      // Suggest if screenshot, blurry, or old
      if (analysis.isScreenshot || analysis.isBlurry || analysis.ageInDays > 730) {
        suggestions.push(photo.id);
      }
    });
    return suggestions;
  }, [state.photos, state.analyses]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    return getFilterCounts(state.photos, state.analyses, smartSuggestions);
  }, [state.photos, state.analyses, smartSuggestions]);

  // Apply active filter and exclude already-decided photos
  const filteredPhotos = useMemo(() => {
    if (!state.photos || state.photos.length === 0) {
      return [];
    }
    const filtered = applyFilter(state.photos, activeFilter, state.analyses, smartSuggestions);
    // Exclude photos that already have a decision (keep or delete)
    return filtered.filter(photo => !state.decisions.has(photo.id));
  }, [state.photos, activeFilter, state.analyses, smartSuggestions, state.decisions]);

  // Reset filtered index when filter changes
  useEffect(() => {
    setFilteredIndex(0);
  }, [activeFilter]);

  // Reset filtered index when filtered photos change significantly
  useEffect(() => {
    if (!filteredPhotos || filteredPhotos.length === 0) {
      setFilteredIndex(0);
      return;
    }
    // Clamp index to valid range (only check, don't set if already valid to avoid loops)
    setFilteredIndex(prevIndex => {
      if (prevIndex >= filteredPhotos.length) {
        return Math.max(0, filteredPhotos.length - 1);
      }
      return prevIndex;
    });
  }, [filteredPhotos]);

  // Reset shared values when photo changes
  useEffect(() => {
    if (filteredPhotos && filteredPhotos[filteredIndex]) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [filteredPhotos, filteredIndex]);

  const handleSwipeLeft = () => {
    if (!filteredPhotos || filteredPhotos.length === 0) return;
    const currentPhoto = filteredPhotos[filteredIndex];
    if (currentPhoto) {
      markPhoto(currentPhoto.id, 'keep');
      checkAchievements();
      // Move to next photo in filtered array
      if (filteredIndex < filteredPhotos.length - 1) {
        setFilteredIndex(filteredIndex + 1);
      }
    }
  };

  const handleSwipeRight = () => {
    if (!filteredPhotos || filteredPhotos.length === 0) return;
    const currentPhoto = filteredPhotos[filteredIndex];
    if (currentPhoto) {
      markPhoto(currentPhoto.id, 'delete');
      checkAchievements();
      // Move to next photo in filtered array
      if (filteredIndex < filteredPhotos.length - 1) {
        setFilteredIndex(filteredIndex + 1);
      }
    }
  };

  const handleUndo = () => {
    if (state.undoHistory.length === 0) return;
    
    const lastDecision = state.undoHistory[state.undoHistory.length - 1];
    const undonePhotoId = lastDecision.photoId;
    
    // Find the index of the undone photo in the filtered array
    const photoIndex = filteredPhotos.findIndex(p => p.id === undonePhotoId);
    
    if (photoIndex >= 0) {
      // Navigate back to the undone photo
      setFilteredIndex(photoIndex);
    } else if (filteredPhotos.length > 0) {
      // If photo not found in filtered array (maybe filtered out), go to previous index
      setFilteredIndex(Math.max(0, filteredIndex - 1));
    }
    
    // Call the actual undo function
    undoLastDecision();
  };

  const checkAchievements = () => {
    const newlyUnlocked = checkAndUpdateAchievements();
    if (newlyUnlocked.length > 0) {
      const achievementId = newlyUnlocked[0];
      const achievement = state.achievements.find(a => a.id === achievementId);
      if (achievement) {
        setCurrentAchievement(achievement);
      }
    }
  };

  const handleGrantPermission = async () => {
    const granted = await requestPermissions();
    if (granted) {
      loadPhotos();
    }
  };

  const handleFavorite = () => {
    if (!currentPhoto) return;
    const newFavorites = new Set(favorites);
    if (newFavorites.has(currentPhoto.id)) {
      newFavorites.delete(currentPhoto.id);
    } else {
      newFavorites.add(currentPhoto.id);
    }
    setFavorites(newFavorites);
    storage.saveFavorites(Array.from(newFavorites));
  };

  const handleLongPress = () => {
    setQuickActionsVisible(true);
  };

  const handleTap = () => {
    setPhotoDetailsVisible(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  // Load favorites from storage
  useEffect(() => {
    storage.getFavorites().then(savedFavorites => {
      if (savedFavorites) {
        setFavorites(new Set(savedFavorites));
      }
    });
  }, []);

  // Permission not granted
  if (permissionStatus === 'denied' || permissionStatus === 'undetermined') {
    return (
      <EmptyState type="permissionDenied" onRequestPermission={handleGrantPermission} />
    );
  }

  // Loading initial photos
  if (state.isLoading && state.photos.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={styles.content}>
          <View style={styles.cardContainer}>
            <LoadingSkeleton />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // No photos found
  if (state.photos.length === 0 && !state.isLoading) {
    return <EmptyState type="noPhotos" />;
  }

  // No photos match the filter
  if (!filteredPhotos || (filteredPhotos.length === 0 && !state.isLoading && state.photos.length > 0)) {
    return <EmptyState type="noFilterResults" />;
  }

  if (filteredIndex >= filteredPhotos.length) {
    return <EmptyState type="allProcessed" />;
  }

  const currentPhoto = filteredPhotos[filteredIndex];

  if (!currentPhoto) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={styles.content}>
          <View style={styles.cardContainer}>
            <LoadingSkeleton />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const quickActions = [
    {
      icon: 'heart' as const,
      label: favorites.has(currentPhoto.id) ? 'Remove from Favorites' : 'Add to Favorites',
      onPress: handleFavorite,
      color: '#fbbf24',
    },
    {
      icon: 'eye' as const,
      label: 'View Details',
      onPress: () => {
        setPhotoDetailsVisible(true);
        setQuickActionsVisible(false);
      },
    },
    {
      icon: 'checkmark-circle' as const,
      label: 'Keep',
      onPress: handleSwipeLeft,
      color: '#10b981',
    },
    {
      icon: 'trash' as const,
      label: 'Delete',
      onPress: handleSwipeRight,
      destructive: true,
    },
  ];

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          alwaysBounceVertical={true}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={background} />
          }
        >
          <ThemedView style={styles.content}>
            {/* Background Blurred Image for Depth */}
            {currentPhoto && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Image
                  source={{ uri: currentPhoto.uri }}
                  style={styles.backgroundImage}
                  contentFit="cover"
                  blurRadius={50}
                />
                <View style={[styles.backgroundOverlay, { backgroundColor: background }]} />
              </View>
            )}

            {/* Achievement Toast */}
            {currentAchievement && (
              <AchievementToast
                achievement={currentAchievement}
                onDismiss={() => setCurrentAchievement(null)}
              />
            )}

            {/* Progress Header */}
            <ProgressHeader 
              stats={state.stats} 
              onGalleryPress={() => router.push('/gallery')}
            />

            {/* Filter Bar */}
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={filterCounts}
            />

            {/* Swipe Card */}
            <View style={styles.cardContainer}>
              {/* Photo Stack (cards behind current) */}
              {filteredPhotos && (
                <PhotoStack 
                  photos={filteredPhotos} 
                  currentIndex={filteredIndex} 
                  translateX={translateX}
                />
              )}

              {/* Current Card */}
              {currentPhoto && (
                <SwipeCard
                  photo={currentPhoto}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onFavorite={handleFavorite}
                  onLongPress={handleLongPress}
                  onTap={handleTap}
                  isFavorite={favorites.has(currentPhoto.id)}
                  isSuggested={smartSuggestions.includes(currentPhoto.id)}
                  translateX={translateX}
                  translateY={translateY}
                  analysis={state.analyses.get(currentPhoto.id)}
                  existingDecision={state.decisions.get(currentPhoto.id)}
                />
              )}
            </View>

        {/* Action Buttons with integrated Undo */}
        <ActionButtons
          onKeep={handleSwipeLeft}
          onDelete={handleSwipeRight}
          onUndo={handleUndo}
          canUndo={state.undoHistory.length > 0}
          disabled={!currentPhoto}
        />
          </ThemedView>
        </ScrollView>

        {/* Photo Details Modal */}
        <PhotoDetailsModal
          visible={photoDetailsVisible}
          photo={currentPhoto}
          analysis={state.analyses.get(currentPhoto.id)}
          onClose={() => setPhotoDetailsVisible(false)}
        />

        {/* Quick Actions Menu */}
        <QuickActionsMenu
          visible={quickActionsVisible}
          actions={quickActions}
          onClose={() => setQuickActionsVisible(false)}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    minHeight: 400,
  },
});
