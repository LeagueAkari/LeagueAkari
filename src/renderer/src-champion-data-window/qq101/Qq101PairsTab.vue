<template>
  <div class="flex min-h-0 flex-1 flex-col gap-1 px-2 pt-1 pb-2">
    <div class="flex flex-wrap gap-1">
      <Qq101ChampionSelect
        class="min-w-36 flex-1"
        :value="page.query.championId"
        :champion-ids="championIds"
        @update:value="changePairsQuery({ ...page.query, championId: $event })"
      />
      <Qq101RoleSelect
        class="min-w-28 flex-1"
        :value="page.query.firstRole"
        :aria-label="t('qq101.pairFirstRole')"
        @update:value="changePairsQuery({ ...page.query, firstRole: $event })"
      />
      <Qq101RoleSelect
        class="min-w-28 flex-1"
        :value="page.query.secondRole"
        :aria-label="t('qq101.pairSecondRole')"
        @update:value="changePairsQuery({ ...page.query, secondRole: $event })"
      />
    </div>
    <NAlert v-if="page.state.status === 'error'" type="warning"
      >{{ page.state.message.split('\n')[0] }}
      <NButton size="small" @click="changePairsQuery(page.query)">{{
        t('qq101.retry')
      }}</NButton></NAlert
    >
    <RankingTable
      v-else
      :rows="rows"
      mode="aram_mayhem"
      board="synergies"
      :loading="page.state.status === 'loading'"
      @champion="openChampion($event)"
    />
  </div>
</template>
<script setup lang="ts">
import Qq101ChampionSelect from './filters/Qq101ChampionSelect.vue'
import Qq101RoleSelect from './filters/Qq101RoleSelect.vue'
import type { Qq101Page } from '@champion-data-window/shards/champion-data/qq101/types'
import { useQq101Page } from './context'
import { useTranslation } from 'i18next-vue'
import { NAlert, NButton } from 'naive-ui'
import { computed } from 'vue'
import RankingTable from './RankingTable.vue'
import type { RankingRow } from './rankings'

const { pageState, championIds, changePairsQuery, openChampion } = useQq101Page()

const page = computed(() => pageState.value as Extract<Qq101Page, { kind: 'pairs' }>)

const { t } = useTranslation()

const rows = computed<RankingRow[]>(() =>
  page.value.state.status !== 'ready'
    ? []
    : page.value.state.data.synergies.map((row) => ({
        kind: 'pair',
        key: row.champions
          .map((c) => c.championId)
          .sort((a, b) => a - b)
          .join(':'),
        ids: row.champions.map((c) => c.championId),
        rank: row.rank,
        change: null,
        winRate: row.winRate,
        pickRate: row.pickRate
      }))
)
</script>
