import * as FileSystem from 'expo-file-system/legacy';
import type { Photo, PhotoAnalysis } from '@/types/gallery';

// Screenshot detection based on filename and aspect ratio
export function isScreenshot(photo: Photo): boolean {
  const filename = photo.filename.toLowerCase();

  // Check filename patterns
  const screenshotPatterns = [
    'screenshot',
    'screen_shot',
    'screen shot',
    'scrnshot',
    'scrn',
  ];

  const hasScreenshotName = screenshotPatterns.some(pattern =>
    filename.includes(pattern)
  );

  // Check common screenshot aspect ratios (9:16, 9:18, 9:19, 9:20, 9:21 for phones)
  const aspectRatio = photo.width / photo.height;
  const isPhoneAspectRatio =
    (aspectRatio >= 0.45 && aspectRatio <= 0.6) || // Portrait phone screens
    (aspectRatio >= 1.7 && aspectRatio <= 2.2);     // Landscape phone screens

  return hasScreenshotName || (isPhoneAspectRatio && filename.includes('img'));
}

// Simple blur detection (would need actual image processing for accuracy)
// This is a simplified version - for better results, use image processing libraries
export async function detectBlur(photo: Photo): Promise<{ isBlurry: boolean; score: number }> {
  // Simplified: Check if photo is very old (more likely to be blurry from old cameras)
  const ageInDays = (Date.now() - photo.creationTime) / (1000 * 60 * 60 * 24);
  const isOldPhoto = ageInDays > 1825; // 5 years

  // Simplified blur score based on age (0-100, higher = more likely blurry)
  const score = isOldPhoto ? 60 : 20;

  return {
    isBlurry: score > 50,
    score,
  };
}

// Duplicate detection based on file size and creation time
export function isPotentialDuplicate(photo: Photo, allPhotos: Photo[]): {
  isDuplicate: boolean;
  duplicateGroup?: string;
} {
  if (!photo.fileSize) {
    return { isDuplicate: false };
  }

  // Find photos with same file size within 1 second of creation time
  const potentialDuplicates = allPhotos.filter(p =>
    p.id !== photo.id &&
    p.fileSize === photo.fileSize &&
    Math.abs(p.creationTime - photo.creationTime) < 1000
  );

  if (potentialDuplicates.length > 0) {
    // Create duplicate group ID from the earliest photo ID
    const allRelated = [photo, ...potentialDuplicates].sort((a, b) =>
      a.creationTime - b.creationTime
    );
    const duplicateGroup = `dup_${allRelated[0].id}`;

    return {
      isDuplicate: true,
      duplicateGroup,
    };
  }

  return { isDuplicate: false };
}

// Calculate age in days
export function getPhotoAge(photo: Photo): number {
  return Math.floor((Date.now() - photo.creationTime) / (1000 * 60 * 60 * 24));
}

// Analyze a single photo
export async function analyzePhoto(photo: Photo, allPhotos: Photo[]): Promise<PhotoAnalysis> {
  const ageInDays = getPhotoAge(photo);
  const blurResult = await detectBlur(photo);
  const duplicateResult = isPotentialDuplicate(photo, allPhotos);

  return {
    photoId: photo.id,
    isBlurry: blurResult.isBlurry,
    blurScore: blurResult.score,
    isScreenshot: isScreenshot(photo),
    isPotentialDuplicate: duplicateResult.isDuplicate,
    duplicateGroup: duplicateResult.duplicateGroup,
    ageInDays,
    brightness: 50, // Placeholder - would need actual image analysis
    analyzedAt: Date.now(),
  };
}

// Batch analyze photos (non-blocking)
export async function analyzePhotoBatch(
  photos: Photo[],
  allPhotos: Photo[],
  onProgress?: (analyzed: number, total: number) => void
): Promise<Map<string, PhotoAnalysis>> {
  const analyses = new Map<string, PhotoAnalysis>();

  for (let i = 0; i < photos.length; i++) {
    const analysis = await analyzePhoto(photos[i], allPhotos);
    analyses.set(photos[i].id, analysis);

    if (onProgress) {
      onProgress(i + 1, photos.length);
    }

    // Small delay to prevent blocking
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  return analyses;
}

// Get smart suggestions for deletion
export function getSmartSuggestions(analyses: Map<string, PhotoAnalysis>): string[] {
  const suggestions: string[] = [];

  analyses.forEach((analysis, photoId) => {
    let suggestionScore = 0;

    // Screenshots are likely deletable
    if (analysis.isScreenshot) suggestionScore += 3;

    // Blurry photos
    if (analysis.isBlurry) suggestionScore += 2;

    // Old photos (>2 years)
    if (analysis.ageInDays > 730) suggestionScore += 1;

    // Duplicates
    if (analysis.isPotentialDuplicate) suggestionScore += 2;

    // If score is high enough, suggest deletion
    if (suggestionScore >= 3) {
      suggestions.push(photoId);
    }
  });

  return suggestions;
}
