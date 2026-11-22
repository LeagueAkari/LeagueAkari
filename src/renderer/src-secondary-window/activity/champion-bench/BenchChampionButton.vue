<template>
  <button
    type="button"
    class="group relative flex size-(--bench-icon-size) shrink-0 cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--la-color-link) enabled:hover:brightness-110 disabled:cursor-not-allowed"
    :aria-label="label"
    :title="label"
    :disabled="champion.availability !== 'available'"
    @click="emit('choose', true)"
    @contextmenu.prevent="champion.availability === 'available' && emit('choose', false)"
  >
    <ChampionIcon
      :champion-id="champion.championId"
      class="box-border size-full rounded-sm border border-solid"
      :class="
        champion.availability === 'available'
          ? 'border-(--bench-border) group-hover:border-(--la-color-link)'
          : 'border-(--bench-border-muted) brightness-75 grayscale'
      "
    />
    <span
      v-if="champion.availability === 'locked'"
      class="pointer-events-none absolute -right-px -bottom-px flex size-3.5 items-center justify-center rounded-sm bg-(--la-card-muted-surface) text-(--la-color-text-primary)"
      aria-hidden="true"
    >
      <NIcon :size="10"><LockClosed /></NIcon>
    </span>
  </button>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { LockClosed } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'

import type { BenchChampionOption } from './types'

const { champion } = defineProps<{ champion: BenchChampionOption }>()
const emit = defineEmits<{ choose: [complete: boolean] }>()

const resources = useAkariResourceProvider()
const { t } = useTranslation()

const label = computed(() => {
  const name = resources.champions.name(champion.championId)
  if (champion.availability === 'available') {
    return name
  }

  return t(`activity.championBench.${champion.availability}`, { name })
})
</script>
