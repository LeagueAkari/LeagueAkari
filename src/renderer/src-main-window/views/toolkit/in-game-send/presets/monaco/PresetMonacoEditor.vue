<template>
  <div
    class="preset-monaco-editor min-h-0 overflow-hidden rounded-[5px] border border-black/10 dark:border-white/10"
  >
    <div v-if="isLoading" class="flex h-full items-center justify-center">
      <NSpin size="small" />
    </div>
    <NAlert v-else-if="loadError" type="error" class="m-3">
      {{ formatLoadError(loadError) }}
    </NAlert>
    <MonacoEditor
      v-else-if="currentModel && !expanded"
      :model="currentModel"
      :theme="theme"
      :variant="variant"
    />

    <NModal
      v-if="currentModel"
      v-model:show="expanded"
      preset="card"
      :title="expandedTitle"
      :bordered="false"
      style="width: calc(100vw - 48px); max-width: none"
    >
      <div class="flex h-[calc(100vh-132px)] min-h-0 flex-col gap-3">
        <div
          class="min-h-0 flex-1 overflow-hidden rounded-[5px] border border-black/10 dark:border-white/10"
        >
          <MonacoEditor
            :model="currentModel"
            :theme="theme"
            :variant="variant"
            :use-shadow-dom="false"
          />
        </div>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <span class="text-xs text-black/45 tabular-nums dark:text-white/45">
            {{ currentLength }} / {{ maxLength }}
          </span>
          <NButton size="small" secondary :disabled="!dirty" @click="emit('revert')">
            {{ revertLabel }}
          </NButton>
          <NButton
            size="small"
            type="primary"
            :loading="saving"
            :disabled="!dirty"
            @click="emit('save')"
          >
            {{ saveLabel }}
          </NButton>
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
import type { IDisposable, editor } from 'monaco-editor/editor/editor.api.js'
import { NAlert, NButton, NModal, NSpin } from 'naive-ui'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import MonacoEditor from './MonacoEditor.vue'
import { loadJavaScriptMonaco, loadMonaco, type MonacoApi } from './load-monaco'

const props = defineProps<{
  modelKey: string
  initialValue: string
  modelUri: string
  variant: 'javascript' | 'plain-text'
  maxLength: number
  expandedTitle: string
  dirty: boolean
  saving: boolean
  revertLabel: string
  saveLabel: string
  formatLoadError: (reason: string) => string
}>()

const emit = defineEmits<{
  change: [length: number]
  ready: [value: boolean]
  revert: []
  save: []
}>()

const expanded = defineModel<boolean>('expanded', { default: false })

const appCommonStore = useAppCommonStore()
const logger = useInstance(LoggerRenderer)
const componentName = useComponentName()

const currentModel = shallowRef<editor.ITextModel | null>(null)
const currentLength = ref(props.initialValue.length)
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const theme = computed<'vs' | 'vs-dark'>(() =>
  appCommonStore.colorTheme === 'dark' ? 'vs-dark' : 'vs'
)

let monacoApi: MonacoApi | null = null
let modelSubscription: IDisposable | null = null
let loadGeneration = 0
let suppressModelChanges = false

watch(
  () => props.modelKey,
  async () => {
    const generation = ++loadGeneration
    expanded.value = false
    disposeModel()
    isLoading.value = true
    loadError.value = null

    try {
      monacoApi ??=
        props.variant === 'javascript' ? await loadJavaScriptMonaco() : await loadMonaco()

      if (generation !== loadGeneration) {
        return
      }

      const model = monacoApi.editor.createModel(
        props.initialValue,
        props.variant === 'javascript' ? 'javascript' : 'plaintext',
        monacoApi.Uri.parse(props.modelUri)
      )

      modelSubscription = model.onDidChangeContent(() => handleModelChange(model))
      currentModel.value = model
      currentLength.value = model.getValueLength()
      emit('ready', true)
    } catch (error) {
      if (generation !== loadGeneration) {
        return
      }

      loadError.value = error instanceof Error ? error.message : String(error)
      logger.warn(componentName, 'Failed to load Monaco editor', error)
    } finally {
      if (generation === loadGeneration) {
        isLoading.value = false
      }
    }
  },
  { immediate: true }
)

function handleModelChange(model: editor.ITextModel) {
  if (suppressModelChanges) {
    return
  }

  const length = model.getValueLength()
  if (length > props.maxLength) {
    const truncatedValue = model.getValue().slice(0, props.maxLength)
    replaceValue(truncatedValue)
    emit('change', truncatedValue.length)
    return
  }

  currentLength.value = length
  emit('change', length)
}

function getValue() {
  return currentModel.value?.getValue() ?? props.initialValue
}

function replaceValue(value: string) {
  if (!currentModel.value) {
    return
  }

  const nextValue = value.slice(0, props.maxLength)
  suppressModelChanges = true
  currentModel.value.setValue(nextValue)
  suppressModelChanges = false
  currentLength.value = nextValue.length
}

function disposeModel() {
  emit('ready', false)
  modelSubscription?.dispose()
  modelSubscription = null
  currentModel.value?.dispose()
  currentModel.value = null
}

defineExpose({ getValue, replaceValue })

onBeforeUnmount(() => {
  loadGeneration += 1
  disposeModel()
})
</script>
