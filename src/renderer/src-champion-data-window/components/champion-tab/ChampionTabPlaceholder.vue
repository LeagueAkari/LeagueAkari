<template>
  <div class="flex min-h-0 flex-1 items-center justify-center px-3 py-10">
    <div
      class="flex w-full max-w-md flex-col items-center text-center"
      role="status"
      :aria-busy="loading"
    >
      <ChampionIcon
        round
        :champion-id="championId"
        class="size-16 shrink-0 ring-2 ring-black/10 dark:ring-white/15"
      />

      <div class="mt-4 text-xl leading-7 font-bold wrap-break-word">
        {{ resources.champions.name(championId) }}
      </div>

      <div
        class="mt-4 flex items-center justify-center gap-2 text-xs leading-5 text-black/55 dark:text-white/55"
      >
        <NSpin v-if="loading" size="small" />
        <span>{{ description }}</span>
      </div>

      <div v-if="$slots.actions" class="mt-3 flex flex-wrap items-center justify-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { NSpin } from 'naive-ui'

defineProps<{
  championId: number
  description: string
  loading?: boolean
}>()

const resources = useAkariResourceProvider()
</script>
