import { defineConfig, presetMini, transformerDirectives } from 'unocss'

export default defineConfig({
  transformers: [transformerDirectives()],
  presets: [
    presetMini({
      dark: {
        dark: '[data-theme="dark"]',
        light: '[data-theme="light"]'
      }
    })
  ]
})
