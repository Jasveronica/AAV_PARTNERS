/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1520',
          900: '#172D43',
          800: '#243B53',
          700: '#334E68',
          600: '#486581',
          500: '#627D98',
          100: '#D9E2EC',
          50: '#F0F4F8',
        },
        gold: {
          50: '#FBF8F2',
          100: '#F4EDE0',
          200: '#EADEC7',
          300: '#D8BA84',
          400: '#C5A36B',
          500: '#A48248',
          600: '#836531',
        },
        ivory: '#FAF9F6',
        surface: '#FFFFFF',
        appBg: '#F5F6F8',
        textColor: '#253247',
        success: '#168653',
        warning: '#D69E36',
        danger: '#D9534F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(23, 45, 67, 0.05), 0 1px 2px 0 rgba(23, 45, 67, 0.03)',
        card: '0 4px 6px -1px rgba(23, 45, 67, 0.06), 0 2px 4px -1px rgba(23, 45, 67, 0.04)',
        elevated: '0 10px 15px -3px rgba(23, 45, 67, 0.08), 0 4px 6px -2px rgba(23, 45, 67, 0.04)',
      },
    },
  },
  plugins: [],
}
