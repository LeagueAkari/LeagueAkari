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
              : tagOverflowInfo.lastVisibleTagIndex),
        },
      ]"
      class="shrink-0 text-xs py-0.5 px-2 rounded-xl"
    >
      {{ tag.label }}
    </div>
    <div
      v-if="tagOverflowInfo.isOverflow"
      class="shrink-0 dark:bg-white/10 bg-black/10 hover:dark:bg-white/20 hover:bg-black/20 transition-colors text-xs py-0.5 px-2 rounded-xl absolute left-0"
      :style="{ left: tagOverflowInfo.lastVisibleTagOffsetLeft + 'px' }"
      :title="
        tags
          .slice(tagOverflowInfo.lastVisibleTagIndex)
          .map((tag) => tag.label)
          .join(', ')
      "
    >
      +{{ tags.length - tagOverflowInfo.lastVisibleTagIndex }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, useTemplateRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { usePlayerTags } from '../utils/tags'

const containerEl = useTemplateRef('container')
const tagsEl = useTemplateRef('tagsEl')

// bg-blue-800 bg-pink-700 bg-gray-700 bg-orange-800 bg-purple-800 bg-green-800 bg-violet-600

const tags = usePlayerTags()

const updateOverflowTagInfo = () => {
  if (!containerEl.value || !tagsEl.value) {
    return {
      isOverflow: false,
      lastVisibleTagIndex: -1,
      lastVisibleTagOffsetLeft: 0,
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
      lastVisibleTagIndex === -1 ? 0 : tagsEl.value[lastVisibleTagIndex].offsetLeft,
  }
}

const tagOverflowInfo = shallowRef({
  isOverflow: false,
  lastVisibleTagIndex: -1,
  lastVisibleTagOffsetLeft: 0,
})

const recalcOverflow = () => {
  tagOverflowInfo.value = updateOverflowTagInfo()
}

useResizeObserver(() => containerEl.value, recalcOverflow)
useResizeObserver(() => tagsEl.value || [], recalcOverflow)
</script>

<style scoped></style>
