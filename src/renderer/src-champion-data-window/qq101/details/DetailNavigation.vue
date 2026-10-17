<template>
  <div v-if="entries.length > 1" class="rounded bg-black/5 px-2 py-1 dark:bg-white/5">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs opacity-70">{{ t('qq101.details.navigation') }}</span>
      <ExpandButton v-model:expanded="expanded" />
    </div>
    <NCollapseTransition :show="expanded">
      <nav :aria-label="t('qq101.details.navigation')" class="flex flex-wrap gap-1 py-1">
        <NButton
          v-for="entry in entries"
          :key="entry.key"
          size="tiny"
          quaternary
          @click="emit('navigate', entry.key)"
        >
          {{ entry.label }}
        </NButton>
      </nav>
    </NCollapseTransition>
  </div>
</template>
<script setup lang="ts">
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import { useTranslation } from 'i18next-vue'
import { NButton, NCollapseTransition } from 'naive-ui'
import { ref } from 'vue'

defineProps<{ entries: { key: string; label: string }[] }>()

const emit = defineEmits<{ navigate: [key: string] }>()

const expanded = ref(true)
const { t } = useTranslation()
</script>
