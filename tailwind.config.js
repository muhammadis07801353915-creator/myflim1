/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b3191f',
        background: '#ffffff',
      },
      fontWeight: {
        thin: 'normal',
        extralight: 'normal',
        light: 'normal',
        normal: 'normal',
        medium: 'normal',
        semibold: 'normal',
        bold: 'normal',
        extrabold: 'normal',
        black: 'normal',
      }
    },
  },
  plugins: [],
}
