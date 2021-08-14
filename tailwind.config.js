module.exports = {
  purge: ['./extension-chrome/index.html'],
  darkMode: 'media',
  theme: {
    screens: {
      sm: '600px',
      md: '900px',
      lg: '1400px',
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp')
  ],
}
