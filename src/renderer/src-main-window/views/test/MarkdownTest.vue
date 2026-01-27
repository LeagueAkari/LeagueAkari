<template>
  <div class="box-border flex h-full gap-4 p-4">
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="mb-2 text-sm font-bold text-black/60 dark:text-white/60">渲染结果</div>
      <NScrollbar class="flex-1 rounded-md border border-black/10 dark:border-white/10">
        <div class="markdown-container markdown-body p-4" v-html="renderedMarkdown"></div>
      </NScrollbar>
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="mb-2 text-sm font-bold text-black/60 dark:text-white/60">Markdown 输入</div>
      <NInput
        v-model:value="markdownText"
        type="textarea"
        placeholder="在此输入 Markdown 文本..."
        class="flex-1"
        :autosize="false"
        style="height: 100%"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NInput, NScrollbar } from 'naive-ui'
import { computed, ref } from 'vue'

import { DEFAULT_MARKDOWN } from './example-markdown'

const markdownText = ref(DEFAULT_MARKDOWN)

const renderedMarkdown = computed(() => {
  return markdownIt.render(markdownText.value)
})
</script>

<style scoped>
.markdown-container {
  user-select: text;
}

:deep(.n-input) {
  height: 100%;
}

:deep(.n-input__textarea-el) {
  height: 100% !important;
  resize: none;
}
</style>
