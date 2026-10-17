<template>
  <NPopover
    v-if="$slots.default"
    trigger="click"
    placement="bottom-end"
    :show="open"
    @update:show="open = $event"
  >
    <template #trigger>
      <NButton quaternary size="small" class="size-7! p-0!" :aria-label="label" :title="label">
        <NIcon :size="16"><Add /></NIcon>
      </NButton>
    </template>

    <slot :close="close" :select="select" />
  </NPopover>
  <NDropdown v-else trigger="click" placement="bottom-end" :options="menuOptions" @select="select">
    <NButton quaternary size="small" class="size-7! p-0!" :aria-label="label" :title="label">
      <NIcon :size="16"><Add /></NIcon>
    </NButton>
  </NDropdown>
</template>

<script setup lang="ts">
import Add from '@vicons/ionicons5/es/Add'
import { NButton, NDropdown, NIcon, NPopover } from 'naive-ui'
import { computed, h, ref } from 'vue'

import type { TabBarAddOption } from './tab-order'

const { options, label } = defineProps<{ options: TabBarAddOption[]; label: string }>()

defineSlots<{ default(props: { close: () => void; select: (id: string) => void }): unknown }>()

const emit = defineEmits<{ select: [id: string] }>()

const open = ref(false)

const close = () => {
  open.value = false
}

const select = (id: string) => {
  close()
  emit('select', id)
}

const menuOptions = computed(() =>
  options.map((option) => ({
    key: option.id,
    label: option.label,
    disabled: option.disabled,
    icon: option.icon ? () => h(NIcon, null, { default: () => h(option.icon!) }) : undefined
  }))
)
</script>
