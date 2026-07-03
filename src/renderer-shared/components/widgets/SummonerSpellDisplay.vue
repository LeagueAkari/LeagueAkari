<template>
  <NPopover
    v-if="spellDisplay"
    :delay="delay"
    :disabled="disablePopover"
    :keep-alive-on-hover="keepAliveOnHover"
  >
    <template #trigger>
      <LcuImage
        :src="spellDisplay.iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="spell"
      />
    </template>
    <div style="max-width: 240px">
      <div class="name">{{ spellDisplay.name }}</div>
      <div class="cooldown">
        {{
          t('gameAssets.summonerSpell.cooldown', {
            time: spellDisplay.cooldown
          })
        }}
      </div>
      <div class="level">
        {{
          t('gameAssets.summonerSpell.levelRequirement', {
            level: spellDisplay.summonerLevel
          })
        }}
      </div>
      <div class="description">{{ spellDisplay.description }}</div>
    </div>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { useGameResourceProvider } from '@renderer-shared/providers/game-resource'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import LcuImage from '../LcuImage.vue'

const {
  spellId,
  size = 20,
  delay = 50
} = defineProps<{
  disablePopover?: boolean
  spellId?: number
  size?: number
  keepAliveOnHover?: boolean
  delay?: number
}>()

const { t } = useTranslation()

const resources = useGameResourceProvider()
const spellDisplay = computed(() => {
  if (!spellId) {
    return null
  }

  return resources.summonerSpells.display(spellId)
})
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .cooldown,
  .description,
  .level {
    font-size: 12px;
  }

  .cooldown,
  .level {
    font-style: italic;
  }

  .level {
    margin-bottom: 2px;
  }

  .name {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 2px;
  }

  .spell {
    border-radius: 2px;
  }

  .empty {
    @apply rounded-xs bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
