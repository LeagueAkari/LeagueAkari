<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">(UNDER DEVELOPMENT) {{ t('LootTools.title') }}</span>
          </template>
          <div class="actions">
            <div class="actions__label">Target</div>
            <NRadioGroup :disabled="isLoading || !lcs.isConnected" v-model:value="target">
              <NRadio value="open-chests-1">Open Chests</NRadio>
              <NRadio value="disenchant-champions">Disenchant Champions</NRadio>
              <NRadio value="disenchant-skins">Disenchant Skins</NRadio>
            </NRadioGroup>
          </div>
          <div class="actions">
            <div class="actions__label">Actions</div>
            <NButton
              :disabled="isLoading || !lcs.isConnected"
              size="small"
              type="primary"
              secondary
              @click="craft"
            >
              Execute
            </NButton>
            <NButton
              v-show="isCrafting"
              size="small"
              type="warning"
              secondary
              @click="isCrafting = false"
            >
              Cancel
            </NButton>
            <NButton
              :disabled="isLoading || !lcs.isConnected"
              size="small"
              secondary
              @click="updatePlayerLootMap(true)"
            >
              Refresh
            </NButton>
          </div>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { PlayerLootMap } from '@shared/types/league-client/loot'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NDataTable, NRadio, NRadioGroup, NScrollbar, useMessage } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)
const as = useAppCommonStore()
const lcs = useLeagueClientStore()

const message = useMessage()

const target = ref('open-chests-1')
const isCrafting = ref(false)
const isLoading = ref(false)
const lootMap = shallowRef<PlayerLootMap>({})

const isActivated = useActivated()

const shouldReload = computed(() => {
  return isActivated.value && lcs.isConnected
})

// 对于一个可以分解的物品，如果这些标签存在，则不进行分解
const isDisenchantableTag = (tags: string) => {
  const NO_DISENCHANT_TAGS = ['prestige', 'nodisenchant']
  return !tags.split(',').some((tag) => NO_DISENCHANT_TAGS.includes(tag))
}

const chests = computed(() => {
  return Object.values(lootMap.value).filter((value) => value.type === 'CHEST')
})

const championRentals = computed(() => {
  return Object.values(lootMap.value).filter((value) => value.type === 'CHAMPION_RENTAL')
})

const updatePlayerLootMap = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.loot.getLootMap()
    lootMap.value = data || {}

    console.log(lootMap.value)

    if (manually) {
      message.success(() => t('LootTools.refreshSuccess'))
    }
  } catch (error: any) {
    message.warning(() => t('LootTools.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const craft = async () => {}

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

.actions {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 8px;

  .actions__label {
    color: rgb(0, 0, 0, 0.8);
    font-size: 12px;
    font-weight: bold;
    width: 80px;

    [data-theme='dark'] & {
      color: rgb(255, 255, 255, 0.8);
    }
  }
}
</style>
