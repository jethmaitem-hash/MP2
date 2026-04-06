import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1e3a8a',
          'blue-light': '#3b82f6',
          gold: '#f59e0b',
          'gold-light': '#fcd34d',
        },
      },
    },
  },
  plugins: [],
}

export default config
