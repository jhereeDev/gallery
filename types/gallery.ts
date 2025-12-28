export interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  // Phase 1: Extended metadata
  fileSize?: number;
  mediaType?: 'photo' | 'video';
  duration?: number;
}

export interface GalleryStats {
  totalPhotos: number;
  processed: number;
  toDelete: number;
  toKeep: number;
  // Phase 1: Extended stats
  storageToFree: number;    // bytes
  currentStreak: number;     // days
  totalSessions: number;
  lifetimeDeleted: number;
  lifetimeFreed: number;     // bytes
}

export type PhotoDecision = 'delete' | 'keep';

// Phase 1: Photo analysis result
export interface PhotoAnalysis {
  photoId: string;
  isBlurry: boolean;
  blurScore: number;        // 0-100, higher = more blurry
  isScreenshot: boolean;
  isPotentialDuplicate: boolean;
  duplicateGroup?: string;   // ID of duplicate group
  ageInDays: number;
  brightness: number;        // 0-100
  analyzedAt: number;        // timestamp
}

// Phase 1: Achievement definition
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;  // timestamp
  progress: number;     // 0-100 or actual value
  target: number;
}

// Phase 1: Session statistics
export interface SessionStats {
  sessionId: string;
  startTime: number;
  endTime?: number;
  photosReviewed: number;
  photosDeleted: number;
  photosKept: number;
  storageFreed: number;  // bytes
}

// Phase 1: Undo history item
export interface UndoHistoryItem {
  photoId: string;
  decision: PhotoDecision;
  timestamp: number;
}

export interface GalleryState {
  photos: Photo[];
  currentIndex: number;
  stats: GalleryStats;
  decisions: Map<string, PhotoDecision>;
  isLoading: boolean;
  hasMorePhotos: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  photoCursor: string | null;

  // Phase 1: Undo functionality
  undoHistory: UndoHistoryItem[];

  // Phase 1: Session tracking
  currentSession: SessionStats | null;
  lastResumePhotoId: string | null;

  // Phase 2+: Will be added later
  analyses: Map<string, PhotoAnalysis>;
  achievements: Achievement[];
  unlockedAchievements: string[];
}

import type { Asset } from 'expo-media-library';

export type GalleryAction =
  | { type: 'LOAD_PHOTOS_SUCCESS'; photos: Asset[]; cursor: string | null; hasMore: boolean }
  | { type: 'LOAD_MORE_PHOTOS'; photos: Asset[]; cursor: string | null; hasMore: boolean }
  | { type: 'MARK_DELETE'; photoId: string }
  | { type: 'MARK_KEEP'; photoId: string }
  | { type: 'UNDO_DECISION'; photoId: string }
  | { type: 'EXECUTE_DELETIONS_SUCCESS'; deletedIds: string[] }
  | { type: 'SET_PERMISSION_STATUS'; status: 'undetermined' | 'granted' | 'denied' }
  | { type: 'RESET_SESSION' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_CURRENT_INDEX'; index: number }

  // Phase 1: Undo with history
  | { type: 'UNDO_LAST_DECISION' }
  | { type: 'CLEAR_UNDO_HISTORY' }

  // Phase 1: Session management
  | { type: 'START_SESSION' }
  | { type: 'END_SESSION'; stats: SessionStats }
  | { type: 'SET_RESUME_PHOTO'; photoId: string }
  | { type: 'UPDATE_STATS'; stats: Partial<GalleryStats> }

  // Phase 2+: Will be added later
  | { type: 'SET_PHOTO_ANALYSIS'; photoId: string; analysis: PhotoAnalysis }
  | { type: 'BATCH_SET_ANALYSES'; analyses: Map<string, PhotoAnalysis> }
  | { type: 'UNLOCK_ACHIEVEMENT'; achievementId: string };
