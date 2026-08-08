/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // class-based theme switching so we apply .dark or .light on <html>
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
          300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
        accent: {
          purple: '#a855f7', cyan: '#06b6d4',
          emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
        'gradient-brand-r': 'linear-gradient(135deg, #06b6d4 0%, #a855f7 50%, #6366f1 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
      },
      keyframes: {
        'blob-float': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':      { transform: 'translate(30px,-20px) scale(1.05)' },
          '66%':      { transform: 'translate(-20px,15px) scale(0.96)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'blob': 'blob-float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-up': 'fade-up 0.5s ease forwards',
      },
    },
  },
  plugins: [],
};
