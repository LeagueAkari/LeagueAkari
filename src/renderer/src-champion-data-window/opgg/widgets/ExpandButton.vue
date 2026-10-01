<template>
  <NButton
    text
    size="tiny"
    class="shrink-0"
    :aria-expanded="expanded"
    :focusable="false"
    @click="expanded = !expanded"
  >
    <template #icon>
      <NIcon
        class="transition-transform duration-200 ease-out motion-reduce:transition-none"
        :class="{ 'rotate-180': expanded }"
      >
        <ChevronDown />
      </NIcon>
    </template>
    {{ label }}
  </NButton>
</template>

<script setup lang="ts">
import { ChevronDown } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'
import { computed } from 'vue'

const expanded = defineModel<boolean>('expanded', { required: true })
const { t } = useTranslation()

const label = computed(() => {
  if (expanded.value) {
    return t('opgg.champion.collapse')
  }

  return t('opgg.champion.expand')
})
</script>
