/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff8f4',
          100: '#d7efe3',
          200: '#b0dfc8',
          300: '#7fc9a8',
          400: '#4dab85',
          500: '#2f8f6b',
          600: '#1f7355',
          700: '#1b5c46',
          800: '#194a3a',
          900: '#153e31',
        },
        accent: {
          500: '#c8912b',
          600: '#a8741d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
