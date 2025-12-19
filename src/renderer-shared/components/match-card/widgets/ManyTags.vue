<template>
  <div class="relative flex gap-1 overflow-hidden" ref="container">
    <div
      v-for="(tag, index) in tags"
      ref="tagsEl"
      :key="index"
      :class="[
        tag.color,
        tag.textColor,
        {
          invisible:
            index >
            (tagOverflowInfo.isOverflow
              ? tagOverflowInfo.lastVisibleTagIndex - 1
              : tagOverflowInfo.lastVisibleTagIndex)
        }
      ]"
      class="tag"
      :data-tag-index="index"
    >
      <NPopover v-if="tag.content" :keep-alive-on-hover="false">
        <template #trigger>
          <div class="absolute inset-0 rounded-xl"></div>
        </template>
        <component :is="renderChild(tag.content)" />
      </NPopover>
      {{ tag.label }}
    </div>
    <NPopover v-if="tagOverflowInfo.isOverflow">
      <template #trigger>
        <div
          class="absolute left-0 shrink-0 rounded-xl bg-black/10 px-2 py-0.5 text-xs transition-colors hover:bg-black/20 dark:bg-white/10 hover:dark:bg-white/20"
          :style="{ left: tagOverflowInfo.lastVisibleTagOffsetLeft + 'px' }"
        >
          +{{ Math.min(tags.length - tagOverflowInfo.lastVisibleTagIndex, 99) }}
        </div>
      </template>
      <div class="flex gap-1">
        <div
          v-for="(tag, idx) in tags.slice(tagOverflowInfo.lastVisibleTagIndex)"
          :key="tagOverflowInfo.lastVisibleTagIndex + idx"
          :class="[tag.color, tag.textColor]"
          class="tag"
        >
          <NPopover v-if="tag.content" :keep-alive-on-hover="false">
            <template #trigger>
              <div class="absolute inset-0 rounded-xl"></div>
            </template>
            <component :is="renderChild(tag.content)" />
          </NPopover>
          {{ tag.label }}
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script lang="ts" setup>
import { useResizeObserver } from '@vueuse/core'
import { NPopover } from 'naive-ui'
import { VNodeChild, h, shallowRef, useTemplateRef } from 'vue'

import { usePlayerTags } from '../utils/tags'

const renderChild = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return h('span', { class: 'text-xs' }, node)
  }

  return { render: node }
}

const containerEl = useTemplateRef('container')
const tagsEl = useTemplateRef('tagsEl')

const tags = usePlayerTags()

const RESERVED_WIDTH = 40 // for +xx tags

const updateOverflowTagInfo = () => {
  if (!containerEl.value || !tagsEl.value || tagsEl.value.length === 0) {
    return {
      isOverflow: false,
      lastVisibleTagIndex: -1,
      lastVisibleTagOffsetLeft: 0
    }
  }

  const container = containerEl.value
  const els = tagsEl.value

  const cRect = container.getBoundingClientRect()
  const cLeft = cRect.left
  const cRight = cRect.right

  // 子像素rounding，解决刚好超一点点场景
  const EPS = 0.5

  const lastRect = els[els.length - 1].getBoundingClientRect()
  const isOverflow = lastRect.right > cRight + EPS

  if (!isOverflow) {
    const lastLeftRel = lastRect.left - cLeft
    return {
      isOverflow: false,
      lastVisibleTagIndex: els.length - 1,
      lastVisibleTagOffsetLeft: lastLeftRel
    }
  }

  let firstHiddenIndex = els.length - 1
  for (let i = 0; i < els.length; i++) {
    const r = els[i].getBoundingClientRect()
    const leftRel = r.left - cLeft

    if (leftRel + RESERVED_WIDTH > cRect.width + EPS) {
      firstHiddenIndex = i
      break
    }
  }

  const firstHiddenRect = els[firstHiddenIndex].getBoundingClientRect()
  const firstHiddenLeftRel = firstHiddenRect.left - cLeft

  return {
    isOverflow: true,
    lastVisibleTagIndex: firstHiddenIndex,
    lastVisibleTagOffsetLeft: firstHiddenLeftRel
  }
}

const tagOverflowInfo = shallowRef({
  isOverflow: false,
  lastVisibleTagIndex: -1,
  lastVisibleTagOffsetLeft: 0
})

const recalcOverflow = () => {
  tagOverflowInfo.value = updateOverflowTagInfo()
}

useResizeObserver(() => [containerEl.value, ...(tagsEl.value || [])], recalcOverflow)
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .tag {
    @apply relative shrink-0 rounded-xl px-2 py-0.5 text-xs;
  }
}
</style>
