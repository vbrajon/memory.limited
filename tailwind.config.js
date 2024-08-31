import plugin from "tailwindcss/plugin"
import colors from "tailwindcss/colors"
const pluginColor = plugin.withOptions(
  // Usage:
  // <div class="primary-amber">
  //   <div class="text-primary">Primary Amber</div>
  // </div>
  // https://uicolors.app/
  function (options = { names: ["primary", "secondary"], colors }) {
    const values = Object.fromEntries(Object.keys(options.colors).map((k) => [k, k]))
    function utilityColor(name) {
      return (v) => {
        const color = options.colors[v]
        if (!color || typeof color === "string") return {} // TODO, generate palette with https://uicolors.app/
        // #ff69b4 to 255 105 180
        const hexToRgb = (hex) => {
          const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
          return `${r} ${g} ${b}`
        }
        return {
          [`--${name}-50`]: hexToRgb(color[50]),
          [`--${name}-100`]: hexToRgb(color[100]),
          [`--${name}-200`]: hexToRgb(color[200]),
          [`--${name}-300`]: hexToRgb(color[300]),
          [`--${name}-400`]: hexToRgb(color[400]),
          [`--${name}-500`]: hexToRgb(color[500]),
          [`--${name}-600`]: hexToRgb(color[600]),
          [`--${name}-700`]: hexToRgb(color[700]),
          [`--${name}-800`]: hexToRgb(color[800]),
          [`--${name}-900`]: hexToRgb(color[900]),
          [`--${name}-950`]: hexToRgb(color[950]),
          [`--${name}-DEFAULT`]: hexToRgb(color[500]),
        }
      }
    }
    const utilities = Object.fromEntries(options.names.map((k) => [k, utilityColor(k)]))
    return function ({ matchUtilities }) {
      matchUtilities(utilities, { values })
    }
  },
  function (options = { names: ["primary", "secondary"], colors }) {
    function themeColor(name) {
      return {
        50: `rgb(var(--${name}-50) / <alpha-value>)`,
        100: `rgb(var(--${name}-100) / <alpha-value>)`,
        200: `rgb(var(--${name}-200) / <alpha-value>)`,
        300: `rgb(var(--${name}-300) / <alpha-value>)`,
        400: `rgb(var(--${name}-400) / <alpha-value>)`,
        500: `rgb(var(--${name}-500) / <alpha-value>)`,
        600: `rgb(var(--${name}-600) / <alpha-value>)`,
        700: `rgb(var(--${name}-700) / <alpha-value>)`,
        800: `rgb(var(--${name}-800) / <alpha-value>)`,
        900: `rgb(var(--${name}-900) / <alpha-value>)`,
        950: `rgb(var(--${name}-950) / <alpha-value>)`,
        DEFAULT: `rgb(var(--${name}-DEFAULT) / <alpha-value>)`,
      }
    }
    return {
      theme: {
        extend: {
          colors: Object.fromEntries(options.names.map((k) => [k, themeColor(k)])),
        },
      },
    }
  },
)
const pluginIcon = plugin.withOptions(
  // Usage:
  // <div class="i-lucide/accessibility"></div>
  // <div class="i-[lucide/accessibility]"></div>
  // Equivalent:
  // <div class="inline-block vertical-align-middle h-[1em] w-[1em] bg-current [mask:url(https://api.iconify.design/lucide/accessibility.svg)_0_0/100%_100%]"></div>
  // Reference:
  // https://icones.netlify.app/collection/lucide?s=accessibility
  function (options = { choices: [], style: "" }) {
    // const url = (path) => `https://api.iconify.design/${path}.svg`
    const values = {}
    const collections = {}
    options.choices.forEach((choice) => {
      const [collection, ...variants] = choice.split("+")
      collections[collection] = require(`@iconify/json/json/${collection}.json`)
      Object.keys(collections[collection].icons)
        .filter((icon) => !variants.length || variants.some((variant) => icon.startsWith(variant)))
        .forEach((icon) => (values[`${collection}/${icon}`] = `${collection}/${icon}`))
    })
    const url = (path) => {
      const [collection, icon] = path.split("/")
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">${options.style ? `<style>${options.style}</style>` : ""}${collections[collection].icons[icon].body}</svg>`
      const base64 = Buffer.from(svg).toString("base64")
      return `data:image/svg+xml;base64,${base64}`
    }
    return function ({ matchUtilities }) {
      matchUtilities(
        {
          i: (icon) => {
            return {
              mask: `url(${url(icon)}) 0 0/100% 100%`,
              background: "currentColor",
              display: "inline-block",
              "vertical-align": "middle",
              width: "1em",
              height: "1em",
            }
          },
        },
        {
          values,
          modifiers: true,
        },
      )
    }
  },
)
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./extension-chrome/index.html"],
  theme: {
    screens: {
      sm: "600px",
      md: "900px",
      lg: "1400px",
    },
  },
  plugins: [pluginIcon({ choices: ["lucide"], style: "* { stroke-width: 1.5px; }" })],
}
