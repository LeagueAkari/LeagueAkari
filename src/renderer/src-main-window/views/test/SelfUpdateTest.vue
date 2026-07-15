<template>
  <div class="box-border flex h-full flex-col gap-4 p-4">
    <div class="flex shrink-0 items-center gap-4">
      <NButton type="primary" @click="handleForceUpdate" :loading="isUpdating">
        强制触发自动更新
      </NButton>
      <NButton @click="handleCheckUpdates" :loading="isChecking || aks.isUpdatingLatestRelease">
        刷新 Latest Release
      </NButton>
      <span class="text-sm text-black/60 dark:text-white/60">
        {{ latestReleaseStatus }}
      </span>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <div class="mb-2 flex items-center gap-4">
        <span class="text-sm font-bold text-black/60 dark:text-white/60">
          Latest Release (JSON)
        </span>
        <NCheckbox v-model:checked="lineWrapping" size="small">自动换行</NCheckbox>
      </div>
      <Codemirror
        class="min-h-0 flex-1 overflow-hidden rounded border border-black/10 dark:border-white/10"
        :model-value="latestReleaseJson"
        :style="{ flex: 1, height: 0, borderRadius: '4px', overflow: 'hidden' }"
        :autofocus="false"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        :disabled="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { javascript } from '@codemirror/lang-javascript'
import { EditorView } from '@codemirror/view'
import { useInstance } from '@renderer-shared/shards'
import { useAkariApiStore } from '@renderer-shared/shards/akari-api/store'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import { NButton, NCheckbox } from 'naive-ui'
import { computed, ref } from 'vue'
import { Codemirror } from 'vue-codemirror'

const as = useAppCommonStore()
const aks = useAkariApiStore()
const su = useInstance(SelfUpdateRenderer)

const isUpdating = ref(false)
const isChecking = ref(false)
const lineWrapping = ref(true)

const extensions = computed(() => {
  const exts = [
    as.colorTheme === 'dark' ? vscodeDark : vscodeLight,
    javascript(),
    EditorView.editable.of(false)
  ]
  if (lineWrapping.value) {
    exts.push(EditorView.lineWrapping)
  }
  return exts
})

const latestReleaseJson = computed(() => {
  if (!aks.latestRelease) {
    return '// 暂无 Latest Release 数据'
  }
  return JSON.stringify(aks.latestRelease, null, 2)
})

const latestReleaseStatus = computed(() => {
  if (!aks.latestRelease) {
    return '未获取到版本信息'
  }
  const r = aks.latestRelease
  return `版本: ${r.version} | 当前: ${r.currentVersion} | 新版本: ${r.isNew ? '是' : '否'}`
})

const handleForceUpdate = async () => {
  isUpdating.value = true
  try {
    await su.forceStartUpdate()
  } finally {
    isUpdating.value = false
  }
}

const handleCheckUpdates = async () => {
  isChecking.value = true
  try {
    await su.checkUpdates()
  } finally {
    isChecking.value = false
  }
}
</script>
