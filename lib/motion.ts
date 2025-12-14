/**
 * Kitchen OS Motion System
 * Calm, intentional animations for a cozy kitchen interface
 */

// ============================================
// EASING FUNCTIONS
// ============================================

export const easing = {
  // Default kitchen easing - smooth and calm
  kitchen: [0.25, 0.1, 0.25, 1] as const,
  // Smooth for general transitions
  smooth: [0.4, 0, 0.2, 1] as const,
  // Soft bounce for playful elements
  bounceSoft: [0.34, 1.56, 0.64, 1] as const,
  // Linear for loading animations
  linear: [0, 0, 1, 1] as const,
};

// ============================================
// DURATION PRESETS
// ============================================

export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  page: 0.6,
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const transition = {
  default: { duration: duration.normal, ease: easing.kitchen as unknown as [number, number, number, number] },
  fast: { duration: duration.fast, ease: easing.kitchen as unknown as [number, number, number, number] },
  slow: { duration: duration.slow, ease: easing.smooth as unknown as [number, number, number, number] },
  spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  page: { duration: duration.page, ease: easing.smooth },
};

// ============================================
// ANIMATION VARIANTS
// ============================================

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
};

// ============================================
// STAGGER VARIANTS
// ============================================

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transition.default,
  },
};

export const staggerFast = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// ============================================
// HOVER VARIANTS
// ============================================

export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -2 },
  tap: { y: 1 },
};

export const hoverScale = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transition.page,
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: transition.fast,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a stagger delay for list items
 */
export function staggerDelay(index: number, base = 0.05): number {
  return index * base;
}

/**
 * Create transition with custom delay
 */
export function withDelay(delay: number) {
  return { ...transition.default, delay };
}
