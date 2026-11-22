<template>
  <SettingsRow :label="label" :label-description="description">
    <div class="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <span class="text-[13px] text-black/60 dark:text-white/60">{{ summary }}</span>
      <NButton text size="small" @click="navigateToTarget(targetId)">
        <span class="sr-only">{{ label }} · </span>
        {{ t('settings.navigation.goToSettings') }}
        <NIcon class="ml-1" :size="14" aria-hidden="true"><ChevronRight20Regular /></NIcon>
      </NButton>
    </div>
  </SettingsRow>
</template>

<script setup lang="ts">
import type { MainWindowTargetId } from '@renderer-shared/components/settings-navigation/targets'
import type { MainWindowTarget } from '@renderer-shared/components/settings-navigation/targets'
import { useNavigateToTarget } from '@renderer-shared/composables/useNavigateToTarget'
import SettingsRow from '@renderer-shared/components/settings-navigation/SettingsRow.vue'
import { ChevronRight20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  targetId: MainWindowTargetId
  label: string
  value: boolean | string
  description?: string
}>()

const { t } = useTranslation()
const navigateToTarget = useNavigateToTarget<MainWindowTarget>('main-window')

const summary = computed(() => {
  if (typeof props.value === 'boolean') {
    return t(props.value ? 'settings.navigation.enabled' : 'settings.navigation.disabled')
  }

  return props.value
})
</script>
