import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Spring animation configuration for smooth, natural card movements
 */
export const SPRING_CONFIG: WithSpringConfig = {
  damping: 20,
  stiffness: 300,
};

/**
 * Timing animation configuration for card transitions
 */
export const TIMING_CONFIG: WithTimingConfig = {
  duration: 200,
};

/**
 * Card exit animation configuration
 */
export const EXIT_SPRING_CONFIG: WithSpringConfig = {
  damping: 15,
  stiffness: 200,
  velocity: 2000,
};
