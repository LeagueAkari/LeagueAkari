<template>
  <div class="copyable">
    <span class="copyable__text">
      <template v-if="slots.default"><slot></slot></template>
      <template v-else>{{ text }}</template>
    </span>
    <NIcon
      :style="{
        '--la-copyable-icon-size': iconSize + 'px'
      }"
      :title="t('sharedUi.copyableText.copy')"
      class="copyable__icon"
      @click.stop="handleCopy"
    >
      <DoneSharp v-if="copied" />
      <Copy24Regular v-else />
    </NIcon>
  </div>
</template>

<script setup lang="ts">
import { Copy24Regular } from '@vicons/fluent'
import { DoneSharp } from '@vicons/material'
import { useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { ref, useSlots } from 'vue'

const { text: propText, iconSize = 14 } = defineProps<{
  iconSize?: number
  text?: string | number
}>()

const { t } = useTranslation()

const emits = defineEmits<{
  copy: [text: string]
  error: [err: any]
}>()

const slots = useSlots()

const handleCopy = async () => {
  let text = ''
  if (slots.default) {
    if (propText) {
      text = propText.toString()
    } else {
      const nodes = slots.default({})
      if (nodes[0] && typeof nodes[0].children === 'string') {
        text = nodes[0].children
      }
    }
  } else {
    text = propText?.toString() || ''
  }

  try {
    await navigator.clipboard.writeText(text)

    copied.value = true
    start()

    emits('copy', text)
  } catch (error) {
    console.error(error)
    emits('error', error)
  }
}

const copied = ref(false)
const { start } = useTimeoutFn(() => {
  copied.value = false
}, 2000)
</script>

<style scoped>
.copyable__text {
  margin-right: 8px;
}

.copyable {
  display: flex;
  align-items: center;
}

.copyable__icon {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: var(--la-copyable-icon-size);
}

.copyable__icon:hover {
  cursor: pointer;
}
</style>
