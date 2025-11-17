<template>
  <div class="box-border flex gap-1 items-center h-8 dark:bg-white/10 bg-black/10 rounded p-1">
    <div
      v-for="tab of tabs"
      :key="tab.value"
      :class="[selectedTab === tab.value ? tabClass.selected : tabClass.unselected]"
      class="h-full flex-1 rounded flex justify-center items-center text-xs cursor-pointer transition-colors"
      @click="handleTabClick(tab.value)"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useWinResultTabSwitchTheme } from '../utils/theme'

const { tabs = [], winResult } = defineProps<{
  tabs?: {
    label: string
    value: number | string
  }[]
  winResult?: string
}>()

const selectedTab = defineModel<number | string>('selectedTab', { required: false, default: 1 })

const handleTabClick = (tab: number | string) => {
  selectedTab.value = tab
}

const tabClass = useWinResultTabSwitchTheme(() => winResult)
</script>

<style scoped></style>
