<template>
  <NCard v-if="isCustomGame !== null" size="small">
    <NFlex align="center" v-if="!isCustomGame" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.dodge.label') }}</span>
      <NButton size="tiny" type="primary" secondary @click="dodgeLoop" :disabled="isLoopingDodge">
        {{ t('ChampSelectOperations.dodge.button') }}
        <template v-if="iteration">({{ iteration >= 1000 ? '999+' : iteration }})</template>
      </NButton>
      <NButton
        v-if="isLoopingDodge"
        size="tiny"
        type="warning"
        secondary
        @click="isLoopingDodge = false"
      >
        {{ t('ChampSelectOperations.dodge.cancel') }}
      </NButton>
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.autos.autoPick') }}</span>
      <NSwitch
        size="small"
        :value="as2.settings.normalModeEnabled"
        @update:value="(val) => as.setNormalModeEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="!isBenchMode" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.autos.autoBan') }}</span>
      <NSwitch
        size="small"
        :value="as2.settings.banEnabled"
        @update:value="(val) => as.setBanEnabled(val)"
      />
    </NFlex>
    <NFlex align="center" v-if="isBenchMode" class="control-item">
      <span class="label" style="flex: 1">{{ t('ChampSelectOperations.autos.autoGrab') }}</span>
      <NSwitch
        size="small"
        :value="as2.settings.benchModeEnabled"
        @update:value="(val) => as.setBenchModeEnabled(val)"
      />
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { isBenchEnabledSession } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NFlex, NSwitch } from 'naive-ui'
import { computed, ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()
const aps = useAppCommonStore()

const as = useInstance(AutoSelectRenderer)
const lc = useInstance(LeagueClientRenderer)

const isBenchMode = computed(() => isBenchEnabledSession(lcs.champSelect.session))

const isCustomGame = computed(() => {
  if (!lcs.gameflow.session) {
    return null
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

<style scoped>
.label {
  font-size: 12px;
  color: rgb(178, 178, 178);
}

.control-item {
  height: 24px;

  &:not(:last-child) {
    margin-bottom: 2px;
  }
}
</style>
