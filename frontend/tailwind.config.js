/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light mode (Landing, Start, Report)
        page:    '#FFFFFF',
        surface: '#F7F7F5',
        'border-light': '#E8E8E8',
        primary: '#191919',
        secondary: '#6B7280',
        // Dark mode (Session page)
        bg:      '#0F0F0F',
        'surface-dark': '#1A1A1A',
        border:  '#2A2A2A',
        muted:   '#555555',
        // Emotion colors
        emotion: {
          focused:    '#4ADE80',
          neutral:    '#FACC15',
          confused:   '#FB923C',
          bored:      '#F472B6',
          distressed: '#F87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
