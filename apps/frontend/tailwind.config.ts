import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium dark palette (graphite - no generic purple gradients)
        graphite: {
          950: 'rgb(15 15 17)',   // Deepest black
          900: 'rgb(23 23 27)',   // Dark background
          800: 'rgb(32 32 38)',   // Elevated surface
          700: 'rgb(45 45 52)',   // Border color
          600: 'rgb(60 60 68)',   // Hover border
        },
        // Orange accent (not purple/blue)
        accent: {
          DEFAULT: 'rgb(249 115 22)',  // Orange-500
          hover: 'rgb(234 88 12)',     // Orange-600
          glow: 'rgb(251 146 60)',     // Orange-400
          subtle: 'rgb(254 215 170)',  // Orange-200
        },
        // Semantic colors
        success: 'rgb(34 197 94)',
        error: 'rgb(239 68 68)',
        warning: 'rgb(234 179 8)',
      },
      fontFamily: {
        // Avoid Inter - use distinctive fonts
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
      },
      blur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.6)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
