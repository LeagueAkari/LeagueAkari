<template>
  <TabbedPage
    :icon="ToolFilled"
    :title="t('toolkit.home.title')"
    :tabs="tabs"
    route-name="toolkit"
    default-tab="client"
  />
</template>

<script setup lang="ts">
import { GiftFilled, MessageFilled, SettingFilled, ToolFilled } from '@vicons/antd'
import { Box, Chat, UserMultiple } from '@vicons/carbon'
import { Apps24Filled, Play24Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import TabbedPage, { TabConfig } from '@main-window/components/TabbedPage.vue'

import ClaimTools from './claim-tools/ClaimTools.vue'
import Client from './client/Client.vue'
import FriendTools from './friend-tools/FriendTools.vue'
import InGameSend from './in-game-send/InGameSend.vue'
import InProcess from './in-process/InProcess.vue'
import Lobby from './lobby/Lobby.vue'
import LootTools from './loot-tools/LootTools.vue'
import Misc from './misc/Misc.vue'

const { t } = useTranslation()

const tabs = computed<TabConfig[]>(() => [
  {
    key: 'client',
    name: t('toolkit.home.client'),
    icon: Apps24Filled,
    component: Client
  },
  {
    key: 'in-game-send',
    name: t('toolkit.home.in-game-send'),
    icon: Chat,
    component: InGameSend
  },
  {
    key: 'in-process',
    name: t('toolkit.home.in-process'),
    icon: Play24Filled,
    component: InProcess
  },
  {
    key: 'lobby',
    name: t('toolkit.home.lobby'),
    icon: MessageFilled,
    component: Lobby
  },
  {
    key: 'misc',
    name: t('toolkit.home.misc'),
    icon: SettingFilled,
    component: Misc
  },
  {
    key: 'claim-tools',
    name: t('toolkit.home.claim-tools'),
    icon: GiftFilled,
    component: ClaimTools
  },
  ...(import.meta.env.DEV
    ? [
        {
          key: 'loot-tools',
          name: t('toolkit.home.loot-tools'),
          icon: Box,
          component: LootTools
        }
      ]
    : []),
  {
    key: 'friend-tools',
    name: t('toolkit.home.friend-tools'),
    icon: UserMultiple,
    component: FriendTools
  }
])
</script>
