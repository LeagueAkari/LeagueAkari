<template>
  <NTooltip v-if="itemSet">
    <template #trigger>
      <span class="inline-flex">
        <NButton
          size="tiny"
          secondary
          :aria-label="t('opgg.champion.addItemSet')"
          :disabled="!lcs.isConnected || isApplying || isLoading || isDataStale"
          :loading="isApplying"
          @click="writeItemSets(itemSet.recommendationId)"
        >
          <template #icon><NIcon :component="Add" /></template>
          {{ t('opgg.champion.importItemSet') }}
        </NButton>
      </span>
    </template>
    {{ t(lcs.isConnected ? 'opgg.champion.addItemSet' : 'opgg.champion.connectToAddItemSet') }}
  </NTooltip>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import Add from '@vicons/ionicons5/es/Add'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from '../../context'
import { useLoadout } from '../../utils/loadout'

const { champion, isApplying, isLoading, isDataStale } = useOpgg()
const { writeItemSets } = useLoadout()
const { t } = useTranslation()
const lcs = useLeagueClientStore()
const itemSet = computed(() => {
  const details = champion.value

  return details && details.kind !== 'aram_mayhem' ? details.itemSet : null
})
</script>
