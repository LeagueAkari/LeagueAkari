<template>
  <div class="box-border flex h-full flex-col gap-4 p-4">
    <div class="flex shrink-0 items-center gap-4">
      <NButton
        type="primary"
        @click="handleForceUpdate"
        :loading="isUpdating"
        :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
      >
        强制触发自动更新
      </NButton>
      <NButton
        @click="handleCheckUpdates"
        :loading="sus.isCheckingUpdates"
        :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
      >
        刷新 Latest Release
      </NButton>
      <span class="text-sm text-black/60 dark:text-white/60">
        {{ releaseInfoStatus }}
      </span>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <div class="mb-2 flex items-center gap-4">
        <span class="text-sm font-bold text-black/60 dark:text-white/60">
          Self Update Release Info (JSON)
        </span>
        <NCheckbox v-model:checked="lineWrapping" size="small">自动换行</NCheckbox>
      </div>
      <NInput
        class="release-info-editor min-h-0 flex-1"
        type="textarea"
        :value="releaseInfoJson"
        :style="{ flex: 1, height: 0, borderRadius: '4px', overflow: 'hidden' }"
        :input-props="releaseInfoInputProps"
        readonly
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { NButton, NCheckbox, NInput } from 'naive-ui'
import { computed, ref } from 'vue'

const sus = useSelfUpdateStore()
const su = useInstance(SelfUpdateRenderer)

const isUpdating = ref(false)
const lineWrapping = ref(true)

const releaseInfoInputProps = computed(() => ({
  wrap: lineWrapping.value ? 'soft' : 'off'
}))

const releaseInfoJson = computed(() => {
  if (!sus.releaseInfo) {
    return '// 暂无 Self Update Release Info'
  }
  return JSON.stringify(sus.releaseInfo, null, 2)
})

const releaseInfoStatus = computed(() => {
  if (!sus.releaseInfo) {
    return '未获取到版本信息'
  }
  const r = sus.releaseInfo
  return `版本: ${r.version} | 当前: ${r.currentVersion} | 新版本: ${r.isNew ? '是' : '否'} | 支持更新: ${r.isUpdateSupported ? '是' : '否'}`
})

const handleForceUpdate = async () => {
  isUpdating.value = true
  try {
    await su.forceStartUpdate()
  } finally {
    isUpdating.value = false
  }
}

const handleCheckUpdates = () => su.checkUpdates()
</script>

<style scoped>
.release-info-editor :deep(.n-input-wrapper),
.release-info-editor :deep(.n-input__textarea),
.release-info-editor :deep(.n-input__textarea-el) {
  height: 100%;
}

.release-info-editor :deep(.n-input__textarea-el) {
  resize: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}
</style>
