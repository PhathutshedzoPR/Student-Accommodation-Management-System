/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff4ec',
          100: '#ffe3cc',
          200: '#ffc49a',
          300: '#ffa060',
          400: '#ee7724', // gradient start — orange
          500: '#d8363a', // gradient mid — red
          600: '#dd3675', // gradient mid — pink
          700: '#b44593', // gradient end — purple
          800: '#8b2f72',
          900: '#621e52',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};