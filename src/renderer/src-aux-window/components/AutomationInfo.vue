<template>
  <NCard size="small" v-if="false"> </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Action } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NCard, NTimeline, NTimelineItem } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()
</script>

<style scoped></style>
