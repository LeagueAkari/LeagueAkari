<template>
  <AutomationStatusView :compact="compact" :items="automations" @select="handleNavigate" />
</template>

<script setup lang="ts">
import { useAkariNavigation } from '@renderer-shared/shards/akari-navigation'

import { navigateToSetting } from '@main-window/settings-navigation'

import AutomationStatusView from './AutomationStatusView.vue'
import { useEnabledAutomations } from './use-enabled-automations'

defineProps<{ compact: boolean }>()

const navigation = useAkariNavigation()
const automations = useEnabledAutomations()

const handleNavigate = (id: string) => {
  const automation = automations.value.find((item) => item.id === id)
  if (!automation) {
    return
  }

  void navigateToSetting(navigation, automation.targetId, automation.navigationOptions)
}
</script>
