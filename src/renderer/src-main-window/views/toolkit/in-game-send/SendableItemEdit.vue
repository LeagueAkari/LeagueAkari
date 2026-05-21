<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('title') }}</span>
    </template>
    <div class="flex h-150 border border-black/10 dark:border-[#fff1]">
      <div
        class="flex h-full w-50 shrink-0 flex-col border-r border-black/10 p-2 dark:border-[#fff1]"
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
          v-if="igs2.settings.sendableItems.length > 0"
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
          v-if="igs2.settings.sendableItems.length > 0"
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
              class="mx-1 mb-0.5 flex h-7 cursor-pointer items-center rounded px-2 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              :class="{
                'bg-black/10 dark:bg-white/10': item.id === activeItemId
              }"
            >
              <NEllipsis class="grow" :tooltip="{ placement: 'right' }">{{ item.name }}</NEllipsis>
              <div class="ml-auto flex items-center">
                <NPopover v-if="!item.isValid" placement="right">
                  <template #trigger>
                    <NIcon class="text-sm text-yellow-500 dark:text-yellow-400">
                      <Warning20FilledIcon />
                    </NIcon>
                  </template>
                  <div>
                    {{ t('errorTemplateInvalid') }}
                  </div>
                </NPopover>
                <NPopover v-else-if="executionErrors[item.id]" placement="right">
                  <template #trigger>
                    <NIcon class="text-sm text-yellow-500 dark:text-yellow-400">
                      <Warning20FilledIcon />
                    </NIcon>
                  </template>
                  <div :class="$style['error-message']">
                    <div :class="$style['error-title']">
                      {{ t('errorTemplateExecutionFailed') }}
                    </div>
                    <div :class="$style['error-divider']"></div>
                    <div :class="$style['error-content']">
                      {{ translateError(executionErrors[item.id]) }}
                    </div>
                  </div>
                </NPopover>
                <NPopover v-else-if="item.enabled" placement="right">
                  <template #trigger>
                    <NIcon class="text-sm text-green-500 dark:text-green-400">
                      <CheckmarkIcon />
                    </NIcon>
                  </template>
                  <div>
                    {{ t('itemEnabled') }}
                  </div>
                </NPopover>
              </div>
            </div>
          </template>
        </NVirtualList>
        <div v-else class="flex grow items-center justify-center">
          <div class="text-base text-black/60 dark:text-[#fff1]">
            {{ t('noSendableItem') }}
          </div>
        </div>
      </div>
      <div class="flex h-full grow flex-col p-2">
        <template v-if="currentItem">
          <div class="mb-4 flex items-center gap-2">
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
              class="flex h-7 grow cursor-pointer items-center gap-1 transition-colors hover:text-black dark:hover:text-white"
              @click="handleShowEditNameInput"
            >
              <NEllipsis
                class="overflow-hidden text-base font-bold text-ellipsis whitespace-nowrap text-black dark:text-white"
              >
                {{ currentItem.name }}
              </NEllipsis>
              <NIcon>
                <EditIcon />
              </NIcon>
            </div>
            <div class="flex items-center gap-2">
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
          <div class="mb-4 flex flex-col gap-3">
            <ControlItem :label="t('enabled.label')" :label-width="200">
              <NSwitch
                :value="currentItem.enabled"
                size="small"
                @update:value="
                  (value) => igs.updateSendableItem(currentItem!.id, { enabled: value })
                "
              />
            </ControlItem>
            <ControlItem
              :label="t('contentType.label')"
              :label-width="200"
              :label-description="t(`contentType.description.${currentItem.content.type}`)"
            >
              <NSelect
                style="width: 200px"
                :value="currentItem.content.type"
                :options="sendableItemTypeOptions"
                size="small"
                @update:value="handleSendableItemTypeChange"
              />
            </ControlItem>
            <ControlItem
              v-if="currentItem.content.type === 'template'"
              :label="t('template.label')"
              :label-width="200"
              :label-description="t('template.description')"
            >
              <NSelect
                size="small"
                style="width: 200px"
                :options="availableTemplates"
                :value="currentItem.content.templateId"
                @update:value="
                  (id) =>
                    igs.updateSendableItem(currentItem!.id, {
                      content: { type: 'template', templateId: id }
                    })
                "
              />
            </ControlItem>
            <ControlItem
              :label="t('sendShortcut.label')"
              :label-width="200"
              v-if="currentItem.content.type === 'plaintext'"
            >
              <ShortcutSelector
                :shortcut-id="currentItem.sendAllShortcut"
                :target-id="igs.getSendableItemShortcutTargetId(currentItem.id).all"
                @update:shortcut-id="
                  (id) => igs.updateSendableItem(currentItem!.id, { sendAllShortcut: id })
                "
              />
            </ControlItem>
            <ControlItem
              :label="t('sendAllShortcut.label')"
              :label-width="200"
              :label-description="t('sendAllShortcut.description')"
              v-if="currentItem.content.type === 'template'"
            >
              <ShortcutSelector
                :shortcut-id="currentItem.sendAllShortcut"
                :target-id="igs.getSendableItemShortcutTargetId(currentItem.id).all"
                @update:shortcut-id="
                  (id) => igs.updateSendableItem(currentItem!.id, { sendAllShortcut: id })
                "
              />
            </ControlItem>
            <ControlItem
              :label="t('sendAllyShortcut.label')"
              :label-width="200"
              :label-description="t('sendAllyShortcut.description')"
              v-if="currentItem.content.type === 'template'"
            >
              <ShortcutSelector
                :shortcut-id="currentItem.sendAllyShortcut"
                :target-id="igs.getSendableItemShortcutTargetId(currentItem.id).ally"
                @update:shortcut-id="
                  (id) => igs.updateSendableItem(currentItem!.id, { sendAllyShortcut: id })
                "
              />
            </ControlItem>
            <ControlItem
              :label="t('sendEnemyShortcut.label')"
              :label-width="200"
              :label-description="t('sendEnemyShortcut.description')"
              v-if="currentItem.content.type === 'template'"
            >
              <ShortcutSelector
                :shortcut-id="currentItem.sendEnemyShortcut"
                :target-id="igs.getSendableItemShortcutTargetId(currentItem.id).enemy"
                @update:shortcut-id="
                  (id) => igs.updateSendableItem(currentItem!.id, { sendEnemyShortcut: id })
                "
              />
            </ControlItem>
            <ControlItem
              :label="t('dryRun.label')"
              :label-width="200"
              :label-description="t('dryRun.description')"
              v-if="currentItem.content.type === 'template'"
            >
              <div class="flex items-center gap-1">
                <NButton
                  :disabled="!currentItem.content.templateId"
                  secondary
                  size="tiny"
                  @click="handleDryRun(currentItem.id, currentItem.content.templateId!, 'all')"
                >
                  {{ t('dryRun.all') }}
                </NButton>
                <NButton
                  :disabled="!currentItem.content.templateId"
                  secondary
                  size="tiny"
                  @click="handleDryRun(currentItem.id, currentItem.content.templateId!, 'ally')"
                >
                  {{ t('dryRun.ally') }}
                </NButton>
                <NButton
                  :disabled="!currentItem.content.templateId"
                  secondary
                  size="tiny"
                  @click="handleDryRun(currentItem.id, currentItem.content.templateId!, 'enemy')"
                >
                  {{ t('dryRun.enemy') }}
                </NButton>
              </div>
            </ControlItem>
          </div>
          <template v-if="currentItem.content.type === 'plaintext'">
            <div class="mb-1 flex items-center justify-end gap-2">
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
            </div>
            <Codemirror
              class="grow rounded border border-black/10 dark:border-[#fff1]"
              v-model="tempText"
              :style="{ flex: 1, height: 0, borderRadius: '2px', overflow: 'hidden' }"
              :autofocus="true"
              :indent-with-tab="true"
              :placeholder="t('plaintextPlaceholder')"
              :tab-size="2"
              :extensions="[as.colorTheme === 'dark' ? vscodeDark : vscodeLight]"
              @change="handleChange"
            />
          </template>
        </template>
        <template v-else>
          <div class="flex grow items-center justify-center">
            <div class="text-base text-black/60 dark:text-[#fff1]">
              {{ t('noSendableItemSelected') }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </NCard>
</template>

<script lang="tsx" setup>
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import {
  Add as AddIcon,
  Checkmark as CheckmarkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Undo as UndoIcon
} from '@vicons/carbon'
import { Warning20Filled as Warning20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  DialogReactive,
  NButton,
  NCard,
  NDropdown,
  NEllipsis,
  NIcon,
  NInput,
  NPopconfirm,
  NPopover,
  NScrollbar,
  NSelect,
  NSwitch,
  NVirtualList,
  useDialog,
  useMessage
} from 'naive-ui'
import { computed, nextTick, ref, shallowReactive, shallowRef, useTemplateRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

// 还是直接复制一份组件好用
const { t } = useTranslation('renderer', { keyPrefix: 'SendableItemEdit' })

const as = useAppCommonStore()
const igs2 = useInGameSendStore()
const igs = useInstance(InGameSendRenderer)

const TEMPLATE_ERROR_TYPES = [
  'not-an-object',
  'no-getMetadata',
  'no-metadata',
  'unsupported-version',
  'wrong-template-type',
  'no-getMessages'
] as const

const translateError = (error: string | null | undefined): string => {
  if (!error) return ''

  if (TEMPLATE_ERROR_TYPES.includes(error as any)) {
    return t(`templateErrorTypes.${error}`, { defaultValue: error })
  }

  return error
}

const message = useMessage()
const activeItemId = ref<string | null>(null)

const dropdownOptions = computed(() => [
  {
    label: t('sendableItemPresets.plaintext'),
    key: 'plaintext'
  },
  {
    label: t('sendableItemPresets.template'),
    key: 'template'
  }
])

const sendableItemTypeOptions = computed(() => [
  {
    label: t('sendableItemPresets.plaintext'),
    value: 'plaintext'
  },
  {
    label: t('sendableItemPresets.template'),
    value: 'template'
  }
])

const availableTemplates = computed(() => {
  return igs2.settings.templates.map((t) => ({
    label: t.name,
    value: t.id
  }))
})

const handleSendableItemTypeChange = (value: string) => {
  if (currentItem.value) {
    if (value === 'plaintext') {
      igs.updateSendableItem(currentItem.value.id, { content: { type: 'plaintext', content: '' } })
    } else if (value === 'template') {
      igs.updateSendableItem(currentItem.value.id, {
        content: { type: 'template', templateId: null }
      })
    }
  }
}

const handleDropdownSelect = async (key: string) => {
  if (key === 'plaintext') {
    const newItem = await igs.createSendableItem({
      content: {
        type: 'plaintext',
        content: ''
      }
    })

    if (newItem) {
      updateActiveItem(newItem.id)
    }
  } else if (key === 'template') {
    const newItem = await igs.createSendableItem({
      content: {
        type: 'template',
        templateId: null
      }
    })

    if (newItem) {
      updateActiveItem(newItem.id)
    }
  }
}

const isEditingName = ref(false)
const tempName = ref('')
const tempText = ref('')

const sendableItems = computed(() => {
  const validMap = new Map<string, boolean>()
  for (const template of igs2.settings.templates) {
    validMap.set(template.id, template.isValid)
  }

  return igs2.settings.sendableItems.map((item) => {
    let isValid = true
    if (item.content.type === 'template') {
      if (item.content.templateId) {
        isValid = validMap.get(item.content.templateId) ?? false
      } else {
        isValid = false
      }
    }

    return { ...item, isValid }
  })
})

const currentItem = computed(() => {
  return sendableItems.value.find((item) => item.id === activeItemId.value)
})

const changed = ref(false)
const filterText = ref('')
const filteredItems = computed(() => {
  return sendableItems.value.filter(
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
      tempText.value = item.content.type === 'plaintext' ? item.content.content : ''
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
    igs.updateSendableItem(currentItem.value.id, { name: tempName.value })
    isEditingName.value = false
  }
}

const handleRevert = () => {
  if (currentItem.value && currentItem.value.content.type === 'plaintext') {
    tempText.value = currentItem.value.content.content
    changed.value = false
  }
}

const handleSave = () => {
  if (currentItem.value && currentItem.value.content.type === 'plaintext') {
    igs.updateSendableItem(currentItem.value.id, {
      content: { type: 'plaintext', content: tempText.value }
    })
    message.success(() => t('saveSuccess', { name: currentItem.value!.name }))
  }
}

const handleChange = (_: string, __: any) => {
  changed.value = true
}

const handleDelete = () => {
  if (currentItem.value) {
    let name = currentItem.value.name
    igs.removeSendableItem(currentItem.value.id)
    message.success(() => t('deleteSuccess', { name }))
  }
}

watch(
  () => igs2.settings.sendableItems,
  (sendableItems) => {
    nextTick(() => {
      if (!currentItem.value && sendableItems.length > 0) {
        updateActiveItem(sendableItems[0].id)
      }
    })
  },
  { immediate: true }
)

const dialog = useDialog()
const dialogRef = shallowRef<DialogReactive>()

const executionErrors = shallowReactive<Record<string, string>>({})

igs.onTemplateExecutionFailed(({ templateId, error }) => {
  executionErrors[templateId] = error

  // 不会堆积太多
  for (const id of Object.keys(executionErrors)) {
    if (!sendableItems.value.find((item) => item.id === id)) {
      delete executionErrors[id]
    }
  }
})

igs.onTemplateExecutionSucceeded(({ templateId }) => {
  delete executionErrors[templateId]
})

const handleDryRun = async (id: string, templateId: string, target: 'ally' | 'enemy' | 'all') => {
  const result = await igs.getDryRunResult(templateId, target)

  if (result.error) {
    message.error(() => t('dryRunError'))
    executionErrors[id] = result.error

    return
  } else {
    delete executionErrors[id]
  }

  dialogRef.value?.destroy()
  dialogRef.value = dialog.create({
    type: 'info',
    title: t('dryRun.label'),
    content: () => (
      <NScrollbar style={{ maxHeight: '80vh' }}>
        {result.messages.length > 0 ? (
          <div style={{ userSelect: 'text' }}>
            {result.messages.map((line) => (
              <div>{line}</div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#fff8' }}>{`(${t('dryRunEmpty')})`}</div>
        )}
      </NScrollbar>
    )
  })
}
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
