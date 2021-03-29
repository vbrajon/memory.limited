// npm install -g @tailwindcss/jit tailwindcss postcss postcss-cli autoprefixer @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio @tailwindcss/line-clamp cssnano
// TAILWIND_MODE=build postcss tailwind.css -o extension-chrome/index.css --verbose && ls -lh extension-chrome/index.css | awk '{print "\x1B[33mSize: " $5}'
// TAILWIND_MODE=watch postcss tailwind.css -o extension-chrome/index.css --watch --verbose

module.exports = {
  plugins: {
    '@tailwindcss/jit': {},
    // autoprefixer: {},
    cssnano: { preset: 'default' },
  }
}
