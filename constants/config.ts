/**
 * Configuration constants for the Gallery Cleaner app
 */

// Swipe gesture configuration
export const SWIPE_THRESHOLD = 120; // px to trigger delete/keep action
export const ROTATION_FACTOR = 15; // Divider for card rotation based on swipe distance

// Photo loading configuration
export const PHOTO_BATCH_SIZE = 20; // Number of photos to load per batch
export const PRELOAD_THRESHOLD = 5; // Load more photos when this many remain

// Animation timing
export const CARD_EXIT_DURATION = 250; // ms for card exit animation
export const CARD_SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};
