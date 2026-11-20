<template>
  <div v-if="visible">
    <NFlex align="center" class="min-h-6 not-last:mb-0.5">
      <div class="flex min-w-0 flex-1 items-center gap-1">
        <span class="text-xs text-gray-600 dark:text-gray-400">{{
          t('hextechAugment.showRatings')
        }}</span>
        <NPopover trigger="hover" :show-arrow="false" class="box-border w-56 max-w-[70vw]">
          <template #trigger>
            <NButton text size="tiny" :aria-label="t('hextechAugment.helpLabel')">
              <template #icon
                ><NIcon><HelpCircleOutline /></NIcon
              ></template>
            </NButton>
          </template>
          <div class="text-xs leading-relaxed">{{ t('hextechAugment.displayHelp') }}</div>
        </NPopover>
      </div>
      <NSwitch
        size="small"
        :value="store.settings.enabled"
        :loading="saving"
        :disabled="saving"
        :aria-label="t('hextechAugment.showRatings')"
        @update:value="setEnabled"
      />
    </NFlex>
    <NText v-if="error || store.error" type="error" class="mt-1 block text-xs">
      {{ error || store.error }}
    </NText>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { HelpCircleOutline } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NFlex, NIcon, NPopover, NSwitch, NText } from 'naive-ui'
import { computed, ref } from 'vue'

import { HextechAugmentRenderer } from './index'
import { useHextechAugmentStore } from './store'

const { t } = useTranslation()
const app = useAppCommonStore()
const leagueClient = useLeagueClientStore()
const store = useHextechAugmentStore()
const augment = useInstance(HextechAugmentRenderer)
const saving = ref(false)
const error = ref('')
const visible = computed(() => {
  const session = leagueClient.gameflow.session
  return (
    app.isWindows &&
    leagueClient.isConnected &&
    leagueClient.gameflow.phase !== 'WatchInProgress' &&
    !leagueClient.champSelect.session?.isSpectating &&
    (session?.gameData.queue.gameMode === 'KIWI' || session?.map.gameMode === 'KIWI')
  )
})

async function setEnabled(enabled: boolean) {
  saving.value = true
  error.value = ''
  try {
    await augment.setEnabled(enabled)
  } catch (caught) {
    error.value = String(caught)
  } finally {
    saving.value = false
  }
}
</script>
