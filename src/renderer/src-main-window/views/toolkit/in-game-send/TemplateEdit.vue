<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('title') }}</span>
    </template>

    <!-- 此 Modal 内部自行处理逻辑 -->
    <RemoteTemplatesModal v-model:show="showRemoteTemplatesModal" />

    <div class="mb-3 text-[13px] text-black/60 italic dark:text-[#fff8]" v-html="t('hint')" />
    <div class="flex h-[600px] border border-black/10 dark:border-[#fff1]">
      <div
        class="flex h-full w-[200px] shrink-0 flex-col border-r border-black/10 p-2 dark:border-[#fff1]"
      >
        <NDropdown
          trigger="click"
          placement="bottom-start"
          :options="dropdownOptions"
          size="small"
          :theme-overrides="{
            fontSizeSmall: '13px',
            optionHeightSmall: '26px'
          }"
          @select="handleDropdownSelect"
        >
          <NButton type="primary" secondary class="mb-2! self-start" size="small">
            <template #icon>
              <NIcon>
                <AddIcon />
              </NIcon>
            </template>
            {{ t('newButton') }}
          </NButton>
        </NDropdown>
        <NInput
          v-if="igs2.settings.templates.length > 0"
          v-model:value="filterText"
          :placeholder="t('filterPlaceholder')"
          class="mb-2"
          size="small"
          clearable
        >
          <template #prefix>
            <NIcon>
              <SearchIcon />
            </NIcon>
          </template>
        </NInput>
        <NVirtualList
          v-if="igs2.settings.templates.length > 0"
          class="grow rounded border border-black/10 pt-1 dark:border-[#fff1]"
          :padding-top="4"
          :item-size="30"
          key-field="id"
          :padding-bottom="4"
          :items="filteredItems"
        >
          <template #default="{ item }">
            <div
              @click="updateActiveItem(item.id)"
              class="mx-1 mb-0.5 flex h-7 cursor-pointer items-center rounded px-2 text-xs transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              :class="{
                'bg-black/10 dark:bg-white/10': item.id === activeItemId
              }"
            >
              <NEllipsis class="grow" :tooltip="{ placement: 'right' }">{{ item.name }}</NEllipsis>
              <NPopover v-if="!item.isValid" placement="right">
                <template #trigger>
                  <NIcon class="ml-auto text-sm text-yellow-500 dark:text-[#ffd900e0]">
                    <Warning20FilledIcon />
                  </NIcon>
                </template>
                <div :class="$style['error-message']">
                  <div :class="$style['error-title']">
                    {{ t('errorTitle') }}
                  </div>
                  <div :class="$style['error-divider']"></div>
                  <div :class="$style['error-content']">{{ translateError(item.error) }}</div>
                </div>
              </NPopover>
            </div>
          </template>
        </NVirtualList>
        <div v-else class="flex grow items-center justify-center">
          <div class="text-base text-black/60 dark:text-[#fff1]">
            {{ t('noTemplate') }}
          </div>
        </div>
      </div>
      <div class="flex h-full min-w-0 grow flex-col p-2">
        <template v-if="currentItem">
          <div class="mb-2 flex items-center gap-2">
            <NTag
              size="small"
              :type="currentItem.type !== 'unknown' ? 'info' : 'error'"
              :bordered="false"
            >
              {{ t(`templateTypes.${currentItem.type}`) }}
            </NTag>
            <NInput
              size="small"
              @blur="handleSaveName"
              @keydown.enter="handleSaveName"
              v-if="isEditingName"
              v-model:value="tempName"
              ref="nameInputEl"
            />
            <div
              v-else
              class="flex min-w-0 grow cursor-pointer items-center gap-1 transition-colors hover:text-black dark:hover:text-white"
              @click="handleShowEditNameInput"
            >
              <NEllipsis
                class="min-w-0 overflow-hidden text-base font-bold text-ellipsis whitespace-nowrap text-black dark:text-white"
              >
                {{ currentItem.name }}
              </NEllipsis>
              <NIcon>
                <EditIcon />
              </NIcon>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <NPopover>
                <template #trigger>
                  <NButton size="small" secondary @click="handleRevert" :disabled="!changed">
                    <template #icon>
                      <NIcon>
                        <UndoIcon />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div>{{ t('revertButton') }}</div>
              </NPopover>
              <NPopover>
                <template #trigger>
                  <NButton
                    type="primary"
                    size="small"
                    secondary
                    @click="handleSave"
                    :disabled="!changed"
                  >
                    <template #icon>
                      <NIcon>
                        <SaveIcon />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div>{{ t('saveButton') }}</div>
              </NPopover>
              <NPopconfirm
                @positive-click="handleDelete"
                :positive-button-props="{
                  size: 'tiny',
                  type: 'error'
                }"
                :negative-button-props="{
                  size: 'tiny'
                }"
              >
                <template #trigger>
                  <NButton size="small" secondary type="error">
                    <template #icon>
                      <NIcon>
                        <DeleteIcon />
                      </NIcon>
                    </template>
                  </NButton>
                </template>
                <div style="max-width: 260px">{{ t('deletePopconfirm') }}</div>
              </NPopconfirm>
            </div>
          </div>
          <Codemirror
            class="min-w-0 grow rounded border border-black/10 dark:border-[#fff1]"
            v-model="tempCode"
            :style="{ flex: 1, height: 0, borderRadius: '2px', overflow: 'hidden', minWidth: 0 }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="[as.colorTheme === 'dark' ? vscodeDark : vscodeLight, javascript()]"
            @change="handleChange"
          />
        </template>
        <template v-else>
          <div class="flex grow items-center justify-center">
            <div class="text-base text-black/60 dark:text-[#fff1]">
              {{ t('noTemplateSelected') }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </NCard>
</template>

<script lang="ts" setup>
import { javascript } from '@codemirror/lang-javascript'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Undo as UndoIcon
} from '@vicons/carbon'
import { Warning20Filled as Warning20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NDropdown,
  NEllipsis,
  NIcon,
  NInput,
  NPopconfirm,
  NPopover,
  NTag,
  NVirtualList,
  useMessage
} from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import RemoteTemplatesModal from './RemoteTemplatesModal.vue'

const { t } = useTranslation('renderer', { keyPrefix: 'TemplateEdit' })

const as = useAppCommonStore()

const igs2 = useInGameSendStore()
const igs = useInstance(InGameSendRenderer)

// TODO Merge
const TEMPLATE_ERROR_TYPES = [
  'not-an-object',
  'no-getMetadata',
  'no-metadata',
  'unsupported-version',
  'wrong-template-type',
  'no-getMessages'
] as const

const translateError = (error: string | null): string => {
  if (!error) return ''

  if (TEMPLATE_ERROR_TYPES.includes(error as any)) {
    return t(`templateErrorTypes.${error}`)
  }

  return error
}

const message = useMessage()
const activeItemId = ref<string | null>(null)

const dropdownOptions = computed(() => [
  {
    label: t('templatePresets.empty'),
    key: 'empty'
  },
  {
    label: t('templatePresets.ongoing-game'),
    key: 'ongoing-game-default'
  },
  {
    type: 'divider'
  },
  {
    label: t('templatePresets.remote'),
    key: 'remote'
  }
])

const handleDropdownSelect = async (key: string) => {
  if (key === 'empty') {
    const newItem = await igs.createTemplate()
    if (newItem) {
      updateActiveItem(newItem.id)
    }

    return
  }

  if (key === 'ongoing-game-default') {
    const item = await igs.createPresetTemplate(key)
    if (item) {
      updateActiveItem(item.id)
    }
  }

  if (key === 'remote') {
    showRemoteTemplatesModal.value = true
  }
}

const showRemoteTemplatesModal = ref(false)

const isEditingName = ref(false)
const tempName = ref('')
const tempCode = ref('') // for temporarily use

const currentItem = computed(() => {
  return igs2.settings.templates.find((item) => item.id === activeItemId.value)
})

const changed = ref(false)
const filterText = ref('')
const filteredItems = computed(() => {
  return igs2.settings.templates.filter(
    (item) => item.name.includes(filterText.value) || item.id.includes(filterText.value)
  )
})

const updateActiveItem = (id: string) => {
  activeItemId.value = id
}

watch(
  () => currentItem.value,
  (item) => {
    if (item) {
      tempCode.value = item.code
      isEditingName.value = false
      changed.value = false
    }
  },
  { immediate: true }
)

const nameInputEl = useTemplateRef('nameInputEl')
const handleShowEditNameInput = () => {
  if (currentItem.value) {
    isEditingName.value = true
    tempName.value = currentItem.value.name
    nextTick(() => {
      nameInputEl.value?.focus()
    })
  }
}

const handleSaveName = async () => {
  if (currentItem.value) {
    igs.updateTemplate(currentItem.value.id, { name: tempName.value })
    isEditingName.value = false
  }
}

const handleRevert = () => {
  if (currentItem.value) {
    tempCode.value = currentItem.value.code
    changed.value = false
  }
}

const handleSave = () => {
  if (currentItem.value) {
    igs.updateTemplate(currentItem.value.id, { code: tempCode.value })
    message.success(() => t('saveSuccess', { name: currentItem.value!.name }))
  }
}

const handleChange = (_: string, __: any) => {
  changed.value = true
}

const handleDelete = () => {
  if (currentItem.value) {
    let name = currentItem.value.name
    igs.removeTemplate(currentItem.value.id)
    message.success(() => t('deleteSuccess', { name }))
  }
}

watch(
  () => igs2.settings.templates,
  (templates) => {
    nextTick(() => {
      if (!currentItem.value && templates.length > 0) {
        updateActiveItem(igs2.settings.templates[0].id)
      }
    })
  },
  { immediate: true }
)
</script>

<style module>
.error-message {
  .error-title {
    font-size: 12px;
  }

  .error-divider {
    height: 1px;
    background-color: rgba(0, 0, 0, 0.1);
    margin: 8px 0;
  }

  [data-theme='dark'] & .error-divider {
    background-color: rgba(255, 255, 255, 0.133);
  }

  .error-content {
    font-size: 12px;
    white-space: pre-wrap;
  }
}
</style>
