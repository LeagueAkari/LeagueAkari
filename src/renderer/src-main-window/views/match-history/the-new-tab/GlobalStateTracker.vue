<template></template>

<script setup lang="ts">
import { markRaw, watch } from 'vue'

import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import { usePlayerTab } from './context'
import { useSpectator } from './data/spectator'
import { useSummoner } from './data/summoner'
import { useSummonerProfile } from './data/summoner-profile'
import { useRefresh } from './utils/refresh'

const { id } = usePlayerTab()
const { summoner } = useSummoner()
const { spectatorData } = useSpectator()
const { profile } = useSummonerProfile()

const mhs = useMatchHistoryTabsStore()

const { refresh, isSomethingLoading } = useRefresh()

watch(
  [id, isSomethingLoading],
  ([id, isSomethingLoading]) => {
    mhs.updateTabData(id, { isLoading: isSomethingLoading })
  },
  { immediate: true }
)

watch(
  [id, summoner],
  ([id, summoner]) => {
    mhs.updateTabData(id, { summoner: summoner ? markRaw(summoner) : null })
  },
  { immediate: true }
)

watch(
  [id, spectatorData],
  ([id, spectatorData]) => {
    mhs.updateTabData(id, { spectatorData: spectatorData ? markRaw(spectatorData) : null })
  },
  { immediate: true }
)

watch(
  [id, profile],
  ([id, summonerProfile]) => {
    mhs.updateTabData(id, { summonerProfile: summonerProfile ? markRaw(summonerProfile) : null })
  },
  { immediate: true }
)

watch(
  id,
  (id) => {
    mhs.updateTabData(id, { refresh: refresh })
  },
  { immediate: true }
)
</script>
