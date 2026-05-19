import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@main-window': resolve('src/renderer/src-main-window'),
      '@aux-window': resolve('src/renderer/src-aux-window'),
      '@opgg-window': resolve('src/renderer/src-opgg-window'),
      '@ongoing-game-window': resolve('src/renderer/src-ongoing-game-window'),
      '@cd-timer-window': resolve('src/renderer/src-cd-timer-window'),
      '@shared': resolve('src/shared'),
      '@renderer-shared': resolve('src/renderer-shared'),
      '@main': resolve('src/main')
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
})
