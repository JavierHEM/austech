// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // esto permite controlar el modo oscuro con clases
  theme: {
    extend: {
      colors: {
        'dark': {
          'primary': '#1A1B1E',     // Fondo principal
          'secondary': '#25262B',   // Fondo secundario
          'accent': '#2C2D32',      // Fondo de elementos resaltados
          'border': '#373A40',      // Color de bordes
          'text': '#C1C2C5',        // Texto principal
          'text-secondary': '#909296' // Texto secundario
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}