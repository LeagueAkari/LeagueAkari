<template>
  <NModal
    style="width: 300px"
    transform-origin="center"
    preset="card"
    v-model:show="isCloseConfirmationModelShow"
    :z-index="10000000"
  >
    <template #header>
      <span class="close-confirmation-header">{{ t('MainWindowCloseConfirmModal.title') }}</span>
    </template>
    <NRadioGroup v-model:value="closeStrategy" size="small">
      <div class="flex flex-col">
        <NRadio value="minimize-to-tray">{{
          t('MainWindowCloseConfirmModal.options.minimize-to-tray')
        }}</NRadio>
        <NRadio value="quit">{{ t('MainWindowCloseConfirmModal.options.quit') }}</NRadio>
      </div>
    </NRadioGroup>
    <div class="mt-3 flex items-center justify-between">
      <NCheckbox v-model:checked="isRememberCloseStrategy" class="mr-auto" size="small">
        {{ t('MainWindowCloseConfirmModal.remember') }}
      </NCheckbox>
      <div class="flex gap-1">
        <NButton style="font-size: 13px" size="small" @click="isCloseConfirmationModelShow = false">
          {{ t('MainWindowCloseConfirmModal.cancel') }}
        </NButton>
        <NButton style="font-size: 13px" size="small" type="primary" @click="handleReallyClose">
          {{ t('MainWindowCloseConfirmModal.ok') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { MainWindowCloseAction } from '@shared/shards/window-manager'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NModal, NRadio, NRadioGroup } from 'naive-ui'
import { ref, watch } from 'vue'

const { t } = useTranslation()

const wm = useInstance(WindowManagerRenderer)

const isCloseConfirmationModelShow = ref(false)
const closeStrategy = ref<MainWindowCloseAction>('minimize-to-tray')
const isRememberCloseStrategy = ref<boolean>(false)

wm.mainWindow.onAskClose(() => {
  isCloseConfirmationModelShow.value = true
})

const handleReallyClose = async () => {
  if (isRememberCloseStrategy.value) {
    await wm.mainWindow.setCloseAction(closeStrategy.value)
    await wm.mainWindow.close()
  } else {
    await wm.mainWindow.close(closeStrategy.value)
  }

  isCloseConfirmationModelShow.value = false
}

watch(
  () => isCloseConfirmationModelShow.value,
  (show) => {
    if (show) {
      closeStrategy.value = 'minimize-to-tray'
      isRememberCloseStrategy.value = false
    }
  }
)
</script>
