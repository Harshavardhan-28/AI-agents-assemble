"use client";

import { motion, AnimatePresence, HTMLMotionProps, type Transition } from 'framer-motion';
import type { ReactNode } from 'react';

// ============================================
// ANIMATION VARIANTS - Kitchen OS
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

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

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
  visible: { opacity: 1, y: 0 },
};

// ============================================
// TRANSITION PRESETS
// ============================================

const defaultTransition: Transition = { 
  duration: 0.3, 
  ease: [0.25, 0.1, 0.25, 1] 
};

const fastTransition: Transition = { 
  duration: 0.15, 
  ease: [0.25, 0.1, 0.25, 1] 
};

// ============================================
// ANIMATED CONTAINERS
// ============================================

interface MotionContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
}

export function FadeIn({ children, delay = 0, className = '', ...props }: MotionContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
      transition={{ ...defaultTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, delay = 0, className = '', ...props }: MotionContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInUp}
      transition={{ ...defaultTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className = '', ...props }: MotionContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
      transition={{ ...defaultTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = '', ...props }: MotionContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '', ...props }: MotionContainerProps) {
  return (
    <motion.div
      variants={staggerItem}
      transition={defaultTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// BUTTONS - Kitchen OS Style
// ============================================

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'heat' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    heat: 'btn-heat',
    ghost: 'btn-ghost',
  };

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 2 }}
      transition={fastTransition}
      disabled={disabled || loading}
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <LoadingDots /> : children}
    </motion.button>
  );
}

// ============================================
// PANELS
// ============================================

interface PanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  hover?: boolean;
}

export function Panel({ children, className = '', hover = false, ...props }: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={defaultTransition}
      whileHover={hover ? { y: -2 } : undefined}
      className={`panel ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// LOADING COMPONENTS
// ============================================

export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`loading-dots ${className}`}>
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
    </div>
  );
}

export function SteamLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`steam-container ${className}`}>
      <div className="steam" />
      <div className="steam" />
      <div className="steam" />
    </div>
  );
}

interface ProgressBarProps {
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

export function ProgressBar({ progress = 0, indeterminate = false, className = '' }: ProgressBarProps) {
  return (
    <div className={`progress-bar ${className}`}>
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: indeterminate ? '100%' : `${progress}%` }}
        transition={indeterminate 
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } 
          : defaultTransition
        }
        style={indeterminate ? { 
          background: 'linear-gradient(90deg, transparent 0%, var(--fresh) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
        } : undefined}
      />
    </div>
  );
}

interface CookingLoaderProps {
  message?: string;
  className?: string;
}

export function CookingLoader({ message = 'Cooking up recipes...', className = '' }: CookingLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 py-12 ${className}`}>
      <div className="relative flex items-center justify-center">
        <motion.div 
          className="w-16 h-16 flex items-center justify-center"
          style={{ fontSize: '4rem', lineHeight: 1 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          🍲
        </motion.div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <SteamLoader />
        </div>
      </div>
      <div className="text-center">
        <p className="text-base text-warm-300 mb-4">{message}</p>
        <div className="w-56 mx-auto">
          <ProgressBar indeterminate />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SELECTION CARD
// ============================================

interface SelectionCardProps {
  selected?: boolean;
  icon: string;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function SelectionCard({ selected = false, icon, label, onClick, className = '' }: SelectionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={fastTransition}
      className={`selection-card ${selected ? 'selected' : ''} ${className}`}
    >
      <span className="selection-card-icon">{icon}</span>
      <span className="selection-card-label">{label}</span>
    </motion.button>
  );
}

// ============================================
// TAG COMPONENT
// ============================================

interface TagProps {
  children: ReactNode;
  variant?: 'default' | 'fresh' | 'heat' | 'selected';
  onClick?: () => void;
  className?: string;
}

export function Tag({ children, variant = 'default', onClick, className = '' }: TagProps) {
  const variants = {
    default: 'tag',
    fresh: 'tag tag-fresh',
    heat: 'tag tag-heat',
    selected: 'tag tag-selected',
  };

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${variants[variant]} ${className}`}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = '📭', title, description, children, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={defaultTransition}
      className={`empty-state ${className}`}
    >
      <motion.div 
        className="empty-state-icon"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-text">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
}

// Re-export motion and AnimatePresence
export { motion, AnimatePresence };
