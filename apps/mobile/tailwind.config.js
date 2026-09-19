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
        driver: {
          bg: '#070B12',
          card: '#0F172A',
          surface: '#1E293B',
          accent: '#2563EB',
          warning: '#D97706',
          danger: '#DC2626',
          success: '#059669'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
