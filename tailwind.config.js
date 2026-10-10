/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './apps/web/index.html',
    './apps/web/src/**/*.{js,ts,jsx,tsx}',
    './packages/shared/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        ivory: {
          DEFAULT: '#F8F6F0',
          dark: '#111612'
        },
        softwhite: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#182019',
          card: '#FFFFFF',
          'card-dark': '#1F2921',
          deep: '#0D120E'
        },
        ink: {
          DEFAULT: '#1E261F',
          heading: '#163122',
          light: '#374539',
          muted: '#4A5B4D',
          faint: '#657768',
          dark: '#FFFFFF',
          'dark-heading': '#FFFFFF',
          'heading-dark': '#FFFFFF',
          'dark-secondary': '#E5EFE3',
          'secondary-dark': '#E5EFE3',
          'dark-muted': '#CAD8C7',
          'muted-dark': '#CAD8C7',
          'dark-faint': '#A4B8A1',
          'faint-dark': '#A4B8A1'
        },
        forest: {
          DEFAULT: '#27523C',
          deep: '#152C20',
          hover: '#1E402F',
          light: '#3D775A',
          faint: '#EAF3ED',
          dark: '#58A581',
          'dark-faint': '#1A3325'
        },
        sage: {
          DEFAULT: '#A8B9A2',
          light: '#E5EDE1',
          faint: '#F2F7F0',
          dark: '#526654',
          'dark-light': '#2A3B2E'
        },
        stone: {
          DEFAULT: '#DFDACF',
          light: '#EFECE5',
          warm: '#F5F2EB',
          dark: '#303E33',
          'dark-light': '#222D24',
          'dark-warm': '#27362A'
        },
        amber: {
          DEFAULT: '#B87B2E',
          light: '#FAF2E6',
          hover: '#9E6620',
          dark: '#E8B26D',
          'dark-light': '#3D2A14'
        },
        brand: {
          error: '#BA3939',
          'error-light': '#FDF2F2',
          'error-dark': '#E67373',
          'error-dark-bg': '#381818',
          success: '#2B734F',
          'success-light': '#EDF8F2',
          'success-dark': '#52B386',
          'success-dark-bg': '#143322'
        }
      }
    }
  },
  plugins: []
};
