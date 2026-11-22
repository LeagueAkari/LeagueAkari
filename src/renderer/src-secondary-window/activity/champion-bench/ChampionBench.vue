<template>
  <NCard class="bench-card" size="small" content-style="padding: 8px 12px">
    <div class="bench">
      <div class="bench-strip">
        <NSpin :show="selecting" :delay="200" :size="16" :aria-busy="selecting">
          <ChampionIcon
            :champion-id="currentChampionId ?? -1"
            class="box-border size-(--bench-icon-size) rounded-sm border border-solid"
            :class="
              currentChampionId ? 'border-(--la-color-link)' : 'border-(--bench-border-muted)'
            "
            role="img"
            :aria-label="t('activity.championBench.current')"
            :title="currentChampionId ? resources.champions.name(currentChampionId) : undefined"
          />
        </NSpin>

        <div class="bench-divider" aria-hidden="true" />

        <div
          class="flex min-w-0 flex-col motion-safe:transition-[row-gap] motion-safe:duration-240"
          :class="champions.length && subset.length ? 'gap-y-2' : 'gap-y-0'"
        >
          <BenchChampionPool
            personal
            :champions="subset"
            @select="(id, complete) => emit('select', id, complete)"
          />
          <BenchChampionPool
            :champions="champions"
            :empty-slots="!champions.length && !subset.length"
            @select="(id, complete) => emit('select', id, complete)"
          />
        </div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NCard, NSpin } from 'naive-ui'

import BenchChampionPool from './BenchChampionPool.vue'
import type { BenchChampionOption } from './types'

defineProps<{
  currentChampionId: number | null
  champions: readonly BenchChampionOption[]
  subset: readonly BenchChampionOption[]
  selecting?: boolean
}>()

const emit = defineEmits<{
  select: [championId: number, complete: boolean]
}>()

const { t } = useTranslation()
const resources = useAkariResourceProvider()
</script>

<style scoped>
.bench-card {
  /* Eleven 36px portraits, nine 4px gaps, a 24px divider column and the card padding/border. */
  max-width: 482px;
  margin-inline: auto;
}

.bench {
  container-type: inline-size;
}

.bench-strip {
  --bench-gutter: 1.5rem;
  --bench-border: rgb(var(--la-card-border-rgb) / 36%);
  --bench-border-muted: rgb(var(--la-card-border-rgb) / 20%);

  /* Eleven portraits share the space left after the divider and nine bench gaps. */
  --bench-icon-size: min(2.25rem, calc((100cqi - var(--bench-gutter) - 2.25rem) / 11));
  display: grid;
  grid-template-columns: var(--bench-icon-size) var(--bench-gutter) minmax(0, 1fr);
  align-items: start;
}

.bench-divider {
  place-self: stretch center;
  width: 1px;
  background: var(--n-border-color);
}
</style>
