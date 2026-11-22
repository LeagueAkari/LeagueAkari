<template>
  <AutomationStatusView :compact="compact" :items="automations" @select="handleNavigate" />
</template>

<script setup lang="ts">
import type { MainWindowTarget } from '@renderer-shared/components/settings-navigation/targets'
import { useNavigateToTarget } from '@renderer-shared/composables/useNavigateToTarget'

import AutomationStatusView from './AutomationStatusView.vue'
import { useEnabledAutomations } from './use-enabled-automations'

defineProps<{ compact: boolean }>()

const navigateToTarget = useNavigateToTarget<MainWindowTarget>('main-window')
const automations = useEnabledAutomations()

const handleNavigate = (id: string) => {
  const automation = automations.value.find((item) => item.id === id)
  if (!automation) {
    return
  }

  void navigateToTarget(automation.targetId, automation.navigationOptions)
}
</script>
