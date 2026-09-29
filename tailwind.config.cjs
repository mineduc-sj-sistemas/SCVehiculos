/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orangeGov: {
          DEFAULT: '#ea580c',
          hover: '#c2410c',
          light: '#fff7ed',
          border: '#fdba74',
        },
        charcoalGov: {
          DEFAULT: '#2d2e37',
          dark: '#202127',
          hover: '#3a3b47',
        },
        goldGov: '#f59e0b',
        paperGov: '#f8fafc',
      },
    },
  },
  plugins: [],
}
