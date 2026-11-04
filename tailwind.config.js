/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wood': '#d4a574',
        'wood-dark': '#a0784c',
        'go-black': '#1a1a1a',
        'go-white': '#f5f5f0',
      },
    },
  },
  plugins: [],
}
