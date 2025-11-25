/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3A8DFF',
        secondary: '#1B2A41',
        highlight: '#00D4FF',
        neutralLight: '#F5F8FF',
        neutralDark: '#2E2E2E',
      },
    },
  },
};
