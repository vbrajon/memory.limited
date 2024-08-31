export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    cssnano: { preset: "default" },
    // "postcss-url": {
    //   async url(asset, dir, options) {
    //     if (!asset.url.startsWith("https://api.iconify.design")) return
    //     const svg = await (await fetch(asset.url)).text()
    //     // svg.replace(/<svg[^>]*>/, m => m + "<style>* { stroke-width: 1px; }</style>")
    //     const base64 = Buffer.from(svg).toString("base64")
    //     return `data:image/svg+xml;base64,${base64}`
    //   },
    // },
  },
}
