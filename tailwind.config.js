/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f7fb',
          100: '#e7ecf5',
          200: '#cbd5e8',
          300: '#9eaecf',
          400: '#6b80b0',
          500: '#3f5894',
          600: '#2d4276',
          700: '#23335c',
          800: '#1a2645',
          900: '#11182d',
          950: '#080c1a',
        },
        ink: {
          50:  '#f7f7f8',
          100: '#eeeef1',
          200: '#d9dade',
          300: '#b6b8c0',
          400: '#888b96',
          500: '#5f6470',
          600: '#444956',
          700: '#2f3340',
          800: '#1d2029',
          900: '#0e1016',
          950: '#05060a',
        },
        accent: {
          50:  '#ecfdf5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tightish: '-0.015em',
      },
      boxShadow: {
        soft:  '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 1px 0 rgb(15 23 42 / 0.03)',
        card:  '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        lift:  '0 8px 24px -8px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        focus: '0 0 0 4px rgb(63 88 148 / 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
