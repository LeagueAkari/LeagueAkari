<template>
  <NCard v-if="!isCustomGame" size="small">
    <div class="flex h-6 items-center not-last:mb-0.5" v-if="!isCustomGame">
      <span class="flex-1 text-xs text-black/70 dark:text-white/70">{{
        t('ChampSelectOperations.dodge.label')
      }}</span>
      <NPopconfirm
        :disabled="isLoopingDodge"
        :negative-text="t('ChampSelectOperations.dodge.negativeText')"
        :positive-text="t('ChampSelectOperations.dodge.positiveText')"
        :negative-button-props="{ size: 'tiny' }"
        :positive-button-props="{ size: 'tiny', type: 'warning' }"
        @positive-click="dodgeLoop"
      >
        <template #trigger>
          <NButton size="tiny" type="primary" secondary :disabled="isLoopingDodge">
            {{ t('ChampSelectOperations.dodge.button') }}
            <template v-if="iteration">({{ iteration >= 1000 ? '999+' : iteration }})</template>
          </NButton>
        </template>
        {{ t('ChampSelectOperations.dodge.popconfirm') }}
      </NPopconfirm>
      <NButton
        v-if="isLoopingDodge"
        size="tiny"
        type="warning"
        secondary
        @click="isLoopingDodge = false"
      >
        {{ t('ChampSelectOperations.dodge.cancel') }}
      </NButton>
    </div>

    <div class="flex h-6 items-center not-last:mb-0.5" v-if="!isCustomGame">
      <span class="flex-1 text-xs text-black/70 dark:text-white/70">{{
        t('ChampSelectOperations.temporarilyDisabled.label')
      }}</span>
      <NSwitch
        :value="as2.temporarilyDisabled"
        @update:value="(val) => as.setTemporarilyDisabled(val)"
        size="small"
      />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NPopconfirm, NSwitch } from 'naive-ui'
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
}
</script>

<style scoped></style>
