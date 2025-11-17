import { defineConfig, presetWind4, transformerDirectives } from 'unocss'

export default defineConfig({
  transformers: [transformerDirectives()],
  presets: [
    presetWind4({
      dark: {
        dark: '[data-theme="dark"]',
        light: '[data-theme="light"]'
      },
      preflights: { reset: false } // 以 naive-ui 为准
    })
  ],
  outputToCssLayers: true
})
