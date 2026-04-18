import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bainsa: {
          black: '#0a0a0a',
          white: '#f4f3f3',
          blue: '#2740eb',
          orange: '#fe6203',
          pink: '#fe43a7',
          surface: '#111111',
          border: 'rgba(244,243,243,0.10)',
          muted: 'rgba(244,243,243,0.45)',
        },
      },
      fontFamily: {
        heading: ['"Alliance No.2"', '"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Alliance No.1"', '"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      aspectRatio: {
        '9/16': '9 / 16',
      },
      animation: {
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
