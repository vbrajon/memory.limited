module.exports = {
  purge: ['./extension-chrome/index.html'],
  darkMode: 'media',
  theme: {},
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
  ],
}
