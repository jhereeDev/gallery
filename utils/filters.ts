import type { Photo, PhotoAnalysis } from '@/types/gallery';

export type FilterType =
  | 'all'
  | 'screenshots'
  | 'blurry'
  | 'old'
  | 'duplicates'
  | 'large'
  | 'suggested';

export interface PhotoFilter {
  type: FilterType;
  label: string;
  icon: string;
}

export const FILTER_PRESETS: PhotoFilter[] = [
  { type: 'all', label: 'All Photos', icon: '📷' },
  { type: 'suggested', label: 'Smart Suggestions', icon: '✨' },
  { type: 'screenshots', label: 'Screenshots', icon: '📱' },
  { type: 'blurry', label: 'Blurry', icon: '😵' },
  { type: 'old', label: 'Old (2+ years)', icon: '📅' },
  { type: 'duplicates', label: 'Duplicates', icon: '👯' },
  { type: 'large', label: 'Large Files', icon: '💾' },
];

// Apply filter to photos
export function applyFilter(
  photos: Photo[],
  filter: FilterType,
  analyses: Map<string, PhotoAnalysis>,
  smartSuggestions: string[]
): Photo[] {
  if (filter === 'all') {
    return photos;
  }

  return photos.filter(photo => {
    const analysis = analyses.get(photo.id);

    switch (filter) {
      case 'suggested':
        return smartSuggestions.includes(photo.id);

      case 'screenshots':
        return analysis?.isScreenshot === true;

      case 'blurry':
        return analysis?.isBlurry === true;

      case 'old':
        return (analysis?.ageInDays || 0) > 730; // 2+ years

      case 'duplicates':
        return analysis?.isPotentialDuplicate === true;

      case 'large':
        return (photo.fileSize || 0) > 5 * 1024 * 1024; // 5MB+

      default:
        return true;
    }
  });
}

// Get filter counts
export function getFilterCounts(
  photos: Photo[],
  analyses: Map<string, PhotoAnalysis>,
  smartSuggestions: string[]
): Record<FilterType, number> {
  const counts: Record<FilterType, number> = {
    all: photos.length,
    suggested: smartSuggestions.length,
    screenshots: 0,
    blurry: 0,
    old: 0,
    duplicates: 0,
    large: 0,
  };

  photos.forEach(photo => {
    const analysis = analyses.get(photo.id);

    if (analysis?.isScreenshot) counts.screenshots++;
    if (analysis?.isBlurry) counts.blurry++;
    if ((analysis?.ageInDays || 0) > 730) counts.old++;
    if (analysis?.isPotentialDuplicate) counts.duplicates++;
    if ((photo.fileSize || 0) > 5 * 1024 * 1024) counts.large++;
  });

  return counts;
}
