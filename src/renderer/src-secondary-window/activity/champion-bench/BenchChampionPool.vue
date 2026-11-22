<template>
  <Transition name="pool" @before-leave="disableLeavingPool">
    <div
      v-if="rows"
      class="bench-slots"
      :style="{ '--rows': rows, '--columns': columns }"
      role="group"
      :aria-label="t(personal ? 'activity.championBench.subset' : 'activity.championBench.bench')"
    >
      <span
        v-if="personal"
        class="bench-hand-mark"
        :title="t('activity.championBench.subset')"
        aria-hidden="true"
      >
        <NIcon :size="14"><AlbumsOutline /></NIcon>
      </span>

      <BenchChampionButton
        v-for="(champion, index) in champions"
        :key="index"
        :champion="champion"
        @choose="emit('select', champion.championId, $event)"
      />
      <template v-if="emptySlots">
        <span
          v-for="slot in columns"
          :key="`empty-${slot}`"
          class="box-border size-(--bench-icon-size) rounded-sm border border-solid border-black/10 bg-black/3 dark:border-white/10 dark:bg-white/3"
          aria-hidden="true"
        />
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { AlbumsOutline } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'

import BenchChampionButton from './BenchChampionButton.vue'
import type { BenchChampionOption } from './types'

const { champions, personal, emptySlots } = defineProps<{
  champions: readonly BenchChampionOption[]
  personal?: boolean
  emptySlots?: boolean
}>()

const emit = defineEmits<{ select: [championId: number, complete: boolean] }>()

const { t } = useTranslation()
const columns = 10
const rows = computed(() => (emptySlots ? 1 : Math.ceil(champions.length / columns)))

const disableLeavingPool = (element: Element) => {
  element.setAttribute('inert', '')
}
</script>

<style scoped>
.bench-slots {
  --gap: 0.25rem;
  position: relative;
  display: grid;
  align-content: start;
  grid-template-columns: repeat(var(--columns), var(--bench-icon-size));
  grid-auto-rows: var(--bench-icon-size);
  gap: var(--gap);
  height: calc(var(--rows) * (var(--bench-icon-size) + var(--gap)) - var(--gap));
}

.bench-hand-mark {
  position: absolute;
  left: calc(var(--bench-gutter) / -2);
  top: calc(var(--bench-icon-size) / 2);
  translate: -50% -50%;
  display: flex;
  padding-block: 2px;
  color: var(--la-color-link);
  background: var(--n-color);
}

.pool-enter-active,
.pool-leave-active {
  overflow-y: clip;
  transition:
    height 240ms cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 240ms ease-out;
}

.pool-enter-from,
.pool-leave-to {
  height: 0;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .pool-enter-active,
  .pool-leave-active {
    transition: none;
  }
}
</style>
