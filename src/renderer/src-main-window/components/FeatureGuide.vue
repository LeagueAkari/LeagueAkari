<template>
  <NModal :mask-closable="false" transform-origin="center" size="small" v-model:show="show">
    <div
      class="flex h-100 w-137.5 overflow-hidden rounded bg-neutral-100 shadow-lg dark:bg-neutral-900"
    >
      <!-- left image  -->
      <div
        class="relative w-60! border-0 border-r border-solid border-r-black/10 bg-neutral-200 dark:border-r-white/10 dark:bg-neutral-800"
      >
        <NCarousel autoplay :show-arrow="currentItem.imageUrls.length > 1">
          <img
            v-for="url in currentItem.imageUrls || []"
            class="size-full object-contain"
            :src="url"
          />
        </NCarousel>
      </div>

      <!-- right text -->
      <div class="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-3">
        <div class="mb-4 truncate text-base font-bold text-black dark:text-white">
          {{ currentItem.title || '' }}
        </div>

        <NScrollbar class="flex-1">
          <div class="markdown-body" v-html="markdownIt.render(currentItem.description || '')" />
        </NScrollbar>

        <!-- buttons -->
        <div class="flex justify-end gap-1">
          <NButton :disabled="currentIndex === 0" size="small" @click="previous">{{
            $t('FeatureGuide.previous')
          }}</NButton>
          <NButton :disabled="currentIndex === items.length - 1" size="small" @click="next">{{
            $t('FeatureGuide.next')
          }}</NButton>
          <NButton size="small" @click="onConfirm">{{ $t('FeatureGuide.confirm') }}</NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NButton, NCarousel, NModal, NScrollbar } from 'naive-ui'
import { computed, ref } from 'vue'

const { items = [] } = defineProps<{
  items?: {
    title: string
    description: string
    imageUrls: string[]
  }[]
}>()

const emits = defineEmits<{
  confirm: []
}>()

const currentIndex = ref(0)
const show = defineModel<boolean>('show', { default: false })

const currentItem = computed(() => items[currentIndex.value])

const next = () => {
  if (currentIndex.value >= items.length - 1) {
    return
  }

  currentIndex.value++
}

const previous = () => {
  if (currentIndex.value <= 0) {
    return
  }

  currentIndex.value--
}

const onConfirm = () => {
  emits('confirm')
}
</script>
