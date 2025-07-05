<template>
  <NModal v-model:show="show" preset="card" :class="$style.modal">
    <template #header>
      <span class="header-title">{{ t('RemoteTemplatesModal.title') }}</span>
    </template>
    <NSpin :show="isLoadingTemplates">
      <NScrollbar style="max-height: 680px">
        <div class="templates" v-if="templates.length > 0">
          <div class="template" v-for="template in templates" :key="template.id">
            <div class="template-name">
              <NEllipsis style="flex: 1; width: 0">
                <span class="title">{{ template.name }}</span>
              </NEllipsis>
              <NButton
                class="download-button"
                tertiary
                size="tiny"
                @click="downloadTemplate(template.id)"
                :disabled="currentDownloading !== null && currentDownloading !== template.id"
                :loading="currentDownloading === template.id"
              >
                <template #icon>
                  <NIcon class="download-icon">
                    <DownloadIcon />
                  </NIcon>
                </template>
              </NButton>
            </div>
            <NEllipsis :line-clamp="3" :tooltip="{ delay: 1000 }">
              <span v-if="template.description" class="template-description">{{
                template.description
              }}</span>
              <span v-else class="template-description empty">{{
                t('RemoteTemplatesModal.noTemplateDescription')
              }}</span>
            </NEllipsis>
          </div>
        </div>
        <div class="templates-placeholder" v-else>
          <span class="placeholder-text">{{ t('RemoteTemplatesModal.noTemplates') }}</span>
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

const { t } = useTranslation()

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
      t('RemoteTemplatesModal.downloadSuccess', {
        name: downloaded.name
      })
    )
  } catch (error: any) {
    message.error(() =>
      t('RemoteTemplatesModal.downloadFailed', {
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
    message.error(() => t('RemoteTemplatesModal.loadTemplatesFailed', { reason: error.message }))
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

<style scoped lang="less">
.templates {
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, 1fr);
}

.templates-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  border: 1px solid #fff1;
  border-radius: 4px;
  color: #fffa;
}

.templates .template {
  display: flex;
  gap: 4px;
  border: 1px solid #fff2;
  border-radius: 4px;
  flex-direction: column;
  padding: 8px;
  height: 112px;
  transition: border-color 0.2s ease-in-out;

  &:hover {
    border-color: #fff4;
  }

  .template-name {
    display: flex;
    align-items: center;
    gap: 4px;

    .title {
      font-size: 14px;
      font-weight: bold;
      color: #fff;
    }

    .download-button {
      margin-left: auto;
    }

    .download-icon {
      color: #fffa;
    }
  }

  .template-description {
    font-size: 12px;
    color: #fffd;

    &.empty {
      color: #fffa;
      font-style: italic;
    }
  }
}
</style>

<style lang="less" module>
.modal {
  width: 800px;
}
</style>
