import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f6f8f7',
          100: '#eef2f0',
          200: '#dde6e1',
          300: '#ccd9d2',
          400: '#aac1b4',
          500: '#889096',
          600: '#6b7278',
          700: '#4e5359',
          800: '#353a3f',
          900: '#1a1d21',
          950: '#0d0f11',
        },
        gold: {
          50: '#fffbf0',
          100: '#fff7e0',
          200: '#ffecbb',
          300: '#ffe096',
          400: '#ffd966',
          500: '#ffcd3c',
          600: '#e5b800',
          700: '#c9901a',
          800: '#8b6914',
          900: '#5a450e',
        },
        cream: '#faf9f4',
      },
      fontFamily: {
        display: ['var(--font-playfair)'],
        body: ['var(--font-lato)'],
      },
    },
  },
  plugins: [],
}
export default config
