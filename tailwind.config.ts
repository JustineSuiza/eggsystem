import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0'
          },
          '100%': { 
            opacity: '1'
          }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      }
    }
  }
}

export default config
