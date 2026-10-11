/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A192F',
          dark: '#07101E',
          blue: '#0D3B66',
          primary: '#0284C7',
          cyan: '#06B6D4',
          sky: '#38BDF8',
          accent: '#F97316',
          orange: '#EA580C',
          amber: '#F59E0B',
          light: '#F0F7FF',
          card: '#0F2744',
          border: '#1E3A5F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(2, 132, 199, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(249, 115, 22, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulseGlow 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
