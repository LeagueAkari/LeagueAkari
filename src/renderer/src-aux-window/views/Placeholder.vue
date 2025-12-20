<template>
  <div class="relative -mt-4 flex h-full flex-col items-center justify-center">
    <NIcon class="relative -left-2 mb-4 text-[80px] text-black/20 dark:text-white/20">
      <AkariLogo />
    </NIcon>
    <span
      class="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400"
      v-if="lcs.gameflow.phase === 'InProgress'"
      >{{ t('Placeholder.inProgress') }}</span
    >
    <span
      class="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400"
      v-else-if="lcs.champSelect.session && lcs.champSelect.session.isSpectating"
      >{{ t('Placeholder.idle') }}</span
    >
    <span class="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400" v-else>{{
      t('Placeholder.idle')
    }}</span>
  </div>
</template>

<script setup lang="ts">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
</script>

<style scoped></style>
