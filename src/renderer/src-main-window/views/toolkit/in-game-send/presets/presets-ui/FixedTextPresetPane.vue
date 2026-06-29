<template>
  <div class="fixed-text-preset-pane min-h-130">
    <div v-if="items.length === 0" class="flex min-h-105 items-center justify-center">
      <NEmpty :description="t('empty.description')">
        <template #icon>
          <NIcon><DocumentTextIcon /></NIcon>
        </template>
        <template #extra>
          <NButton type="primary" :loading="isCreating" @click="handleCreate">
            <template #icon>
              <NIcon><AddIcon /></NIcon>
            </template>
            {{ t('empty.action') }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <div
      v-else
      class="fixed-text-layout grid min-h-140 grid-cols-[208px_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1"
    >
      <aside
        class="fixed-text-sidebar flex min-h-0 min-w-0 flex-col overflow-hidden max-[760px]:max-h-55"
      >
        <div class="box-border flex h-7 items-center justify-between gap-2 pl-2">
          <div
            class="flex min-w-0 items-baseline gap-1.5 text-xs leading-7 font-medium text-black/78 dark:text-white/84"
          >
            {{ t('listTitle') }}
          </div>
          <NTooltip :disabled="canCreate">
            <template #trigger>
              <span class="inline-flex">
                <NButton
                  size="tiny"
                  :disabled="!canCreate"
                  :loading="isCreating"
                  @click="handleCreate"
                >
                  <template #icon>
                    <NIcon><AddIcon /></NIcon>
                  </template>
                </NButton>
              </span>
            </template>
            {{ t('addLimitReached', { count: maxItems }) }}
          </NTooltip>
        </div>

        <div
          class="fixed-text-list flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto pt-1.5 pb-0.5"
        >
          <div
            v-for="item of items"
            :key="item.id"
            class="fixed-text-list-item group box-border flex min-h-8 w-full flex-none items-center justify-between gap-1.5 rounded-[5px] bg-transparent py-1 pr-0.5 pl-2 text-inherit transition-colors duration-150 hover:bg-black/10 dark:hover:bg-white/10"
            :class="item.id === selectedId ? 'active bg-black/10 dark:bg-white/10' : null"
            @mouseenter="handleItemMouseEnter(item.id)"
            @mouseleave="handleItemMouseLeave(item.id)"
          >
            <button
              type="button"
              class="item-main flex min-h-5.5 min-w-0 flex-1 cursor-pointer items-center justify-start border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600/50"
              @click="handleSelect(item.id)"
            >
              <span
                class="item-title overflow-hidden text-[13px] leading-5.5 font-normal text-ellipsis whitespace-nowrap"
                :class="
                  getTrimmedTitle(item.title)
                    ? 'text-black/82 dark:text-white/86'
                    : 'text-black/38 dark:text-white/38'
                "
              >
                {{ getDisplayTitle(item.title) }}
              </span>
            </button>

            <div class="flex h-5.5 w-20.5 flex-none items-center justify-end gap-0.5">
              <template v-if="shouldShowItemActions(item.id)">
                <NTooltip :keep-alive-on-hover="false">
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      :disabled="!canMoveItem(item.id, 'up')"
                      :aria-label="t('moveUp')"
                      @click.stop="handleMove(item.id, 'up')"
                    >
                      <template #icon>
                        <NIcon><ArrowUpIcon /></NIcon>
                      </template>
                    </NButton>
                  </template>
                  {{ t('moveUp') }}
                </NTooltip>

                <NTooltip :keep-alive-on-hover="false">
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      :disabled="!canMoveItem(item.id, 'down')"
                      :aria-label="t('moveDown')"
                      @click.stop="handleMove(item.id, 'down')"
                    >
                      <template #icon>
                        <NIcon><ArrowDownIcon /></NIcon>
                      </template>
                    </NButton>
                  </template>
                  {{ t('moveDown') }}
                </NTooltip>

                <NPopconfirm
                  :keep-alive-on-hover="false"
                  :show-icon="false"
                  :negative-button-props="{ size: 'tiny' }"
                  :positive-button-props="{ size: 'tiny' }"
                  @update:show="handleDeleteConfirmShowUpdate(item.id, $event)"
                  @positive-click="handleDelete(item.id)"
                >
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      class="text-inherit hover:text-red-500! dark:text-white/80 dark:hover:text-red-400!"
                      :aria-label="t('delete')"
                      @click.stop
                    >
                      <template #icon>
                        <NIcon><DeleteIcon /></NIcon>
                      </template>
                    </NButton>
                  </template>
                  {{ t('deleteConfirm') }}
                </NPopconfirm>
              </template>
            </div>
          </div>
        </div>
      </aside>

      <section v-if="selectedItem" class="flex min-h-0 min-w-0 flex-col gap-1.5 p-0">
        <div class="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <NInput
            v-if="isEditingTitle"
            ref="titleInputRef"
            v-model:value="draftTitle"
            size="small"
            :maxlength="titleMaxLength"
            clearable
            @blur="finishTitleEdit"
            @keydown.enter.prevent="finishTitleEdit"
          />
          <button
            v-else
            type="button"
            class="editor-title-display flex h-7 min-w-0 cursor-text items-center border-0 bg-transparent p-0 text-left font-[inherit] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600/50"
            @click="startTitleEdit"
          >
            <span
              class="min-w-0 overflow-hidden text-[15px] leading-7 text-ellipsis whitespace-nowrap"
              :class="
                getTrimmedTitle(draftTitle)
                  ? 'font-[650] text-black/82 dark:text-white/86'
                  : 'font-medium text-black/38 dark:text-white/38'
              "
            >
              {{ getDisplayTitle(draftTitle) }}
            </span>
          </button>

          <NTooltip v-if="!isEditingTitle">
            <template #trigger>
              <NButton size="tiny" quaternary :aria-label="t('editTitle')" @click="startTitleEdit">
                <template #icon>
                  <NIcon><EditIcon /></NIcon>
                </template>
              </NButton>
            </template>
            {{ t('editTitle') }}
          </NTooltip>
        </div>

        <SettingsRow
          :label="t('shortcutLabel')"
          :label-description="t('shortcutDescription')"
          :label-width="96"
          :gap="16"
          no-x-padding
        >
          <ShortcutSelector
            :shortcut-id="selectedItem.shortcut"
            :target-id="fixedTextPreset.getShortcutTargetId(selectedItem.id)"
            @update:shortcut-id="handleShortcutUpdate"
          />
        </SettingsRow>

        <Codemirror
          v-model="draftContent"
          class="fixed-text-codemirror min-h-60 flex-1 overflow-hidden rounded-[5px] border border-black/10 dark:border-white/10"
          :style="{ height: '100%' }"
          :indent-with-tab="false"
          :tab-size="2"
          :extensions="editorExtensions"
          @blur="handleAutoSave"
        />

        <div class="flex flex-wrap items-center justify-between gap-2.5">
          <span
            class="text-xs [font-variant-numeric:tabular-nums]"
            :class="
              draftContent.length >= contentMaxLength
                ? 'text-orange-700/85 dark:text-orange-400/90'
                : 'text-black/45 dark:text-white/45'
            "
          >
            {{ draftContent.length }} / {{ contentMaxLength }}
          </span>

          <div class="flex items-center gap-1.5">
            <NTooltip :disabled="!sendDisabledReason">
              <template #trigger>
                <span class="inline-flex">
                  <NButton
                    size="small"
                    type="primary"
                    :disabled="!!sendDisabledReason"
                    @click="handleSend"
                  >
                    <template #icon>
                      <NIcon><SendIcon /></NIcon>
                    </template>
                    {{ sendButtonText }}
                  </NButton>
                </span>
              </template>
              {{ sendDisabledReason }}
            </NTooltip>

            <NButton
              size="small"
              type="primary"
              secondary
              :loading="isSaving"
              :disabled="!isDirty"
              @click="handleSaveClick"
            >
              <template #icon>
                <NIcon><SaveIcon /></NIcon>
              </template>
              {{ t('save') }}
            </NButton>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorView } from '@codemirror/view'
import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH,
  IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS,
  IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH,
  type InGameSendFixedTextPresetItemMoveDirection
} from '@shared/shards/in-game-send'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import {
  Add24Regular as AddIcon,
  ArrowDown24Regular as ArrowDownIcon,
  ArrowUp24Regular as ArrowUpIcon,
  Delete24Regular as DeleteIcon,
  DocumentText24Regular as DocumentTextIcon,
  Edit24Regular as EditIcon,
  Save24Regular as SaveIcon,
  Send24Filled as SendIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NEmpty, NIcon, NInput, NPopconfirm, NTooltip, useMessage } from 'naive-ui'
import { computed, nextTick, ref, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import { useNativeInputStatus } from '../composables/useNativeInputStatus'
import { useFixedTextPreset } from '../data/fixed-text'

const fixedTextPreset = useFixedTextPreset()
const appCommonStore = useAppCommonStore()
const message = useMessage()
const { t } = useTranslation('renderer', { keyPrefix: 'toolkit.inGameSend.presets.fixedText' })
const { unavailableReason: nativeInputUnavailableMessage } = useNativeInputStatus()

const maxItems = IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS
const titleMaxLength = IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH
const contentMaxLength = IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH

const titleInputRef = ref<InstanceType<typeof NInput> | null>(null)
const selectedId = ref<string | null>(null)
const draftTitle = ref('')
const draftContent = ref('')
const isSaving = ref(false)
const isCreating = ref(false)
const isEditingTitle = ref(false)
const pendingTitleEditItemId = ref<string | null>(null)
const hoveredItemId = ref<string | null>(null)
const deleteConfirmItemId = ref<string | null>(null)

const items = computed(() => fixedTextPreset.items.value)
const selectedItem = computed(
  () => items.value.find((item) => item.id === selectedId.value) ?? null
)
const canCreate = computed(() => items.value.length < maxItems)

const editorExtensions = computed(() => [
  appCommonStore.colorTheme === 'dark' ? vscodeDark : vscodeLight,
  EditorView.lineWrapping
])

const isDirty = computed(() => {
  if (!selectedItem.value) {
    return false
  }

  return (
    draftTitle.value !== selectedItem.value.title ||
    draftContent.value !== selectedItem.value.content
  )
})

const sendButtonText = computed(() => {
  if (fixedTextPreset.gamePhase.value === 'in-game') {
    return t('sendToGame')
  }

  if (
    fixedTextPreset.gamePhase.value === 'lobby' ||
    fixedTextPreset.gamePhase.value === 'champ-select'
  ) {
    return t('sendToChat')
  }

  return t('send')
})

const sendDisabledReason = computed(() => {
  if (!selectedItem.value) {
    return t('disabled.noSelection')
  }

  if (isDirty.value) {
    return t('disabled.saveFirst')
  }

  if (fixedTextPreset.gamePhase.value === 'draft') {
    return t('disabled.draftOnly')
  }

  if (fixedTextPreset.gamePhase.value === 'in-game' && nativeInputUnavailableMessage.value) {
    return nativeInputUnavailableMessage.value
  }

  if (!fixedTextPreset.canSend.value) {
    return t('disabled.unavailable')
  }

  return null
})

watch(
  items,
  (currentItems) => {
    if (currentItems.length === 0) {
      selectedId.value = null
      return
    }

    if (!selectedId.value || !currentItems.some((item) => item.id === selectedId.value)) {
      selectedId.value = currentItems[0].id
    }
  },
  { immediate: true }
)

watch(
  () => selectedItem.value?.id,
  async (id) => {
    draftTitle.value = selectedItem.value?.title ?? ''
    draftContent.value = selectedItem.value?.content ?? ''

    if (id && pendingTitleEditItemId.value === id) {
      pendingTitleEditItemId.value = null
      isEditingTitle.value = true
      await nextTick()
      titleInputRef.value?.focus()
      return
    }

    isEditingTitle.value = false
  },
  { immediate: true }
)

watch(draftTitle, (value) => {
  if (value.length > titleMaxLength) {
    draftTitle.value = value.slice(0, titleMaxLength)
  }
})

watch(draftContent, (value) => {
  if (value.length > contentMaxLength) {
    draftContent.value = value.slice(0, contentMaxLength)
  }
})

function getTrimmedTitle(title: string) {
  return title.trim()
}

function getDisplayTitle(title: string) {
  return getTrimmedTitle(title) || t('unnamed')
}

function canMoveItem(id: string, direction: InGameSendFixedTextPresetItemMoveDirection) {
  const itemIndex = items.value.findIndex((item) => item.id === id)

  if (itemIndex === -1) {
    return false
  }

  return direction === 'up' ? itemIndex > 0 : itemIndex < items.value.length - 1
}

function shouldShowItemActions(id: string) {
  return hoveredItemId.value === id || deleteConfirmItemId.value === id
}

function handleItemMouseEnter(id: string) {
  hoveredItemId.value = id
}

function handleItemMouseLeave(id: string) {
  if (hoveredItemId.value === id) {
    hoveredItemId.value = null
  }
}

function handleDeleteConfirmShowUpdate(id: string, show: boolean) {
  deleteConfirmItemId.value = show ? id : null
}

async function saveCurrent(options: { silent?: boolean } = {}) {
  if (!selectedItem.value || !isDirty.value) {
    return true
  }

  if (isSaving.value) {
    return false
  }

  isSaving.value = true
  try {
    await fixedTextPreset.updateItem(selectedItem.value.id, {
      title: draftTitle.value.slice(0, titleMaxLength),
      content: draftContent.value.slice(0, contentMaxLength)
    })

    if (!options.silent) {
      message.success(t('saved'))
    }

    return true
  } catch (error) {
    message.error(t('saveFailed'))
    return false
  } finally {
    isSaving.value = false
  }
}

async function handleAutoSave() {
  await saveCurrent()
}

async function handleSaveClick() {
  if (await saveCurrent()) {
    isEditingTitle.value = false
  }
}

async function startTitleEdit() {
  pendingTitleEditItemId.value = null
  isEditingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
}

async function finishTitleEdit() {
  if (await saveCurrent()) {
    isEditingTitle.value = false
  }
}

async function handleSelect(id: string) {
  if (id === selectedId.value) {
    return
  }

  if (!(await saveCurrent())) {
    return
  }

  selectedId.value = id
}

async function handleCreate() {
  if (!canCreate.value) {
    return
  }

  if (!(await saveCurrent())) {
    return
  }

  isCreating.value = true
  try {
    const item = await fixedTextPreset.createItem()
    selectedId.value = item.id
    draftTitle.value = ''
    draftContent.value = ''
    pendingTitleEditItemId.value = item.id
    isEditingTitle.value = true
    await nextTick()
    titleInputRef.value?.focus()
  } catch (error) {
    message.error(t('createFailed'))
  } finally {
    isCreating.value = false
  }
}

async function handleDelete(id: string) {
  const deletedItem = items.value.find((item) => item.id === id)

  if (!deletedItem) {
    return
  }

  const currentItems = items.value
  const currentIndex = currentItems.findIndex((item) => item.id === id)
  const nextItems = currentItems.filter((item) => item.id !== id)
  const nextSelectedItem = nextItems[Math.min(currentIndex, nextItems.length - 1)] ?? null

  try {
    await fixedTextPreset.deleteItem(id)

    if (selectedId.value === id) {
      selectedId.value = nextSelectedItem?.id ?? null
      isEditingTitle.value = false
    }

    message.success(t('deleted'))
  } catch (error) {
    message.error(t('deleteFailed'))
  } finally {
    if (hoveredItemId.value === id) {
      hoveredItemId.value = null
    }

    if (deleteConfirmItemId.value === id) {
      deleteConfirmItemId.value = null
    }
  }
}

async function handleMove(id: string, direction: InGameSendFixedTextPresetItemMoveDirection) {
  if (!canMoveItem(id, direction)) {
    return
  }

  if (!(await saveCurrent())) {
    return
  }

  await fixedTextPreset.moveItem(id, direction)
}

async function handleShortcutUpdate(shortcutId: string | null) {
  if (!selectedItem.value) {
    return
  }

  try {
    await fixedTextPreset.setShortcut(selectedItem.value.id, shortcutId)
    message.success(t('saved'))
  } catch (error) {
    message.error(t('saveFailed'))
  }
}

async function handleSend() {
  if (!selectedItem.value || sendDisabledReason.value) {
    return
  }

  const sent = await fixedTextPreset.send(selectedItem.value.id)

  if (sent) {
    const title = getTrimmedTitle(selectedItem.value.title)
    message.success(title ? t('sendSucceededWithTitle', { title }) : t('sendSucceeded'))
  }
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.fixed-text-codemirror :deep(.cm-editor) {
  @apply h-full text-[13px];
}

.fixed-text-codemirror :deep(.cm-scroller) {
  @apply font-mono;
}
</style>
