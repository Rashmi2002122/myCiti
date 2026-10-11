/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sky-light': '#eaf4ff',
        'sky-base': '#cfe7ff',
        'city-blue': '#2f7bff',
        'pandal-orange': '#f0592a',
        'mela-purple': '#8a4fe0',
        'offer-green': '#17a673',
        'inaug-blue': '#2f7bff',
      },
      borderRadius: {
        'card': '26px',
        'card-lg': '30px',
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
