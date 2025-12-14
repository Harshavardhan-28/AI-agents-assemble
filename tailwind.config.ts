import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      // ============================================
      // TYPOGRAPHY - Kitchen OS System
      // ============================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      
      // ============================================
      // WARM COLOR PALETTE - Kitchen OS
      // ============================================
      colors: {
        // Base warm backgrounds (replaces cold slate-950)
        kitchen: {
          bg: '#1a1916',        // Warm charcoal base
          surface: '#252320',   // Card surfaces
          elevated: '#2d2a26',  // Elevated surfaces
          border: '#3d3832',    // Borders
          'border-subtle': '#332f2a', // Subtle borders
        },
        // Warm neutrals
        warm: {
          50: '#faf8f5',
          100: '#f5f1eb',
          200: '#e8e2d9',
          300: '#d4ccc0',
          400: '#b8ad9d',
          500: '#9c8e7c',
          600: '#7d7064',
          700: '#5e5449',
          800: '#403a32',
          900: '#2a2621',
          950: '#1a1916',
        },
        // Parchment/cream accents
        parchment: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#f9f1e4',
          300: '#f2e4cf',
          400: '#e8d3b3',
          500: '#d9bc91',
        },
        // Fresh green (food freshness)
        fresh: {
          50: '#f4f9f4',
          100: '#e6f2e6',
          200: '#cee6cf',
          300: '#a3d1a5',
          400: '#6fb572',
          500: '#4a9a4e',
          600: '#3a7d3e',
          700: '#316434',
          800: '#2b502d',
          900: '#244227',
        },
        // Amber/cooking warmth
        heat: {
          50: '#fefbf3',
          100: '#fdf4e1',
          200: '#fae6be',
          300: '#f6d38f',
          400: '#f0b95e',
          500: '#e9a03a',
          600: '#d4852b',
          700: '#b06825',
          800: '#8e5325',
          900: '#744522',
        },
        // Soft coral for actions
        coral: {
          400: '#f08c7c',
          500: '#e87260',
          600: '#d65a4a',
        },
      },
      
      // ============================================
      // SPACING - Comfortable & Breathable
      // ============================================
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      
      // ============================================
      // ANIMATIONS - Calm Kitchen OS
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'steam': 'steam 2.5s ease-out infinite',
        'grain': 'grain 0.5s steps(1) infinite',
        'progress-fill': 'progressFill 1.5s ease-out forwards',
        'blink': 'blink 1s steps(2) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        steam: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.9)' },
          '40%': { opacity: '0.5' },
          '100%': { opacity: '0', transform: 'translateY(-16px) scale(0.6)' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-2%, -2%)' },
          '20%': { transform: 'translate(2%, 2%)' },
          '30%': { transform: 'translate(-1%, 1%)' },
          '40%': { transform: 'translate(1%, -1%)' },
          '50%': { transform: 'translate(-2%, 2%)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      
      // ============================================
      // BOX SHADOWS - Pixel & Soft
      // ============================================
      boxShadow: {
        // Pixel-style shadows (chunky, 2px steps)
        'pixel-sm': '0 2px 0 0 rgba(0, 0, 0, 0.25)',
        'pixel': '0 3px 0 0 rgba(0, 0, 0, 0.3)',
        'pixel-lg': '0 4px 0 0 rgba(0, 0, 0, 0.35)',
        'pixel-inset': 'inset 0 2px 0 rgba(255, 255, 255, 0.06), inset 0 -2px 0 rgba(0, 0, 0, 0.15)',
        // Soft glow shadows
        'glow-fresh': '0 0 24px rgba(74, 154, 78, 0.2)',
        'glow-heat': '0 0 24px rgba(233, 160, 58, 0.2)',
        'glow-soft': '0 4px 24px rgba(0, 0, 0, 0.15)',
        // Inner highlights
        'inner-top': 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'inner-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
      },
      
      // ============================================
      // BORDER RADIUS - Pixel-snapped
      // ============================================
      borderRadius: {
        'pixel': '4px',
        'pixel-md': '6px',
        'pixel-lg': '8px',
        'pixel-xl': '10px',
      },
      
      // ============================================
      // TIMING FUNCTIONS - Calm & Intentional
      // ============================================
      transitionTimingFunction: {
        'kitchen': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        xs: '2px',
      },
    }
  },
  plugins: []
};

export default config;
