<template>
  <SettingsSection v-if="champion?.itemSet" :title="t('opgg.champion.applyRunesText')">
    <div class="p-3">
      <div class="flex h-10 items-center justify-between">
        <span class="text-[13px]">{{ t('opgg.champion.applyRunes') }}</span>
        <div class="flex min-w-19 justify-center">
          <NButton
            size="tiny"
            type="primary"
            secondary
            @click="writeItemSets(champion.itemSet.recommendationId)"
            :disabled="!lcs.isConnected || isApplying || isLoading"
          >
            {{ t('opgg.champion.apply') }}
          </NButton>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'

import { useOpgg } from '../context'
import { useLoadout } from '../utils/loadout'

const { champion, isApplying, isLoading } = useOpgg()
const { writeItemSets } = useLoadout()
const { t } = useTranslation()
const lcs = useLeagueClientStore()
</script>
