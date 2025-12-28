import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import type { GalleryState, GalleryAction, Photo, PhotoDecision } from '@/types/gallery';
import { PHOTO_BATCH_SIZE } from '@/constants/config';
import { storage } from '@/utils/storage';
import { initializeAchievements, checkAchievements } from '@/utils/achievements';
import { analyzePhotoBatch } from '@/utils/photoAnalysis';

// Initial state
const initialState: GalleryState = {
  photos: [],
  currentIndex: 0,
  stats: {
    totalPhotos: 0,
    processed: 0,
    toDelete: 0,
    toKeep: 0,
    storageToFree: 0,
    currentStreak: 0,
    totalSessions: 0,
    lifetimeDeleted: 0,
    lifetimeFreed: 0,
  },
  decisions: new Map(),
  isLoading: false,
  hasMorePhotos: true,
  permissionStatus: 'undetermined',
  photoCursor: null,
  undoHistory: [],
  currentSession: null,
  lastResumePhotoId: null,
  analyses: new Map(),
  achievements: [],
  unlockedAchievements: [],
};

// Reducer function
function galleryReducer(state: GalleryState, action: GalleryAction): GalleryState {
  switch (action.type) {
    case 'LOAD_PHOTOS_SUCCESS': {
      const newPhotos: Photo[] = action.photos.map((asset: any) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        fileSize: asset.fileSize || 0,
        mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
        duration: asset.duration || undefined,
      }));

      return {
        ...state,
        photos: newPhotos,
        photoCursor: action.cursor,
        hasMorePhotos: action.hasMore,
        stats: {
          ...state.stats,
          totalPhotos: newPhotos.length,
        },
        isLoading: false,
      };
    }

    case 'LOAD_MORE_PHOTOS': {
      const morePhotos: Photo[] = action.photos.map((asset: any) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        fileSize: asset.fileSize || 0,
        mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
        duration: asset.duration || undefined,
      }));

      const allPhotos = [...state.photos, ...morePhotos];

      return {
        ...state,
        photos: allPhotos,
        photoCursor: action.cursor,
        hasMorePhotos: action.hasMore,
        stats: {
          ...state.stats,
          totalPhotos: allPhotos.length,
        },
        isLoading: false,
      };
    }

    case 'MARK_DELETE': {
      const newDecisions = new Map(state.decisions);
      const wasKeep = newDecisions.get(action.photoId) === 'keep';
      newDecisions.set(action.photoId, 'delete');

      // Add to undo history
      const updatedHistory = [
        ...state.undoHistory,
        { photoId: action.photoId, decision: 'delete' as PhotoDecision, timestamp: Date.now() },
      ];

      // Check if we need to auto-delete (keep only last 5 in history)
      let photosToAutoDelete: string[] = [];
      let newUndoHistory = updatedHistory;

      if (updatedHistory.length > 5) {
        // Get oldest decisions that should be deleted
        const toRemove = updatedHistory.slice(0, updatedHistory.length - 5);
        photosToAutoDelete = toRemove
          .filter(item => item.decision === 'delete')
          .map(item => item.photoId);

        // Keep only last 5
        newUndoHistory = updatedHistory.slice(-5);
      }

      // Calculate storage to free
      const photo = state.photos.find(p => p.id === action.photoId);
      const storageToFree = state.stats.storageToFree + (photo?.fileSize || 0);

      // Update current session
      const updatedSession = state.currentSession
        ? {
            ...state.currentSession,
            photosReviewed: state.currentSession.photosReviewed + 1,
            photosDeleted: state.currentSession.photosDeleted + 1,
          }
        : null;

      // Execute auto-deletion if needed
      if (photosToAutoDelete.length > 0) {
        // Delete photos asynchronously
        MediaLibrary.deleteAssetsAsync(photosToAutoDelete).catch(err =>
          console.error('Auto-delete failed:', err)
        );

        // Remove deleted photos from state
        const remainingPhotos = state.photos.filter(p => !photosToAutoDelete.includes(p.id));
        const deletedPhotos = state.photos.filter(p => photosToAutoDelete.includes(p.id));
        const storageFreed = deletedPhotos.reduce((sum, p) => sum + (p.fileSize || 0), 0);

        // Remove from decisions
        photosToAutoDelete.forEach(id => newDecisions.delete(id));

        return {
          ...state,
          photos: remainingPhotos,
          decisions: newDecisions,
          currentIndex: state.currentIndex + 1,
          undoHistory: newUndoHistory,
          currentSession: updatedSession,
          stats: {
            ...state.stats,
            totalPhotos: remainingPhotos.length,
            processed: newDecisions.size,
            toDelete: Array.from(newDecisions.values()).filter(d => d === 'delete').length,
            toKeep: wasKeep ? state.stats.toKeep - 1 : state.stats.toKeep,
            storageToFree,
            lifetimeDeleted: state.stats.lifetimeDeleted + photosToAutoDelete.length,
            lifetimeFreed: state.stats.lifetimeFreed + storageFreed,
          },
        };
      }

      return {
        ...state,
        decisions: newDecisions,
        currentIndex: state.currentIndex + 1,
        undoHistory: newUndoHistory,
        currentSession: updatedSession,
        stats: {
          ...state.stats,
          processed: newDecisions.size,
          toDelete: Array.from(newDecisions.values()).filter(d => d === 'delete').length,
          toKeep: wasKeep
            ? state.stats.toKeep - 1
            : state.stats.toKeep,
          storageToFree,
        },
      };
    }

    case 'MARK_KEEP': {
      const newDecisions = new Map(state.decisions);
      const wasDelete = newDecisions.get(action.photoId) === 'delete';
      newDecisions.set(action.photoId, 'keep');

      // Add to undo history
      const updatedHistory = [
        ...state.undoHistory,
        { photoId: action.photoId, decision: 'keep' as PhotoDecision, timestamp: Date.now() },
      ];

      // Check if we need to auto-delete (keep only last 5 in history)
      let photosToAutoDelete: string[] = [];
      let newUndoHistory = updatedHistory;

      if (updatedHistory.length > 5) {
        // Get oldest decisions that should be deleted
        const toRemove = updatedHistory.slice(0, updatedHistory.length - 5);
        photosToAutoDelete = toRemove
          .filter(item => item.decision === 'delete')
          .map(item => item.photoId);

        // Keep only last 5
        newUndoHistory = updatedHistory.slice(-5);
      }

      // Adjust storage to free if was previously marked for deletion
      const photo = state.photos.find(p => p.id === action.photoId);
      const storageToFree = wasDelete
        ? state.stats.storageToFree - (photo?.fileSize || 0)
        : state.stats.storageToFree;

      // Update current session
      const updatedSession = state.currentSession
        ? {
            ...state.currentSession,
            photosReviewed: state.currentSession.photosReviewed + 1,
            photosKept: state.currentSession.photosKept + 1,
          }
        : null;

      // Execute auto-deletion if needed
      if (photosToAutoDelete.length > 0) {
        // Delete photos asynchronously
        MediaLibrary.deleteAssetsAsync(photosToAutoDelete).catch(err =>
          console.error('Auto-delete failed:', err)
        );

        // Remove deleted photos from state
        const remainingPhotos = state.photos.filter(p => !photosToAutoDelete.includes(p.id));
        const deletedPhotos = state.photos.filter(p => photosToAutoDelete.includes(p.id));
        const storageFreedFromDeletion = deletedPhotos.reduce((sum, p) => sum + (p.fileSize || 0), 0);

        // Remove from decisions
        photosToAutoDelete.forEach(id => newDecisions.delete(id));

        return {
          ...state,
          photos: remainingPhotos,
          decisions: newDecisions,
          currentIndex: state.currentIndex + 1,
          undoHistory: newUndoHistory,
          currentSession: updatedSession,
          stats: {
            ...state.stats,
            totalPhotos: remainingPhotos.length,
            processed: newDecisions.size,
            toKeep: Array.from(newDecisions.values()).filter(d => d === 'keep').length,
            toDelete: wasDelete ? state.stats.toDelete - 1 : state.stats.toDelete,
            storageToFree,
            lifetimeDeleted: state.stats.lifetimeDeleted + photosToAutoDelete.length,
            lifetimeFreed: state.stats.lifetimeFreed + storageFreedFromDeletion,
          },
        };
      }

      return {
        ...state,
        decisions: newDecisions,
        currentIndex: state.currentIndex + 1,
        undoHistory: newUndoHistory,
        currentSession: updatedSession,
        stats: {
          ...state.stats,
          processed: newDecisions.size,
          toKeep: Array.from(newDecisions.values()).filter(d => d === 'keep').length,
          toDelete: wasDelete
            ? state.stats.toDelete - 1
            : state.stats.toDelete,
          storageToFree,
        },
      };
    }

    case 'UNDO_DECISION': {
      const newDecisions = new Map(state.decisions);
      const decision = newDecisions.get(action.photoId);
      newDecisions.delete(action.photoId);

      return {
        ...state,
        decisions: newDecisions,
        stats: {
          ...state.stats,
          processed: newDecisions.size,
          toDelete: decision === 'delete'
            ? state.stats.toDelete - 1
            : state.stats.toDelete,
          toKeep: decision === 'keep'
            ? state.stats.toKeep - 1
            : state.stats.toKeep,
        },
      };
    }

    case 'EXECUTE_DELETIONS_SUCCESS': {
      const remainingPhotos = state.photos.filter(
        photo => !action.deletedIds.includes(photo.id)
      );

      const newDecisions = new Map(state.decisions);
      action.deletedIds.forEach(id => newDecisions.delete(id));

      // Calculate storage freed
      const deletedPhotos = state.photos.filter(p => action.deletedIds.includes(p.id));
      const storageFreed = deletedPhotos.reduce((sum, p) => sum + (p.fileSize || 0), 0);

      return {
        ...state,
        photos: remainingPhotos,
        decisions: newDecisions,
        currentIndex: 0,
        undoHistory: [], // Clear undo history after deletion
        stats: {
          ...state.stats,
          totalPhotos: remainingPhotos.length,
          processed: 0,
          toDelete: 0,
          toKeep: 0,
          storageToFree: 0,
          lifetimeDeleted: state.stats.lifetimeDeleted + action.deletedIds.length,
          lifetimeFreed: state.stats.lifetimeFreed + storageFreed,
        },
      };
    }

    case 'SET_PERMISSION_STATUS':
      return {
        ...state,
        permissionStatus: action.status,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_CURRENT_INDEX':
      return {
        ...state,
        currentIndex: action.index,
      };

    case 'RESET_SESSION':
      return {
        ...initialState,
        permissionStatus: state.permissionStatus,
      };

    case 'UNDO_LAST_DECISION': {
      if (state.undoHistory.length === 0) return state;

      const lastDecision = state.undoHistory[state.undoHistory.length - 1];
      const newDecisions = new Map(state.decisions);
      const photo = state.photos.find(p => p.id === lastDecision.photoId);

      newDecisions.delete(lastDecision.photoId);

      // Adjust storage calculation
      const storageAdjustment = lastDecision.decision === 'delete' ? -(photo?.fileSize || 0) : 0;

      return {
        ...state,
        decisions: newDecisions,
        currentIndex: Math.max(0, state.currentIndex - 1),
        undoHistory: state.undoHistory.slice(0, -1),
        stats: {
          ...state.stats,
          processed: newDecisions.size,
          toDelete: Array.from(newDecisions.values()).filter(d => d === 'delete').length,
          toKeep: Array.from(newDecisions.values()).filter(d => d === 'keep').length,
          storageToFree: state.stats.storageToFree + storageAdjustment,
        },
      };
    }

    case 'CLEAR_UNDO_HISTORY':
      return {
        ...state,
        undoHistory: [],
      };

    case 'START_SESSION': {
      const newSession = {
        sessionId: `session_${Date.now()}`,
        startTime: Date.now(),
        photosReviewed: 0,
        photosDeleted: 0,
        photosKept: 0,
        storageFreed: 0,
      };

      return {
        ...state,
        currentSession: newSession,
      };
    }

    case 'END_SESSION':
      return {
        ...state,
        currentSession: null,
        stats: {
          ...state.stats,
          totalSessions: state.stats.totalSessions + 1,
        },
      };

    case 'SET_RESUME_PHOTO':
      return {
        ...state,
        lastResumePhotoId: action.photoId,
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.stats,
        },
      };

    case 'SET_PHOTO_ANALYSIS':
      return {
        ...state,
        analyses: new Map(state.analyses).set(action.photoId, action.analysis),
      };

    case 'BATCH_SET_ANALYSES': {
      const newAnalyses = new Map(state.analyses);
      action.analyses.forEach((analysis, photoId) => {
        newAnalyses.set(photoId, analysis);
      });
      return {
        ...state,
        analyses: newAnalyses,
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const achievement = state.achievements.find(a => a.id === action.achievementId);
      if (!achievement || state.unlockedAchievements.includes(action.achievementId)) {
        return state;
      }

      return {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, action.achievementId],
        achievements: state.achievements.map(a =>
          a.id === action.achievementId
            ? { ...a, unlockedAt: Date.now() }
            : a
        ),
      };
    }

    default:
      return state;
  }
}

// Context type
interface GalleryContextType {
  state: GalleryState;
  dispatch: React.Dispatch<GalleryAction>;
  loadPhotos: () => Promise<void>;
  loadMorePhotos: () => Promise<void>;
  markPhoto: (photoId: string, decision: PhotoDecision) => void;
  undoDecision: (photoId: string) => void;
  undoLastDecision: () => void;
  executeDeleteions: (photoIds: string[]) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  startSession: () => void;
  endSession: () => Promise<void>;
  loadPersistedData: () => Promise<void>;
  checkAndUpdateAchievements: () => string[];
  analyzePhotos: () => Promise<void>;
}

// Create context
export const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

// Provider component
interface GalleryProviderProps {
  children: ReactNode;
}

// Helper function to get file size
const getFileSize = async (uri: string): Promise<number> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && 'size' in info ? (info.size || 0) : 0;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

export function GalleryProvider({ children }: GalleryProviderProps) {
  const [state, dispatch] = useReducer(galleryReducer, initialState);

  // Load initial photos
  const loadPhotos = async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });

      const { assets, endCursor, hasNextPage } = await MediaLibrary.getAssetsAsync({
        first: PHOTO_BATCH_SIZE,
        mediaType: 'photo',
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      // Fetch file sizes for each photo
      const photosWithSizes = await Promise.all(
        assets.map(async (asset) => {
          const fileSize = await getFileSize(asset.uri);
          return {
            ...asset,
            fileSize,
          };
        })
      );

      dispatch({
        type: 'LOAD_PHOTOS_SUCCESS',
        photos: photosWithSizes as any,
        cursor: endCursor,
        hasMore: hasNextPage,
      });
    } catch (error) {
      console.error('Error loading photos:', error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  // Load more photos
  const loadMorePhotos = async () => {
    if (!state.hasMorePhotos || state.isLoading || !state.photoCursor) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });

      const { assets, endCursor, hasNextPage } = await MediaLibrary.getAssetsAsync({
        first: PHOTO_BATCH_SIZE,
        after: state.photoCursor,
        mediaType: 'photo',
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      // Fetch file sizes for each photo
      const photosWithSizes = await Promise.all(
        assets.map(async (asset) => {
          const fileSize = await getFileSize(asset.uri);
          return {
            ...asset,
            fileSize,
          };
        })
      );

      dispatch({
        type: 'LOAD_MORE_PHOTOS',
        photos: photosWithSizes as any,
        cursor: endCursor,
        hasMore: hasNextPage,
      });
    } catch (error) {
      console.error('Error loading more photos:', error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  // Mark photo for deletion or keeping
  const markPhoto = (photoId: string, decision: PhotoDecision) => {
    if (decision === 'delete') {
      dispatch({ type: 'MARK_DELETE', photoId });
    } else {
      dispatch({ type: 'MARK_KEEP', photoId });
    }
  };

  // Undo a decision
  const undoDecision = (photoId: string) => {
    dispatch({ type: 'UNDO_DECISION', photoId });
  };

  // Execute deletions
  const executeDeleteions = async (photoIds: string[]) => {
    try {
      await MediaLibrary.deleteAssetsAsync(photoIds);
      dispatch({ type: 'EXECUTE_DELETIONS_SUCCESS', deletedIds: photoIds });
    } catch (error) {
      console.error('Error deleting photos:', error);
      throw error;
    }
  };

  // Request permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted';

      dispatch({
        type: 'SET_PERMISSION_STATUS',
        status: granted ? 'granted' : 'denied',
      });

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      dispatch({ type: 'SET_PERMISSION_STATUS', status: 'denied' });
      return false;
    }
  };

  // Undo last decision from history
  const undoLastDecision = () => {
    dispatch({ type: 'UNDO_LAST_DECISION' });
  };

  // Start a new session
  const startSession = () => {
    dispatch({ type: 'START_SESSION' });
  };

  // End current session and save to storage
  const endSession = async () => {
    if (state.currentSession) {
      const sessionStats = {
        ...state.currentSession,
        endTime: Date.now(),
        photosReviewed: state.stats.processed,
        photosDeleted: state.stats.toDelete,
        photosKept: state.stats.toKeep,
        storageFreed: state.stats.storageToFree,
      };

      await storage.addSession(sessionStats);
      const newStreak = await storage.updateStreak();

      dispatch({ type: 'END_SESSION', stats: sessionStats });
      dispatch({ type: 'UPDATE_STATS', stats: { currentStreak: newStreak } });
    }
  };

  // Load persisted data on mount
  const loadPersistedData = async () => {
    try {
      const [persistedStats, persistedAchievements, lastPhotoId, streak] = await Promise.all([
        storage.getStats(),
        storage.getAchievements(),
        storage.getLastPhotoId(),
        storage.getCurrentStreak(),
      ]);

      if (persistedStats) {
        dispatch({ type: 'UPDATE_STATS', stats: { ...persistedStats, currentStreak: streak } });
      } else {
        dispatch({ type: 'UPDATE_STATS', stats: { currentStreak: streak } });
      }

      if (lastPhotoId) {
        dispatch({ type: 'SET_RESUME_PHOTO', photoId: lastPhotoId });
      }

      // Initialize or load achievements
      const achievementsToUse = persistedAchievements && persistedAchievements.length > 0
        ? persistedAchievements
        : initializeAchievements();

      // Set each achievement
      achievementsToUse.forEach(achievement => {
        dispatch({
          type: 'SET_PHOTO_ANALYSIS',
          photoId: achievement.id,
          analysis: {} as any, // Placeholder, will be replaced
        });
      });

      // Update state with achievements
      dispatch({
        type: 'UPDATE_STATS',
        stats: state.stats,
      });
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  // Check and update achievements
  const checkAndUpdateAchievements = () => {
    const { achievements: updatedAchievements, newlyUnlocked } = checkAchievements(
      state.achievements,
      state.stats,
      state.currentSession
    );

    // Update achievements in state
    updatedAchievements.forEach(achievement => {
      dispatch({
        type: 'SET_PHOTO_ANALYSIS',
        photoId: achievement.id,
        analysis: {} as any,
      });
    });

    // Save to storage
    storage.saveAchievements(updatedAchievements);

    // Unlock newly unlocked achievements
    newlyUnlocked.forEach(id => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievementId: id });
    });

    return newlyUnlocked;
  };

  // Analyze photos in background
  const analyzePhotos = async () => {
    if (state.photos.length === 0) return;

    try {
      // Analyze in batches of 10 to avoid blocking UI
      const batchSize = 10;
      for (let i = 0; i < state.photos.length; i += batchSize) {
        const batch = state.photos.slice(i, i + batchSize);

        // Analyze batch
        const analyses = await analyzePhotoBatch(batch, state.photos);

        // Update state with analyses
        dispatch({ type: 'BATCH_SET_ANALYSES', analyses });

        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error analyzing photos:', error);
    }
  };

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    storage.saveStats(state.stats);
  }, [state.stats]);

  const value: GalleryContextType = {
    state,
    dispatch,
    loadPhotos,
    loadMorePhotos,
    markPhoto,
    undoDecision,
    undoLastDecision,
    executeDeleteions,
    requestPermissions,
    startSession,
    endSession,
    loadPersistedData,
    checkAndUpdateAchievements,
    analyzePhotos,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
}
