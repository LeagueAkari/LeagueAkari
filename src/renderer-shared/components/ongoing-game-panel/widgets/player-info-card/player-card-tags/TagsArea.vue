<template>
  <div class="mb-1 flex flex-wrap gap-1">
    <template v-for="tag in playerCardTags" :key="tag.id">
      <NPopover
        v-if="tag.popover"
        :delay="tag.popover.delay ?? 50"
        :keep-alive-on-hover="tag.popover.keepAliveOnHover ?? false"
        :scrollable="tag.popover.scrollable ?? false"
        :style="{
          'max-height': tag.popover.maxHeight ? `${tag.popover.maxHeight}px` : undefined
        }"
      >
        <template #trigger>
          <component :is="renderVNode(tag.label)" />
        </template>
        <component :is="renderVNode(tag.popover.content)" />
      </NPopover>
      <component v-else :is="renderVNode(tag.label)" />
    </template>
  </div>
</template>

<script lang="tsx" setup>
import { NPopover } from 'naive-ui'
import { type VNode } from 'vue'

import { usePlayerCardTagContext } from './context'
import { usePlayerCardTags } from './use-tags'

const { puuid } = defineProps<{
  puuid: string
}>()

const renderVNode = (node: VNode) => () => node

const playerCardTagContext = usePlayerCardTagContext(puuid)
const playerCardTags = usePlayerCardTags(playerCardTagContext)
</script>
