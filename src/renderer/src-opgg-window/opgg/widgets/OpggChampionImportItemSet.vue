<template>
  <div class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]" v-if="champion && canAddItemSet">
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('OpggChampion.applyRunesText') }}
    </div>
    <div class="card-content">
      <div class="flex h-10 items-center justify-between">
        <span class="text-[13px]">{{ t('OpggChampion.applyRunes') }}</span>
        <div class="flex min-w-[76px] justify-center">
          <NButton
            size="tiny"
            type="primary"
            secondary
            @click="writeItemSets(champion, { position, mode, region, tier })"
            :disabled="lcs.connectionState !== 'connected'"
          >
            {{ t('OpggChampion.apply') }}
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from '../context'
import { hasItemsSets, useLoadout } from '../utils/loadout'

const { champion, mode, tier, region, position } = useOpgg()
const { writeItemSets } = useLoadout()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const canAddItemSet = computed(() => {
  return champion.value && hasItemsSets(champion.value)
})
</script>
