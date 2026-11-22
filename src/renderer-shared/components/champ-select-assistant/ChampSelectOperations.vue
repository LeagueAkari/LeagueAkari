<template>
  <SettingsSection v-if="!isCustomGame" :title="t('activity.champSelect.operations.title')">
    <SettingsRow :label="t('activity.champSelect.operations.dodge.label')">
      <NPopconfirm
        :disabled="isLoopingDodge"
        :negative-text="t('activity.champSelect.operations.dodge.negativeText')"
        :positive-text="t('activity.champSelect.operations.dodge.positiveText')"
        :negative-button-props="{ size: 'tiny' }"
        :positive-button-props="{ size: 'tiny', type: 'warning' }"
        @positive-click="dodgeLoop"
      >
        <template #trigger>
          <NButton size="small" type="primary" secondary :disabled="isLoopingDodge">
            {{ t('activity.champSelect.operations.dodge.button') }}
            <template v-if="iteration">({{ iteration >= 1000 ? '999+' : iteration }})</template>
          </NButton>
        </template>
        {{ t('activity.champSelect.operations.dodge.popconfirm') }}
      </NPopconfirm>
      <NButton
        v-if="isLoopingDodge"
        size="small"
        type="warning"
        secondary
        class="ml-2"
        @click="isLoopingDodge = false"
      >
        {{ t('activity.champSelect.operations.dodge.cancel') }}
      </NButton>
    </SettingsRow>

    <SettingsRow :label="t('activity.champSelect.operations.temporarilyDisabled.label')">
      <NSwitch
        :value="as2.temporarilyDisabled"
        @update:value="(val) => as.setTemporarilyDisabled(val)"
        size="small"
      />
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/settings-navigation/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/settings-navigation/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NPopconfirm, NSwitch } from 'naive-ui'
import { computed, ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()

const as = useInstance(AutoSelectRenderer)
const lc = useInstance(LeagueClientRenderer)

const isCustomGame = computed(() => {
  if (!lcs.gameflow.session) {
    return false
  }

  return lcs.gameflow.session.gameData.isCustomGame
})

const isLoopingDodge = ref(false)
const iteration = ref(0)
const DODGE_CONCURRENCY = 5 // Seana goes mad! stop her singing!

const dodgeLoop = async () => {
  isLoopingDodge.value = true
  iteration.value = 0

  const worker = async () => {
    while (isLoopingDodge.value) {
      if (!lcs.champSelect.session) {
        break
      }

      try {
        await lc.api.login.dodge()
      } catch (error) {
      } finally {
        iteration.value += 1
      }
    }
  }

  const workers = Array.from({ length: DODGE_CONCURRENCY }, () => worker())
  await Promise.all(workers)

  iteration.value = 0
}
</script>
