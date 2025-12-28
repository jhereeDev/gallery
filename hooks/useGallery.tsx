import { useContext } from 'react';
import { GalleryContext } from '@/contexts/GalleryContext';

/**
 * Hook to access the Gallery context
 * Must be used within a GalleryProvider
 */
export function useGallery() {
  const context = useContext(GalleryContext);

  if (context === undefined) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }

  return context;
}
