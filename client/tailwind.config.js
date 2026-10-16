/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        navy: {
          950: '#020817',
          900: '#0A0F1E',
          800: '#0D1424',
          700: '#111827',
          600: '#1a2235',
          500: '#1e293b',
        },
        cyan: {
          DEFAULT: '#00D9FF',
          50: '#f0fffe',
          100: '#c0fdff',
          200: '#80f9ff',
          300: '#40f3ff',
          400: '#00E8FF',
          500: '#00D9FF',
          600: '#00b8d9',
          700: '#0090a8',
          800: '#006878',
          900: '#003d47',
        },
        purple: {
          brand: '#7C3AED',
          light: '#A855F7',
          neon: '#BF5AF2',
        },
        green: {
          neon: '#00FF88',
          brand: '#10B981',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #020817 0%, #0A0F1E 50%, #0D1424 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'cyan-gradient': 'linear-gradient(135deg, #00D9FF 0%, #0090a8 100%)',
        'purple-gradient': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
        'success-gradient': 'linear-gradient(135deg, #00FF88 0%, #10B981 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.3), 0 0 60px rgba(0, 217, 255, 0.1)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.3), 0 0 60px rgba(124, 58, 237, 0.1)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'scan': 'scan 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 217, 255, 0.6), 0 0 80px rgba(0, 217, 255, 0.2)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(300%)' },
        },
      },
    },
  },
  plugins: [],
}
