<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :closable="false"
    :close-on-esc="false"
    :mask-closable="false"
    :class="$style['declaration-modal']"
  >
    <template #footer>
      <NFlex justify="flex-end" align="center">
        <NButton
          @click="() => emits('confirm')"
          @click.right="handleRightClick"
          size="small"
          type="primary"
          :disabled="countdown > 0"
        >
          <template v-if="countdown > 0">
            <i18next :translation="`${t('DeclarationModal.ok')} (${countdown})`">
              <template #isFree>
                <span class="font-bold text-amber-200 dark:text-red-800">{{
                  t('DeclarationModal.isFree')
                }}</span>
              </template>
            </i18next>
          </template>
          <template v-else>
            <i18next :translation="$t('DeclarationModal.ok')">
              <template #isFree>
                <span class="font-bold text-amber-200 dark:text-red-800">{{
                  t('DeclarationModal.isFree')
                }}</span>
              </template>
            </i18next>
          </template>
        </NButton>
        <NButton @click="() => emits('exit')" size="small">
          {{ t('DeclarationModal.quit') }}
        </NButton>
      </NFlex>
    </template>
    <div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { markdownIt } from '@renderer-shared/utils/markdown'
import { randomTruncatedNormal } from '@shared/utils/random'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NFlex, NModal, NScrollbar } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const { t } = useTranslation()

const emits = defineEmits<{
  (e: 'confirm'): void
  (e: 'exit'): void
}>()

const markdownHtmlText = computed(() => {
  return markdownIt.render(t('DeclarationModal.newContent'))
})

const show = defineModel<boolean>('show', { default: false })

const countdown = ref(Math.floor(randomTruncatedNormal(10, 35)))

const { pause } = useIntervalFn(() => {
  countdown.value--
}, 1000)

const handle = watch(
  () => countdown.value,
  (newVal) => {
    if (newVal <= 0) {
      pause()
      handle()
    }
  }
)

let rightClickCount = 0
const { start, stop } = useTimeoutFn(() => {
  rightClickCount = 0
}, 500)

const handleRightClick = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  rightClickCount++

  if (rightClickCount >= 3) {
    emits('confirm')
    stop()
  } else {
    start()
  }
}
</script>

<style scoped>
.markdown-container {
  user-select: text;
  border-radius: 4px;
}
</style>

<style module>
.declaration-modal {
  min-width: 720px;
  max-width: 1106px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
