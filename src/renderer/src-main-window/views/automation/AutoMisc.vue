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
              @update:value="(v) => ar.setEnabled(v)"
              :value="ars.settings.enabled"
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
              @update:value="(v) => ar.setEnableOnAway(v)"
              :value="ars.settings.enableOnAway"
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
                ars.settings.text.length === 0 && ars.settings.enabled ? 'warning' : 'success'
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

          <NScrollbar v-else style="max-height: 400px" class="mb-3">
            <div class="space-y-2">
              <div
                v-for="friend in sortedFriends"
                :key="friend.puuid"
                class="flex items-center gap-3 rounded-md border border-black/10 p-2 pr-5 pl-3 dark:border-white/10"
              >
                <div class="relative">
                  <LcuImage class="size-10 rounded-full" :src="profileIconUri(friend.icon || 29)" />
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
                v-if="sortedFriends.length === 0"
                class="py-8 text-center text-[13px] text-black/50 dark:text-white/50"
              >
                <span>{{ t('AutoMisc.autoInvitation.noFriends') }}</span>
              </div>
            </div>
          </NScrollbar>
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
import { AutoReplyRenderer } from '@renderer-shared/shards/auto-reply'
import { useAutoReplyStore } from '@renderer-shared/shards/auto-reply/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInput, NScrollbar, NSwitch, useMessage } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useSelfHostedLcuDataStore } from '@main-window/shards/self-hosted-lcu-data/store'

const { t } = useTranslation()

const ars = useAutoReplyStore()
const ar = useInstance(AutoReplyRenderer)

const ag = useInstance(AutoGameflowRenderer)
const ags = useAutoGameflowStore()

const lcs = useLeagueClientStore()

const message = useMessage()
const tempText = ref('')

const handleSaveText = async () => {
  await ar.setText(tempText.value)
  message.success(() => t('AutoMisc.autoReply.updated'))
}

watchEffect(() => {
  tempText.value = ars.settings.text
})

// Friend priority for sorting: dnd (游戏中) = away (离开) > chat (在线) > offline (离线)
const FRIEND_PRIORITY: Record<string, number> = {
  dnd: 2,
  away: 2,
  chat: 1,
  offline: 0
}

const shs = useSelfHostedLcuDataStore()

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
