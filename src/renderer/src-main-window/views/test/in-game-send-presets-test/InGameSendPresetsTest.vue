<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto max-w-[860px] p-6">
        <SettingsSection title="预设发送 (Demo)">
          <InGameSendPresetsPanel />

          <template #footer>
            <div class="flex flex-col gap-1">
              <div
                v-if="nativeInputUnavailableReason"
                class="text-yellow-700/80 dark:text-yellow-300/80"
              >
                当前「快捷键」不可用，{{ nativeInputUnavailableReason }}。
              </div>
              <div>
                如果设置了「快捷键」，则可在英雄选择 / 房间阶段发送在聊天中，
                或在游戏进行阶段且位于前台时以模拟键盘输入的方式发送在游戏中。
              </div>
              <div>Draft 模式仅支持试运行，不会发送到聊天或游戏。</div>
            </div>
          </template>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import InGameSendPresetsPanel from './InGameSendPresetsPanel.vue'

const as = useAppCommonStore()
const nativeInputUnavailableReason = computed(() => {
  if (as.nativeSupport.nativeInput.available) {
    return null
  }

  return as.nativeSupport.nativeInput.availableOnCurrentPlatform
    ? '请以管理员权限启动'
    : '当前平台不支持'
})
</script>
