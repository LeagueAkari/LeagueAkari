<template>
  <div class="box-border flex h-8 items-center gap-1 rounded bg-black/10 p-1 dark:bg-white/10">
    <div
      v-for="tab of tabs"
      :key="tab.value"
      :class="[selectedTab === tab.value ? tabClass.selected : tabClass.unselected]"
      class="flex h-full flex-1 cursor-pointer items-center justify-center rounded text-xs transition-colors"
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

const selectedTab = defineModel<number | string>('selectedTab', { required: false })

const handleTabClick = (tab: number | string) => {
  selectedTab.value = tab
}

const tabClass = useWinResultTabSwitchTheme(() => winResult)
</script>

<style scoped></style>
