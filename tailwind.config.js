/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        'qf-blue':  '#38bdf8',
        'qf-dark':  '#080c10',
        'qf-card':  '#111827',
        'qf-border':'#1e2d3d',
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)',
        'fade-in':   'fadeIn 0.3s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
