<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ 'LOOT TOOLS' }}</span>
          </template>
          12
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { useActivated } from '@renderer-shared/compositions/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { PlayerLootMap } from '@shared/types/league-client/loot'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NDataTable, NScrollbar, useMessage } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const as = useAppCommonStore()
const lcs = useLeagueClientStore()

const message = useMessage()

const isLoading = ref(false)
const lootMap = shallowRef<PlayerLootMap>({})

const isActivated = useActivated()

const shouldReload = computed(() => {
  return isActivated.value && lcs.isConnected
})

const updatePlayerLootMap = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.loot.getLootMap()
    lootMap.value = data || {}

    if (manually) {
      message.success(() => t('LootTools.refreshSuccess'))
    }
  } catch (error: any) {
    message.warning(() => t('LootTools.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

lc.onLcuEventVue('/lol-loot/v1/player-loot-map', (event) => {
  lootMap.value = event.data || {}
})

watch(
  shouldReload,
  (newVal) => {
    if (newVal) {
      updatePlayerLootMap()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
@import '../toolkit-styles.css';
</style>
