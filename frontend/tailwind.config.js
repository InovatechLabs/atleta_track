/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0c10',
          2: '#111318',
          3: '#181c24',
        },
        accent: {
          DEFAULT: '#3b82f6',
          2: '#60a5fa',
        },
      },
    },
  },
  plugins: [],
}
