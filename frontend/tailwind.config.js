/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand palette — Violet/Lavender
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Violet accent
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // Emerald — positive/growth signals
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // Rose — warnings/danger
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // Amber — warm accent / goals
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Cyan — secondary accent
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // Surface — dark UI backgrounds (Deep navy / charcoal)
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          700: '#1a2540',
          750: '#17203a',
          800: '#1e293b',
          850: '#151f32',
          900: '#0f172a',
          950: '#090e1a',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      backgroundImage: {
        'gradient-radial':      'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand':       'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
        'gradient-dark':        'linear-gradient(135deg, #090e1a 0%, #0f172a 100%)',
        'gradient-glow':        'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
        'gradient-card':        'linear-gradient(135deg, rgba(9,14,26,0.55) 0%, rgba(9,14,26,0.40) 100%)',
        'gradient-sidebar':     'linear-gradient(180deg, rgba(9,14,26,0.92) 0%, rgba(9,14,26,0.88) 100%)',
        'gradient-hero':        'linear-gradient(135deg, rgba(9,14,26,0.50) 0%, rgba(9,14,26,0.30) 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1)',
        'glow-violet':  '0 0 20px rgba(167,139,250,0.3), 0 0 60px rgba(167,139,250,0.1)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'glow-rose':    '0 0 20px rgba(244,63,94,0.3)',
        'glow-amber':   '0 0 20px rgba(245,158,11,0.3)',
        'glow-cyan':    '0 0 20px rgba(6,182,212,0.3)',
        'card':         '0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.4)',
        'card-hover':   '0 4px 6px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
        'sidebar':      '4px 0 32px rgba(0,0,0,0.5)',
        'topbar':       '0 2px 24px rgba(0,0,0,0.5)',
        'modal':        '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':          'fadeIn 0.5s ease-out forwards',
        'fade-in-up':       'fadeInUp 0.6s ease-out forwards',
        'fade-in-down':     'fadeInDown 0.6s ease-out forwards',
        'slide-in-left':    'slideInLeft 0.4s ease-out forwards',
        'slide-in-right':   'slideInRight 0.4s ease-out forwards',
        'scale-in':         'scaleIn 0.3s ease-out forwards',
        'pulse-glow':       'pulseGlow 2s ease-in-out infinite',
        'shimmer':          'shimmer 1.5s linear infinite',
        'float':            'float 3s ease-in-out infinite',
        'gradient-shift':   'gradientShift 4s ease infinite',
        'spin-slow':        'spin 3s linear infinite',
        'bounce-subtle':    'bounceSubtle 2s ease-in-out infinite',
        'ping-slow':        'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(139,92,246,0.3)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-4px)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
        '88': '22rem',
      },
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
