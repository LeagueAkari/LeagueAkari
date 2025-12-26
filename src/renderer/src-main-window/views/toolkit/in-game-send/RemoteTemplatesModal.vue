<template>
  <NModal v-model:show="show" preset="card" :class="$style.modal">
    <template #header>
      <span class="header-title">{{ t('title') }}</span>
    </template>
    <NSpin :show="isLoadingTemplates">
      <NScrollbar style="max-height: 680px">
        <div v-if="templates.length > 0" class="grid grid-cols-3 gap-1">
          <div
            v-for="template in templates"
            :key="template.id"
            class="flex h-28 flex-col gap-1 rounded border border-black/10 p-2 transition-colors hover:border-black/20 dark:border-[#fff2] dark:hover:border-[#fff4]"
          >
            <div class="flex items-center gap-1">
              <NEllipsis style="flex: 1; width: 0">
                <span class="text-sm font-bold text-black dark:text-white">{{
                  template.name
                }}</span>
              </NEllipsis>
              <NButton
                class="ml-auto"
                tertiary
                size="tiny"
                @click="downloadTemplate(template.id)"
                :disabled="currentDownloading !== null && currentDownloading !== template.id"
                :loading="currentDownloading === template.id"
              >
                <template #icon>
                  <NIcon class="text-black/60 dark:text-[#fffa]">
                    <DownloadIcon />
                  </NIcon>
                </template>
              </NButton>
            </div>
            <NEllipsis :line-clamp="3" :tooltip="{ delay: 1000 }">
              <span v-if="template.description" class="text-xs text-black/80 dark:text-[#fffd]">{{
                template.description
              }}</span>
              <span v-else class="text-xs text-black/60 italic dark:text-[#fffa]">{{
                t('noTemplateDescription')
              }}</span>
            </NEllipsis>
          </div>
        </div>
        <div
          v-else
          class="flex h-[120px] items-center justify-center rounded border border-black/10 text-black/60 dark:border-[#fff1] dark:text-[#fffa]"
        >
          <span class="placeholder-text">{{ t('noTemplates') }}</span>
        </div>
      </NScrollbar>
    </NSpin>
  </NModal>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { InGameSendTemplateCatalog } from '@renderer-shared/shards/remote-config'
import { Download as DownloadIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NButton, NEllipsis, NIcon, NModal, NScrollbar, NSpin, useMessage } from 'naive-ui'
import { ref, watch } from 'vue'

const { t } = useTranslation('renderer', { keyPrefix: 'RemoteTemplatesModal' })

const igs = useInstance(InGameSendRenderer)

const show = defineModel<boolean>('show', { required: false, default: false })

const message = useMessage()

const currentDownloading = ref<string | null>(null)
const templates = ref<InGameSendTemplateCatalog['templates']>([])
const isLoadingTemplates = ref(false)

const downloadTemplate = async (id: string) => {
  try {
    currentDownloading.value = id
    const downloaded = await igs.downloadTemplateFromRemote(id)
    message.success(() =>
      t('downloadSuccess', {
        name: downloaded.name
      })
    )
  } catch (error: any) {
    message.error(() =>
      t('downloadFailed', {
        name: id,
        reason: error.message
      })
    )
  } finally {
    currentDownloading.value = null
  }
}

const updateTemplates = async () => {
  try {
    isLoadingTemplates.value = true
    const catalog = await igs.getInGameSendTemplateCatalog()
    templates.value = catalog.templates
  } catch (error: any) {
    message.error(() => t('loadTemplatesFailed', { reason: error.message }))
  } finally {
    isLoadingTemplates.value = false
  }
}

watch(
  () => show.value,
  (show) => {
    if (show) {
      updateTemplates()
    }
  },
  { immediate: true }
)
</script>

<style module>
.modal {
  width: 800px;
}
</style>
