/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          emerald: '#112E24',
          'emerald-light': '#183F32',
          'emerald-dark': '#0B1F18',
          gold: '#C5A880',
          'gold-light': '#D6BF9F',
          'gold-dark': '#A8895E',
          cream: '#FAF8F5',
          sand: '#F3EFEA',
          linen: '#EBE5DC',
          charcoal: '#1A221E',
          taupe: '#627068',
          border: '#E8E2D8',
        },
        medical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#112E24', // Remap default medical to deep emerald
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#334e68',
          800: '#102a43',
          900: '#0b1d3a',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
