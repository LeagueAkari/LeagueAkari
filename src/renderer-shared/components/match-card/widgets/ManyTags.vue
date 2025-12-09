<template>
  <div class="relative flex gap-1" ref="container">
    <div
      v-for="(tag, index) in tags"
      ref="tagsEl"
      :key="tag.label"
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
          class="shrink-0 dark:bg-white/10 bg-black/10 hover:dark:bg-white/20 hover:bg-black/20 transition-colors text-xs py-0.5 px-2 rounded-xl absolute left-0"
          :style="{ left: tagOverflowInfo.lastVisibleTagOffsetLeft + 'px' }"
        >
          +{{ tags.length - tagOverflowInfo.lastVisibleTagIndex }}
        </div>
      </template>
      <div class="flex gap-1">
        <div
          v-for="tag in tags.slice(tagOverflowInfo.lastVisibleTagIndex)"
          :key="tag.label"
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
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useResizeObserver } from '@vueuse/core'
import { NPopover } from 'naive-ui'
import { VNodeChild, h, shallowRef, useTemplateRef, watch } from 'vue'

import { usePlayerTags } from '../utils/tags'

const renderChild = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return h('span', { class: 'text-xs' }, node)
  }

  return { render: node }
}

const containerEl = useTemplateRef('container')
const tagsEl = useTemplateRef('tagsEl')

// bg-blue-800 bg-pink-700 bg-gray-700 bg-orange-800 bg-purple-800 bg-green-800 bg-violet-600

const as = useAppCommonStore()
const tags = usePlayerTags()

const updateOverflowTagInfo = () => {
  if (!containerEl.value || !tagsEl.value) {
    return {
      isOverflow: false,
      lastVisibleTagIndex: -1,
      lastVisibleTagOffsetLeft: 0
    }
  }

  const containerWidth = containerEl.value.getBoundingClientRect().width
  const gapSize = Number.parseFloat(getComputedStyle(containerEl.value).rowGap)

  let acc = 0
  let lastVisibleTagIndex = tagsEl.value.length - 1
  for (let i = 0; i < tagsEl.value.length; i++) {
    const tag = tagsEl.value[i]

    let toAdd = tag.getBoundingClientRect().width + (i !== tagsEl.value.length - 1 ? gapSize : 0)

    if (acc + toAdd > containerWidth) {
      lastVisibleTagIndex = i - 1
      break
    }

    acc += toAdd
  }

  return {
    isOverflow: lastVisibleTagIndex !== tagsEl.value.length - 1,
    lastVisibleTagIndex,
    lastVisibleTagOffsetLeft:
      lastVisibleTagIndex === -1 ? 0 : tagsEl.value[lastVisibleTagIndex].offsetLeft
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

useResizeObserver(() => containerEl.value, recalcOverflow)
useResizeObserver(() => tagsEl.value || [], recalcOverflow)

watch(() => as.settings.locale, recalcOverflow)
</script>

<style scoped>
@layer shortcuts {
  .tag {
    --at-apply: 'relative shrink-0 text-xs py-0.5 px-2 rounded-xl';
  }
}
</style>
