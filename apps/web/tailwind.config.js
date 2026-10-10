import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    path.join(__dirname, '../../packages/shared/src/**/*.{js,ts,jsx,tsx}')
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Playfair Display"', '"Newsreader"', 'Georgia', 'serif'],
        handwritten: ['"Caveat"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        // Light & Dark mode surfaces
        ivory: {
          DEFAULT: '#F7F6F0',
          dark: '#0F1D17'
        },
        softwhite: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#162720',
          card: '#FFFFFF',
          'card-dark': '#1A2E26',
          elevated: '#FFFFFF',
          'elevated-dark': '#1E352C',
          deep: '#0B1611'
        },
        // Typography & Ink (High-contrast, intentional editorial tones)
        ink: {
          DEFAULT: '#26372F',          // Deep charcoal-forest ink
          heading: '#17362D',          // Deepest forest heading ink
          light: '#42554B',            // Clear secondary body text
          muted: '#5E6E65',            // High-contrast supporting metadata
          faint: '#7A8B82',            // Readable label text
          // Dark mode counterparts (Luminous, crisp high contrast)
          dark: '#FFFFFF',             // Pure crisp white
          'dark-heading': '#FFFFFF',   // Brilliant heading white
          'heading-dark': '#FFFFFF',
          'dark-secondary': '#DDE7DF', // Bright luminous soft sage
          'secondary-dark': '#DDE7DF',
          'dark-muted': '#A6BCB0',     // Crisp readable secondary text
          'muted-dark': '#A6BCB0',     // Crisp readable secondary text
          'dark-faint': '#82998C',     // Clear supporting metadata
          'faint-dark': '#82998C'
        },
        // Primary Forest green palette
        forest: {
          DEFAULT: '#24483B',
          deep: '#17362D',
          hover: '#1E402F',
          light: '#386652',
          faint: '#EAF2ED',
          // Dark mode accents
          dark: '#58A581',
          'dark-faint': '#183327'
        },
        // Accent Lime (Restrained highlight accent)
        lime: {
          DEFAULT: '#C4E65D',
          light: '#E2F4A6',
          faint: '#F4FBDF',
          dark: '#9BB83D',
          'dark-faint': '#2A3614'
        },
        // Muted Sage
        sage: {
          DEFAULT: '#A8BDAF',
          light: '#E5ECE7',
          faint: '#F2F6F3',
          dark: '#4B6354',
          'dark-light': '#243A2E'
        },
        // Warm Stone dividers & borders
        stone: {
          DEFAULT: '#DFE5DC',
          light: '#F0F4EE',
          warm: '#F7F6F0',
          dark: '#2B453A',
          'dark-light': '#1C2F27',
          'dark-warm': '#22382F'
        },
        // Semantic Amber highlights
        amber: {
          DEFAULT: '#A66A19',
          light: '#FAF3E6',
          hover: '#8C5611',
          dark: '#E5A346',
          'dark-light': '#36240D'
        },
        // Semantic Brand Status
        brand: {
          error: '#B74444',
          'error-light': '#FDF2F2',
          'error-dark': '#E56B6B',
          'error-dark-bg': '#381818',
          success: '#287D57',
          'success-light': '#EDF8F2',
          'success-dark': '#4EBF88',
          'success-dark-bg': '#133524'
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(23, 54, 45, 0.04)',
        xs: '0 1px 3px rgba(23, 54, 45, 0.06), 0 1px 2px rgba(23, 54, 45, 0.04)',
        editorial: '0 1px 3px rgba(23, 54, 45, 0.05), 0 6px 20px rgba(23, 54, 45, 0.04)',
        'editorial-dark': '0 1px 3px rgba(0, 0, 0, 0.35), 0 6px 20px rgba(0, 0, 0, 0.45)',
        'editorial-hover': '0 4px 12px rgba(23, 54, 45, 0.08), 0 16px 32px rgba(23, 54, 45, 0.06)',
        'editorial-modal': '0 24px 48px -12px rgba(23, 54, 45, 0.18), 0 0 0 1px rgba(223, 229, 220, 0.9)',
        'editorial-modal-dark': '0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(43, 69, 58, 0.9)'
      }
    }
  },
  plugins: []
};
