import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1A1A1A',
        primary: '#FFFFFF',
        secondary: '#BCBCBC',
        accent: '#D6FF00',
        border: 'rgba(255, 255, 255, 0.08)',
        hover: 'rgba(214, 255, 0, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
