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
        brand: {
          orange: '#FF5500',
          'orange-hover': '#FF4000',
          'orange-glow': 'rgba(255, 85, 0, 0.25)',
          'orange-subtle': 'rgba(255, 85, 0, 0.08)',
          silver: '#94A3B8',
          metallic: '#CBD5E1',
          dark: '#080A0F',
          surface: '#0E131F',
          card: '#141B2D',
          border: '#1F2942',
          cardLight: '#FFFFFF',
          surfaceLight: '#F8FAFC',
          borderLight: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(255, 85, 0, 0.3)',
        'glow-sm': '0 0 15px -3px rgba(255, 85, 0, 0.2)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
