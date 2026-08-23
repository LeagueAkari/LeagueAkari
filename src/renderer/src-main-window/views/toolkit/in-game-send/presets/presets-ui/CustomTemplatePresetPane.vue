<template>
  <div class="custom-template-preset-pane h-140">
    <div v-if="items.length === 0" class="flex h-full items-center justify-center">
      <NEmpty :description="t('empty.description')">
        <template #icon>
          <NIcon><CodeIcon /></NIcon>
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
      class="custom-template-layout grid h-full grid-cols-[208px_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1"
    >
      <aside
        class="custom-template-sidebar flex min-h-0 min-w-0 flex-col overflow-hidden max-[760px]:max-h-55"
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

        <DragDropProvider :modifiers="dragModifiers" @drag-end="handleDragEnd">
          <div
            class="custom-template-list flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto pt-1.5 pb-0.5"
          >
            <SortablePresetListItem
              v-for="(item, index) of items"
              :id="item.id"
              :key="item.id"
              class="custom-template-list-item"
              :index="index"
              group="in-game-send-custom-template"
              type="in-game-send-custom-template-item"
              :title="item.title"
              :unnamed-label="t('unnamed')"
              :drag-label="t('dragHandle', { title: getDisplayTitle(item.title) })"
              :delete-label="t('delete')"
              :delete-confirm="t('deleteConfirm')"
              :active="item.id === selectedId"
              :dirty="item.id === selectedId && isDirty"
              :dirty-label="t('unsaved')"
              :error-summary="lastErrors[item.id] ? getErrorSummary(lastErrors[item.id]) : null"
              @select="handleSelect(item.id)"
              @delete="handleDelete(item.id)"
            />
          </div>
        </DragDropProvider>
      </aside>

      <section
        v-if="selectedItem && selectedDraft"
        class="flex min-h-0 min-w-0 flex-col gap-1.5 p-0"
      >
        <div class="grid h-7 flex-none grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div v-if="isEditingTitle" class="flex min-w-0 items-center gap-1.5">
            <span
              class="size-1.5 flex-none rounded-full transition-opacity"
              :class="isDirty ? 'bg-orange-500 opacity-100 dark:bg-orange-400' : 'opacity-0'"
              :title="isDirty ? t('unsaved') : undefined"
            >
              <span v-if="isDirty" class="sr-only">{{ t('unsaved') }}</span>
            </span>
            <NInput
              ref="titleInputRef"
              :value="selectedDraft.title"
              class="min-w-0 flex-1"
              size="small"
              :maxlength="titleMaxLength"
              clearable
              @update:value="handleTitleUpdate"
              @blur="finishTitleEdit"
              @keydown.enter="handleTitleInputEnter"
            />
          </div>
          <button
            v-else
            type="button"
            class="editor-title-display flex h-7 min-w-0 cursor-text items-center gap-1.5 border-0 bg-transparent p-0 text-left font-[inherit] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600/50"
            @click="startTitleEdit"
          >
            <span
              class="size-1.5 flex-none rounded-full transition-opacity"
              :class="isDirty ? 'bg-orange-500 opacity-100 dark:bg-orange-400' : 'opacity-0'"
              :title="isDirty ? t('unsaved') : undefined"
            >
              <span v-if="isDirty" class="sr-only">{{ t('unsaved') }}</span>
            </span>
            <span
              class="min-w-0 overflow-hidden text-[15px] leading-7 text-ellipsis whitespace-nowrap"
              :class="
                getTrimmedTitle(selectedDraft.title)
                  ? 'font-[650] text-black/82 dark:text-white/86'
                  : 'font-medium text-black/38 dark:text-white/38'
              "
            >
              {{ getDisplayTitle(selectedDraft.title) }}
            </span>
          </button>

          <div class="flex items-center gap-0.5">
            <NTooltip v-if="!isEditingTitle">
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  :aria-label="t('editTitle')"
                  @click="startTitleEdit"
                >
                  <template #icon>
                    <NIcon><EditIcon /></NIcon>
                  </template>
                </NButton>
              </template>
              {{ t('editTitle') }}
            </NTooltip>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="!currentModel"
                  :aria-label="t('expand')"
                  @click="isExpanded = true"
                >
                  <template #icon>
                    <NIcon><ExpandIcon /></NIcon>
                  </template>
                </NButton>
              </template>
              {{ t('expand') }}
            </NTooltip>
          </div>
        </div>

        <PresetSendControls
          class="flex-none"
          :preset="presetScope"
          :preset-label="getDisplayTitle(selectedItem.title)"
          :execution-disabled-reason="executionDisabledReason"
        />

        <div
          class="min-h-0 flex-1 overflow-hidden rounded-[5px] border border-black/10 dark:border-white/10"
        >
          <div v-if="isLoadingMonaco" class="flex h-full items-center justify-center">
            <NSpin size="small" />
          </div>
          <NAlert v-else-if="monacoLoadError" type="error" class="m-3">
            {{ t('editorLoadFailed', { reason: monacoLoadError }) }}
          </NAlert>
          <MonacoEditor
            v-else-if="currentModel && !isExpanded"
            :model="currentModel"
            :theme="monacoTheme"
            variant="javascript"
          />
        </div>

        <div class="flex flex-none flex-wrap items-center justify-between gap-2.5">
          <span
            class="shrink-0 text-xs [font-variant-numeric:tabular-nums]"
            :class="
              selectedDraft.code.length >= codeMaxLength
                ? 'text-orange-700/85 dark:text-orange-400/90'
                : 'text-black/45 dark:text-white/45'
            "
          >
            {{ selectedDraft.code.length }} / {{ codeMaxLength }}
          </span>

          <div class="flex flex-none items-center gap-1.5">
            <NButton size="small" :disabled="!isDirty" @click="handleRevert">
              <template #icon>
                <NIcon><UndoIcon /></NIcon>
              </template>
              {{ t('revert') }}
            </NButton>
            <NButton
              size="small"
              type="primary"
              secondary
              :loading="isSaving"
              :disabled="!isDirty"
              @click="handleSave"
            >
              <template #icon>
                <NIcon><SaveIcon /></NIcon>
              </template>
              {{ t('save') }}
            </NButton>
          </div>
        </div>

        <NAlert v-if="currentError" class="flex-none" type="error" :title="currentErrorTitle">
          <pre
            class="max-h-48 overflow-auto text-xs wrap-break-word whitespace-pre-wrap select-text"
            >{{ currentError.error }}</pre>
        </NAlert>

        <PreviewPanel class="flex-none" :preset="presetScope" />
      </section>
    </div>

    <NModal
      v-model:show="showRiskNotice"
      preset="card"
      :title="t('risk.title')"
      :bordered="false"
      style="width: min(560px, calc(100vw - 48px))"
    >
      <div class="leading-6 text-black/72 dark:text-white/78">
        {{ t('risk.description') }}
      </div>
    </NModal>

    <NModal
      v-if="currentModel && selectedDraft"
      v-model:show="isExpanded"
      preset="card"
      :title="t('expandedTitle', { title: getDisplayTitle(selectedDraft.title) })"
      :bordered="false"
      style="width: calc(100vw - 48px); max-width: none"
    >
      <div class="flex h-[calc(100vh-132px)] min-h-0 flex-col gap-3">
        <div class="flex flex-wrap items-center justify-end gap-2">
          <span class="text-xs text-black/45 tabular-nums dark:text-white/45">
            {{ selectedDraft.code.length }} / {{ codeMaxLength }}
          </span>
          <NButton size="small" secondary :disabled="!isDirty" @click="handleRevert">
            {{ t('revert') }}
          </NButton>
          <NButton
            size="small"
            type="primary"
            :loading="isSaving"
            :disabled="!isDirty"
            @click="handleSave"
          >
            {{ t('save') }}
          </NButton>
        </div>
        <div
          class="min-h-0 flex-1 overflow-hidden rounded-[5px] border border-black/10 dark:border-white/10"
        >
          <MonacoEditor
            :model="currentModel"
            :theme="monacoTheme"
            variant="javascript"
            :use-shadow-dom="false"
          />
        </div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import {
  IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH,
  IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS,
  IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH,
  createDefaultInGameSendPresetTargetShortcuts,
  type InGameSendCustomTemplateItem,
  type InGameSendCustomTemplateLastError,
  type InGameSendPresetTarget
} from '@shared/shards/in-game-send'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/vue'
import { isSortable } from '@dnd-kit/vue/sortable'
import {
  Add24Regular as AddIcon,
  ArrowExpand24Regular as ExpandIcon,
  Code24Regular as CodeIcon,
  Edit24Regular as EditIcon,
  Save24Regular as SaveIcon,
  ArrowUndo24Regular as UndoIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import type { IDisposable, editor } from 'monaco-editor/editor/editor.api.js'
import {
  NAlert,
  NButton,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NSpin,
  NTooltip,
  useMessage
} from 'naive-ui'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch
} from 'vue'

import type { PresetScopeContext } from '../data/shared'
import { useCustomTemplatePreset } from '../data/custom-template'
import { loadJavaScriptMonaco, MonacoEditor, type MonacoApi } from '../monaco'
import type { PreviewedLines } from '../types'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'
import SortablePresetListItem from '../widgets/SortablePresetListItem.vue'

interface TemplateDraft {
  title: string
  code: string
}

const customTemplatePreset = useCustomTemplatePreset()
const appCommonStore = useAppCommonStore()
const logger = useInstance(LoggerRenderer)
const componentName = useComponentName()
const message = useMessage()
const { t } = useTranslation('renderer', {
  keyPrefix: 'toolkit.inGameSend.presets.customTemplate'
})

const maxItems = IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS
const titleMaxLength = IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH
const codeMaxLength = IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH
const dragModifiers = [RestrictToVerticalAxis]

const titleInputRef = ref<InstanceType<typeof NInput> | null>(null)
const selectedId = ref<string | null>(null)
const drafts = reactive<Record<string, TemplateDraft>>({})
const models = new Map<string, editor.ITextModel>()
const modelSubscriptions = new Map<string, IDisposable>()
const currentModel = shallowRef<editor.ITextModel | null>(null)
const monacoApi = shallowRef<MonacoApi | null>(null)
const monacoLoadError = ref<string | null>(null)
const isLoadingMonaco = ref(false)
const isExpanded = ref(false)
const isCreating = ref(false)
const isSaving = ref(false)
const isEditingTitle = ref(false)
const showRiskNotice = ref(false)
const previewedLines = ref<PreviewedLines | null>(null)
const pendingTitleEditItemId = ref<string | null>(null)
const isDirty = ref(false)

const items = computed(() => customTemplatePreset.items.value)
const lastErrors = computed(() => customTemplatePreset.lastErrors.value)
const selectedItem = computed(
  () => items.value.find((item) => item.id === selectedId.value) ?? null
)
const selectedDraft = computed(() => (selectedId.value ? (drafts[selectedId.value] ?? null) : null))
const currentError = computed(() =>
  selectedId.value ? (lastErrors.value[selectedId.value] ?? null) : null
)
const canCreate = computed(() => items.value.length < maxItems)
const monacoTheme = computed<'vs' | 'vs-dark'>(() =>
  appCommonStore.colorTheme === 'dark' ? 'vs-dark' : 'vs'
)
const executionDisabledReason = computed(() => (isDirty.value ? t('disabled.saveFirst') : null))
const currentErrorTitle = computed(() => {
  if (!currentError.value) {
    return ''
  }

  return t('lastErrorTitle', {
    stage: t(`errorStage.${currentError.value.stage}`),
    target: t(`errorTarget.${currentError.value.target}`),
    time: new Date(currentError.value.occurredAt).toLocaleString()
  })
})

const shortcutTargetIds = reactive<Record<InGameSendPresetTarget, string>>({
  friendly: '',
  enemy: '',
  all: ''
})
const shortcuts = computed(
  () => selectedItem.value?.targetShortcuts ?? createDefaultInGameSendPresetTargetShortcuts()
)

const presetScope: PresetScopeContext = {
  shortcutTargetIds,
  shortcuts,
  gamePhase: customTemplatePreset.gamePhase,
  canSend: customTemplatePreset.canSend,
  previewedLines: computed(() => previewedLines.value),
  setShortcut: handleSetShortcut,
  send: handleSend,
  dryRun: handleDryRun,
  closePreview: () => {
    previewedLines.value = null
  }
}

watch(
  items,
  (currentItems) => {
    const currentIds = new Set(currentItems.map((item) => item.id))

    for (const item of currentItems) {
      drafts[item.id] ??= { title: item.title, code: item.code }
    }

    for (const id of Object.keys(drafts)) {
      if (!currentIds.has(id)) {
        disposeModel(id)
        delete drafts[id]
      }
    }

    if (currentItems.length === 0) {
      selectedId.value = null
    } else if (!selectedId.value || !currentIds.has(selectedId.value)) {
      selectedId.value = currentItems[0].id
    }
  },
  { immediate: true }
)

watch(
  () => selectedItem.value?.id,
  async (id) => {
    previewedLines.value = null
    isExpanded.value = false
    isEditingTitle.value = false
    isDirty.value = false
    currentModel.value = null

    if (!id || !selectedItem.value) {
      return
    }

    updateShortcutTargetIds(id)

    if (pendingTitleEditItemId.value === id) {
      pendingTitleEditItemId.value = null
      isEditingTitle.value = true
      await nextTick()
      titleInputRef.value?.focus()
    }

    const model = await ensureModel(selectedItem.value)
    if (selectedId.value === id) {
      currentModel.value = model
    }
  },
  { immediate: true }
)

function getTrimmedTitle(title: string) {
  return title.trim()
}

function getDisplayTitle(title: string) {
  return getTrimmedTitle(title) || t('unnamed')
}

function getErrorSummary(error: InGameSendCustomTemplateLastError) {
  return error.error.split('\n')[0]
}

function handleSelect(id: string) {
  if (id !== selectedId.value) {
    handleRevert()
    selectedId.value = id
  }
}

function updateShortcutTargetIds(id: string) {
  shortcutTargetIds.friendly = customTemplatePreset.getShortcutTargetId(id, 'friendly')
  shortcutTargetIds.enemy = customTemplatePreset.getShortcutTargetId(id, 'enemy')
  shortcutTargetIds.all = customTemplatePreset.getShortcutTargetId(id, 'all')
}

async function ensureMonaco() {
  if (monacoApi.value) {
    return monacoApi.value
  }

  isLoadingMonaco.value = true
  monacoLoadError.value = null
  try {
    monacoApi.value = await loadJavaScriptMonaco()
    return monacoApi.value
  } catch (error) {
    monacoLoadError.value = error instanceof Error ? error.message : String(error)
    logger.warn(componentName, 'Failed to load Monaco editor', error)
    return null
  } finally {
    isLoadingMonaco.value = false
  }
}

async function ensureModel(item: InGameSendCustomTemplateItem) {
  const existingModel = models.get(item.id)
  if (existingModel) {
    return existingModel
  }

  const monaco = await ensureMonaco()
  if (!monaco) {
    return null
  }

  const model = monaco.editor.createModel(
    drafts[item.id]?.code ?? item.code,
    'javascript',
    monaco.Uri.parse(`inmemory://league-akari/in-game-send-template/${item.id}.js`)
  )
  const subscription = model.onDidChangeContent(() => {
    const draft = drafts[item.id]
    if (!draft) {
      return
    }

    const value = model.getValue()
    if (value.length > codeMaxLength) {
      model.setValue(value.slice(0, codeMaxLength))
      return
    }

    draft.code = value
    isDirty.value = true
  })

  models.set(item.id, model)
  modelSubscriptions.set(item.id, subscription)
  return model
}

function disposeModel(id: string) {
  modelSubscriptions.get(id)?.dispose()
  modelSubscriptions.delete(id)
  models.get(id)?.dispose()
  models.delete(id)
}

function handleTitleUpdate(value: string) {
  if (selectedDraft.value) {
    selectedDraft.value.title = value.slice(0, titleMaxLength)
    isDirty.value = true
  }
}

async function startTitleEdit() {
  pendingTitleEditItemId.value = null
  isEditingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
}

function finishTitleEdit() {
  isEditingTitle.value = false
}

function handleTitleInputEnter(event: KeyboardEvent) {
  if (event.isComposing) {
    return
  }

  event.preventDefault()
  finishTitleEdit()
}

async function handleCreate() {
  if (!canCreate.value) {
    return
  }

  isCreating.value = true
  try {
    const item = await customTemplatePreset.createItem()
    handleRevert()
    drafts[item.id] = { title: item.title, code: item.code }
    pendingTitleEditItemId.value = item.id
    selectedId.value = item.id
  } catch (error) {
    logger.warn(componentName, 'Failed to create custom template', error)
    message.error(t('createFailed'))
  } finally {
    isCreating.value = false
  }
}

async function handleSave() {
  if (!selectedItem.value || !selectedDraft.value || !isDirty.value) {
    return
  }

  isSaving.value = true
  try {
    await customTemplatePreset.updateItem(selectedItem.value.id, {
      title: selectedDraft.value.title,
      code: selectedDraft.value.code
    })
    isDirty.value = false
    isEditingTitle.value = false
    message.success(t('saved'))
  } catch (error) {
    logger.warn(componentName, 'Failed to save custom template', error)
    message.error(t('saveFailed'))
  } finally {
    isSaving.value = false
  }
}

function handleRevert() {
  if (!selectedItem.value || !selectedDraft.value) {
    return
  }

  if (isDirty.value) {
    selectedDraft.value.title = selectedItem.value.title
    selectedDraft.value.code = selectedItem.value.code
    currentModel.value?.setValue(selectedItem.value.code)
  }
  isDirty.value = false
  isEditingTitle.value = false
}

async function handleDelete(id: string) {
  const index = items.value.findIndex((item) => item.id === id)
  const remaining = items.value.filter((item) => item.id !== id)
  const nextSelectedId = remaining[Math.min(index, remaining.length - 1)]?.id ?? null

  try {
    await customTemplatePreset.deleteItem(id)
    if (selectedId.value === id) {
      selectedId.value = nextSelectedId
    }
    message.success(t('deleted'))
  } catch (error) {
    logger.warn(componentName, 'Failed to delete custom template', error)
    message.error(t('deleteFailed'))
  } finally {
    if (pendingTitleEditItemId.value === id) {
      pendingTitleEditItemId.value = null
    }
  }
}

async function handleDragEnd(event: DragEndEvent) {
  const { source } = event.operation

  if (event.canceled || !isSortable(source)) {
    return
  }

  const id = String(source.id)
  const currentIndex = items.value.findIndex((item) => item.id === id)
  const targetIndex = Math.min(Math.max(source.index, 0), items.value.length - 1)

  if (currentIndex === -1 || currentIndex === targetIndex) {
    return
  }

  try {
    await customTemplatePreset.reorderItem(id, targetIndex)
  } catch (error) {
    logger.warn(componentName, 'Failed to reorder custom template', error)
  }
}

async function handleSetShortcut(target: InGameSendPresetTarget, shortcutId: string | null) {
  if (!selectedItem.value) {
    return
  }

  try {
    await customTemplatePreset.updateItem(selectedItem.value.id, {
      targetShortcuts: { [target]: shortcutId }
    })
  } catch (error) {
    logger.warn(componentName, 'Failed to update custom template shortcut', error)
    message.error(t('saveFailed'))
  }
}

async function handleDryRun(target: InGameSendPresetTarget) {
  if (!selectedItem.value || isDirty.value) {
    return
  }

  try {
    const lines = await customTemplatePreset.generateLines(selectedItem.value.id, target)
    previewedLines.value = { targetId: target, createdAt: Date.now(), lines }
  } catch (error) {
    logger.warn(componentName, 'Custom template dry run failed', error)
    message.error(t('runFailed'))
  }
}

async function handleSend(target: InGameSendPresetTarget) {
  if (!selectedItem.value || isDirty.value) {
    return false
  }

  try {
    return await customTemplatePreset.send(selectedItem.value.id, target)
  } catch (error) {
    logger.warn(componentName, 'Custom template send failed', error)
    message.error(t('runFailed'))
    return false
  }
}

onMounted(() => {
  if (customTemplatePreset.riskNoticeShown.value) {
    return
  }

  showRiskNotice.value = true
  void customTemplatePreset.markRiskNoticeShown().catch((error) => {
    logger.warn(componentName, 'Failed to persist custom template risk notice state', error)
  })
})

onBeforeUnmount(() => {
  for (const id of models.keys()) {
    disposeModel(id)
  }
})
</script>
