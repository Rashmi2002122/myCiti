/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '420px',
      },
      fontFamily: {
        sans: ['"Financial Plex Sans"', '"IBM Plex Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Financial Plex Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        // Financial Design System Tokens
        'ground': '#07090e',
        'ground-tint': '#101522',
        'panel': '#10141c',
        'accent': '#ff951f',
        'accent-hover': '#e68416',
        'value': '#edcd8c',
        'ink': '#f4f5f7',
        'ink-muted': '#c9ced8',
        'line': '#303139',

        // Legacy semantic mappings preserved
        'sky-light': '#101522',
        'sky-base': '#10141c',
        'city-blue': '#ff951f',
        'pandal-orange': '#ff951f',
        'mela-purple': '#8a4fe0',
        'offer-green': '#17a673',
        'inaug-blue': '#2f7bff',
      },
      borderRadius: {
        'panel': '5px',
        'editorial': '4px',
        'control': '40px',
        'card': '6px',
        'card-lg': '8px',
      },
      transitionDuration: {
        '160': '160ms',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.07)',
        'sheet': '0 -10px 40px rgba(0, 0, 0, 0.12)',
        'float': '0 6px 20px rgba(0, 0, 0, 0.10)',
      }
    },
  },
  plugins: [],
}
