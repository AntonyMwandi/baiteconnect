import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        meruGreen:  '#01411C',
        meruGold:   '#F5B800',
        meruBrown:  '#6E473B',
        neutralDark: '#1F2937',
        neutralLight: '#F9FAFB',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body:    ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-in-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'pulse-gold':  'pulseGold 2s infinite',
        'count-up':    'countUp 0.6s ease-out',
        'shimmer':     'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(245,184,0,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(245,184,0,0)' } },
        countUp:   { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'meru-header': 'linear-gradient(135deg, #01411C 0%, #025c27 60%, #01411C 100%)',
        'gold-shine':  'linear-gradient(90deg, transparent, rgba(245,184,0,0.3), transparent)',
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-lg':  '0 4px 16px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        'green-glow': '0 0 20px rgba(1,65,28,0.25)',
        'gold-glow':  '0 0 20px rgba(245,184,0,0.35)',
      },
    },
  },
  plugins: [],
}

export default config
