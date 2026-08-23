<template>
  <div ref="containerRef" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import type { editor } from 'monaco-editor/editor/editor.api.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { loadMonaco } from './load-monaco'

const props = withDefaults(
  defineProps<{
    model: editor.ITextModel
    theme: 'vs' | 'vs-dark'
    variant: 'javascript' | 'plain-text'
    useShadowDom?: boolean
  }>(),
  {
    useShadowDom: true
  }
)

const emit = defineEmits<{
  blur: []
}>()

const containerRef = ref<HTMLElement | null>(null)
let editorInstance: editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  const monaco = await loadMonaco()
  if (!containerRef.value) {
    return
  }

  const plainTextOptions: editor.IStandaloneEditorConstructionOptions = {
    wordWrap: 'on',
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 8,
    lineNumbersMinChars: 3,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    parameterHints: { enabled: false },
    formatOnPaste: false,
    formatOnType: false,
    hover: { enabled: 'off' },
    links: false,
    codeLens: false,
    matchBrackets: 'never',
    occurrencesHighlight: 'off',
    selectionHighlight: false
  }

  const javascriptOptions: editor.IStandaloneEditorConstructionOptions = {
    wordWrap: 'off',
    folding: false,
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    parameterHints: { enabled: true },
    formatOnPaste: true,
    formatOnType: true
  }

  editorInstance = monaco.editor.create(containerRef.value, {
    model: props.model,
    theme: props.theme,
    automaticLayout: true,
    fontFamily: "Consolas, 'Cascadia Code', monospace",
    fontSize: 13,
    lineHeight: 20,
    tabSize: 2,
    insertSpaces: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    renderWhitespace: 'selection',
    fixedOverflowWidgets: true,
    useShadowDOM: props.useShadowDom,
    ...(props.variant === 'plain-text' ? plainTextOptions : javascriptOptions)
  })
  editorInstance.render(true)
  editorInstance.onDidBlurEditorWidget(() => emit('blur'))
})

watch(
  () => props.model,
  (model) => {
    editorInstance?.setModel(model)
    editorInstance?.render(true)
  }
)

watch(
  () => props.theme,
  async (theme) => {
    const monaco = await loadMonaco()
    monaco.editor.setTheme(theme)
  }
)

onBeforeUnmount(() => {
  editorInstance?.dispose()
  editorInstance = null
})
</script>

<style scoped>
.monaco-editor-container {
  height: 100%;
  min-height: 0;
  width: 100%;
}
</style>
