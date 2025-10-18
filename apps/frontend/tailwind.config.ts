import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './stories/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1f2937',
          light: '#374151'
        },
        accent: {
          DEFAULT: '#38bdf8',
          muted: '#0ea5e9'
        }
      }
    }
  },
  plugins: []
};

export default config;
