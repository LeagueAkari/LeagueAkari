<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto flex max-w-[800px] flex-col gap-6 p-6">
        <SettingsSection :title="t('AutoMisc.autoReply.title')">
          <SettingsRow :label="t('AutoMisc.autoReply.enabled.label')" :label-width="260">
            <NSwitch
              @update:value="(v) => am.setAutoReplyEnabled(v)"
              :value="ams.settings.autoReplyEnabled"
              size="small"
            ></NSwitch>
          </SettingsRow>
          <SettingsRow
            :label="t('AutoMisc.autoReply.enableOnAway.label')"
            :label-description="t('AutoMisc.autoReply.enableOnAway.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => am.setAutoReplyEnableOnAway(v)"
              :value="ams.settings.autoReplyEnableOnAway"
              size="small"
            ></NSwitch>
          </SettingsRow>
          <SettingsRow
            :label="t('AutoMisc.autoReply.text.label')"
            :label-description="t('AutoMisc.autoReply.text.description')"
            :label-width="260"
            align="start"
          >
            <NInput
              :status="
                ams.settings.autoReplyText.length === 0 && ams.settings.autoReplyEnabled
                  ? 'warning'
                  : 'success'
              "
              class="w-90!"
              v-model:value="tempText"
              @blur="handleSaveText"
              :autosize="{
                minRows: 2,
                maxRows: 4
              }"
              type="textarea"
              size="small"
            ></NInput>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoMisc.autoInvitation.title')">
          <div class="p-3">
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

              <NScrollbar class="max-h-[400px]">
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
          </div>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { AutoMiscRenderer } from '@renderer-shared/shards/auto-misc'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { Search as SearchIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInput, NScrollbar, NSwitch, useMessage } from 'naive-ui'
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

const handleSaveText = async () => {
  await am.setAutoReplyText(tempText.value)
  message.success(() => t('AutoMisc.autoReply.updated'))
}

watchEffect(() => {
  tempText.value = ams.settings.autoReplyText
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
