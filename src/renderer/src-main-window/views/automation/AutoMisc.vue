<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <!-- auto reply -->
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('AutoMisc.autoReply.title') }}</span>
          </template>
          <ControlItem
            :label="t('AutoMisc.autoReply.enabled.label')"
            class="control-item-margin"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => am.setAutoReplyEnabled(v)"
              :value="ams.settings.autoReplyEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :label="t('AutoMisc.autoReply.enableOnAway.label')"
            class="control-item-margin"
            :label-description="t('AutoMisc.autoReply.enableOnAway.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => am.setAutoReplyEnableOnAway(v)"
              :value="ams.settings.autoReplyEnableOnAway"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :label="t('AutoMisc.autoReply.text.label')"
            class="control-item-margin"
            :label-description="t('AutoMisc.autoReply.text.description')"
            :label-width="260"
          >
            <NInput
              :status="
                ams.settings.autoReplyText.length === 0 && ams.settings.autoReplyEnabled
                  ? 'warning'
                  : 'success'
              "
              style="max-width: 360px; width: 360px"
              v-model:value="tempText"
              @blur="handleSaveText"
              :autosize="{
                minRows: 2,
                maxRows: 4
              }"
              type="textarea"
              size="small"
            ></NInput>
          </ControlItem>
        </NCard>

        <!-- auto status message -->
        <NCard size="small" class="mt-2">
          <template #header>
            <span class="card-header-title">{{ t('AutoMisc.autoStatusMessage.title') }}</span>
          </template>
          <ControlItem
            :label="t('AutoMisc.autoStatusMessage.enabled.label')"
            class="control-item-margin"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => am.setAutoSetStatusMessageEnabled(v)"
              :value="ams.settings.autoSetStatusMessageEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            :label="t('AutoMisc.autoStatusMessage.text.label')"
            class="control-item-margin"
            :label-description="t('AutoMisc.autoStatusMessage.text.description')"
            :label-width="260"
          >
            <NInput
              :status="
                ams.settings.statusMessage.length === 0 && ams.settings.autoSetStatusMessageEnabled
                  ? 'warning'
                  : 'success'
              "
              style="max-width: 360px; width: 360px"
              v-model:value="tempStatusMessage"
              @blur="handleSaveStatusMessage"
              :autosize="{
                minRows: 2,
                maxRows: 4
              }"
              type="textarea"
              size="small"
            ></NInput>
          </ControlItem>
        </NCard>

        <!-- auto ranked status -->
        <NCard size="small" class="mt-2">
          <template #header>
            <span class="card-header-title">{{ t('AutoMisc.autoRankedStatus.title') }}</span>
          </template>
          <ControlItem
            :label="t('AutoMisc.autoRankedStatus.enabled.label')"
            class="control-item-margin"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => am.setAutoSetRankedStatusEnabled(v)"
              :value="ams.settings.autoSetRankedStatusEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoMisc.autoRankedStatus.queue')"
            :label-width="260"
          >
            <NSelect
              :options="rankedQueueOptions"
              style="width: 180px"
              :value="ams.settings.rankedStatus.queue"
              @update:value="(value) => am.setRankedQueue(value)"
              size="small"
            ></NSelect>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoMisc.autoRankedStatus.tier')"
            :label-width="260"
          >
            <NSelect
              :options="rankedTierOptions"
              style="width: 180px"
              :value="ams.settings.rankedStatus.tier"
              @update:value="(value) => am.setRankedTier(value)"
              size="small"
            ></NSelect>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoMisc.autoRankedStatus.division')"
            :label-width="260"
          >
            <NSelect
              :options="rankedDivisionOptions"
              :disabled="isApexRankedTier"
              style="width: 180px"
              :value="ams.settings.rankedStatus.division"
              @update:value="(value) => am.setRankedDivision(value)"
              size="small"
            ></NSelect>
          </ControlItem>
        </NCard>

        <!-- auto invitation -->
        <NCard size="small" class="mt-2">
          <template #header>
            <span class="card-header-title">{{ t('AutoMisc.autoInvitation.title') }}</span>
          </template>

          <div class="mb-3 text-[13px] text-black/60 italic dark:text-white/70">
            <span>{{ t('AutoMisc.autoInvitation.description') }}</span>
          </div>

          <div
            v-if="!lcs.isConnected"
            class="mb-3 flex h-24 items-center justify-center rounded-md bg-black/5 p-2 text-center text-[13px] text-black/50 dark:bg-white/5 dark:text-white/50"
          >
            <span>{{ t('AutoMisc.autoInvitation.unavailable') }}</span>
          </div>

          <div
            v-else-if="!isInLobby"
            class="mb-3 flex h-24 items-center justify-center rounded-md bg-black/5 p-2 text-center text-[13px] text-black/50 dark:bg-white/5 dark:text-white/50"
          >
            <span>{{ t('AutoMisc.autoInvitation.notInLobby') }}</span>
          </div>

          <div v-else>
            <NInput
              v-model:value="friendSearchInput"
              clearable
              size="small"
              :placeholder="t('AutoMisc.autoInvitation.searchPlaceholder')"
              class="mb-3 w-72!"
            >
              <template #prefix>
                <NIcon><SearchIcon /></NIcon>
              </template>
            </NInput>

            <NScrollbar style="max-height: 400px">
              <div class="space-y-2">
                <div
                  v-for="friend in filteredSortedFriends"
                  :key="friend.puuid"
                  class="flex items-center gap-3 rounded-md border border-black/10 p-2 pr-5 pl-3 dark:border-white/10"
                >
                  <div class="relative">
                    <LcuImage
                      class="size-10 rounded-full"
                      :src="profileIconUri(friend.icon || 29)"
                    />
                    <div
                      class="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white dark:border-neutral-900"
                      :class="{
                        'bg-green-500': friend.availability === 'chat',
                        'bg-cyan-500': friend.availability === 'dnd',
                        'bg-red-500': friend.availability === 'away',
                        'bg-gray-400': friend.availability === 'offline'
                      }"
                    ></div>
                  </div>
                  <div class="flex min-w-0 flex-1 items-end gap-1">
                    <div class="truncate text-sm font-medium">{{ friend.gameName }}</div>
                    <div class="truncate text-xs text-black/60 dark:text-white/60">
                      #{{ friend.gameTag }}
                    </div>
                  </div>
                  <NButton
                    size="small"
                    :type="isScheduled(friend.puuid) ? 'warning' : 'default'"
                    :disabled="!lcs.isConnected"
                    @click="toggleInvitation(friend.puuid)"
                  >
                    {{
                      isScheduled(friend.puuid)
                        ? t('AutoMisc.autoInvitation.cancelSchedule')
                        : t('AutoMisc.autoInvitation.scheduleInvite')
                    }}
                  </NButton>
                </div>
                <div
                  v-if="filteredSortedFriends.length === 0"
                  class="py-8 text-center text-[13px] text-black/50 dark:text-white/50"
                >
                  <span>{{ t('AutoMisc.autoInvitation.noFriends') }}</span>
                </div>
              </div>
            </NScrollbar>
          </div>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { AutoMiscRenderer } from '@renderer-shared/shards/auto-misc'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import type { AutoMiscRankedDivision, AutoMiscRankedTier } from '@shared/types/shards/auto-misc'
import { Search as SearchIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NIcon, NInput, NScrollbar, NSelect, NSwitch, useMessage } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useSelfHostedLcuDataStore } from '@main-window/shards/self-hosted-lcu-data/store'

const { t } = useTranslation()

const ams = useAutoMiscStore()
const am = useInstance(AutoMiscRenderer)

const ag = useInstance(AutoGameflowRenderer)
const ags = useAutoGameflowStore()

const lcs = useLeagueClientStore()

const message = useMessage()
const tempText = ref('')
const tempStatusMessage = ref('')

const handleSaveText = async () => {
  await am.setAutoReplyText(tempText.value)
  message.success(() => t('AutoMisc.autoReply.updated'))
}

const handleSaveStatusMessage = async () => {
  await am.setStatusMessage(tempStatusMessage.value)
  message.success(() => t('AutoMisc.autoStatusMessage.updated'))
}

watchEffect(() => {
  tempText.value = ams.settings.autoReplyText
  tempStatusMessage.value = ams.settings.statusMessage
})

const rankedTierOptions = computed(() => {
  return [
    { label: t('tiers.IRON', { ns: 'common' }), value: 'IRON' },
    { label: t('tiers.BRONZE', { ns: 'common' }), value: 'BRONZE' },
    { label: t('tiers.SILVER', { ns: 'common' }), value: 'SILVER' },
    { label: t('tiers.GOLD', { ns: 'common' }), value: 'GOLD' },
    { label: t('tiers.PLATINUM', { ns: 'common' }), value: 'PLATINUM' },
    { label: t('tiers.EMERALD', { ns: 'common' }), value: 'EMERALD' },
    { label: t('tiers.DIAMOND', { ns: 'common' }), value: 'DIAMOND' },
    { label: t('tiers.MASTER', { ns: 'common' }), value: 'MASTER' },
    { label: t('tiers.GRANDMASTER', { ns: 'common' }), value: 'GRANDMASTER' },
    { label: t('tiers.CHALLENGER', { ns: 'common' }), value: 'CHALLENGER' }
  ] satisfies { label: string; value: AutoMiscRankedTier }[]
})

const rankedDivisionOptions = [
  { label: 'I', value: 'I' },
  { label: 'II', value: 'II' },
  { label: 'III', value: 'III' },
  { label: 'IV', value: 'IV' }
] satisfies { label: string; value: AutoMiscRankedDivision }[]

const rankedQueueOptions = computed(() => {
  return [
    { label: t('queueTypes.RANKED_SOLO_5x5', { ns: 'common' }), value: 'RANKED_SOLO_5x5' },
    { label: t('queueTypes.RANKED_FLEX_SR', { ns: 'common' }), value: 'RANKED_FLEX_SR' },
    { label: t('queueTypes.RANKED_TFT', { ns: 'common' }), value: 'RANKED_TFT' },
    { label: t('queueTypes.RANKED_FLEX_TT', { ns: 'common' }), value: 'RANKED_FLEX_TT' },
    { label: t('queueTypes.CHERRY', { ns: 'common' }), value: 'CHERRY' },
    { label: t('queueTypes.RANKED_TFT_TURBO', { ns: 'common' }), value: 'RANKED_TFT_TURBO' },
    {
      label: t('queueTypes.RANKED_TFT_DOUBLE_UP', { ns: 'common' }),
      value: 'RANKED_TFT_DOUBLE_UP'
    }
  ]
})

const isApexRankedTier = computed(() => {
  return ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(ams.settings.rankedStatus.tier)
})

// Friend priority for sorting: dnd (游戏中) = away (离开) > chat (在线) > offline (离线)
const FRIEND_PRIORITY: Record<string, number> = {
  dnd: 2,
  away: 2,
  chat: 1,
  offline: 0
}

const shs = useSelfHostedLcuDataStore()

const friendSearchInput = ref('')

const sortedFriends = computed(() => {
  return shs.friends.toSorted((a, b) => {
    const av = FRIEND_PRIORITY[a.availability] || 0
    const bv = FRIEND_PRIORITY[b.availability] || 0
    if (bv !== av) {
      return bv - av
    }
    // If same priority, dnd comes before away
    if (a.availability === 'dnd' && b.availability === 'away') return -1
    if (a.availability === 'away' && b.availability === 'dnd') return 1
    return 0
  })
})

const filteredSortedFriends = computed(() => {
  if (!friendSearchInput.value.trim()) {
    return sortedFriends.value
  }

  const query = friendSearchInput.value.toLowerCase().trim()
  return sortedFriends.value.filter((friend) => {
    const gameName = friend.gameName?.toLowerCase() || ''
    const gameTag = friend.gameTag?.toLowerCase() || ''
    const fullName = `${gameName}#${gameTag}`.toLowerCase()
    return fullName.includes(query)
  })
})

const isScheduled = (puuid: string) => {
  return ags.friendsToBeInvited.includes(puuid)
}

const toggleInvitation = async (puuid: string) => {
  const currentList = [...ags.friendsToBeInvited]
  if (isScheduled(puuid)) {
    const newList = currentList.filter((p) => p !== puuid)
    await ag.setFriendsToBeInvited(newList)
  } else {
    const newList = [...currentList, puuid]
    await ag.setFriendsToBeInvited(newList)
  }
}

const isInLobby = computed(() => {
  return lcs.lobby.lobby !== null
})
</script>

<style scoped>
@import './automation-styles.css';
</style>
