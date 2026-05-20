import yaml from '@modyfi/vite-plugin-yaml'
import type { StorybookConfig } from '@storybook/vue3-vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import { mergeConfig } from 'vite'

const LC_CUSTOM_TAGS = new Set([
  'mainText',
  'stats',
  'active',
  'passive',
  'attention',
  'rarityMythic',
  'rarityLegendary',
  'rarityGeneric',
  'keywordStealth',
  'scaleArmor',
  'scaleMR',
  'scaleAD',
  'scaleAP',
  'feSteal',
  'flavorText',
  'rules',
  'status',
  'speed',
  'shield',
  'heang',
  'scaleMana',
  'scalemana',
  'magicDamage',
  'trueDamage',
  'physicalDamage',
  'ornnBonus',
  'buffedStat',
  'nerfedStat',
  'keywordMajor'
])

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: false
    }
  },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      plugins: [
        yaml(),
        vue({
          template: { compilerOptions: { isCustomElement: (tag) => LC_CUSTOM_TAGS.has(tag) } }
        }),
        tailwindcss(),
        vueJsx({})
      ],
      resolve: {
        alias: {
          '@main-window': resolve('src/renderer/src-main-window'),
          '@aux-window': resolve('src/renderer/src-aux-window'),
          '@opgg-window': resolve('src/renderer/src-opgg-window'),
          '@ongoing-game-window': resolve('src/renderer/src-ongoing-game-window'),
          '@cd-timer-window': resolve('src/renderer/src-cd-timer-window'),
          '@shared': resolve('src/shared'),
          '@renderer-shared': resolve('src/renderer-shared')
        }
      }
    })
  }
}

export default config
