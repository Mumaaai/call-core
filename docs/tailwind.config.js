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
        mumaa: {
          beige: '#fdf8f5',
          dark: '#1c1c1e',
          orange: '#ff9b50',
          orangeLight: '#ffcda8',
        }
      }
    },
  },
  plugins: [],
}
