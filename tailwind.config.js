/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#e8e5df',
          300: '#d4cfc5',
          400: '#b8b1a4',
          500: '#9c9383',
          600: '#7a7265',
          700: '#5c564d',
          800: '#3d3933',
          900: '#1f1d1a',
        },
        accent: {
          50: '#f7f6f4',
          100: '#edeae5',
          200: '#d9d4ca',
          300: '#c2baab',
          400: '#a89d8a',
          500: '#8f8069',
          600: '#726554',
          700: '#5a4f42',
          800: '#3d352c',
          900: '#1f1b16',
        },
        gold: {
          50: '#fefbf3',
          100: '#fdf6e7',
          200: '#faebc5',
          300: '#f6d99f',
          400: '#f1c178',
          500: '#e8a855',
          600: '#d4893a',
          700: '#b06a2c',
          800: '#8f5628',
          900: '#754724',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        wide: '0.02em',
        wider: '0.05em',
      },
      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-2': ['3.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'luxury': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

