/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          DEFAULT: '#954535', // A basic brown shade
          light: '#A0522D',
          dark: '#87553B',
          100: '#d8c2a2',
          200: '#c3a27e',
          300: '#9e8d5c',
          400: '#7a7245',
          500: '#5e5c2f',
          600: '#48442b',
          700: '#362f1f',
          800: '#2c2416', // Dark brown
          900: '#1e170f', // Darker brown
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [

  ],
}