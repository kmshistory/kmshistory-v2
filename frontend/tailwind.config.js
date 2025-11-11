/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,css}",
  ],
  safelist: [
    'gradient-bg',
    'dark-gradient-bg',
    'light-gradient-bg',
    'card-hover',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#061F40',
        secondary: '#062540',
        accent: '#F2F2F2',
        light: '#979DA6',
        dark: '#051326',
        'samsung-blue': '#1428a0',
        'samsung-light': '#f8fafc',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
