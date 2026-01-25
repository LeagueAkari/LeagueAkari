<template>
  <TabbedPage
    :icon="ToolFilled"
    :title="t('Toolkit.title')"
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
    name: t('Toolkit.client'),
    icon: Apps24Filled,
    component: Client
  },
  {
    key: 'in-game-send',
    name: t('Toolkit.in-game-send'),
    icon: Chat,
    component: InGameSend
  },
  {
    key: 'in-process',
    name: t('Toolkit.in-process'),
    icon: Play24Filled,
    component: InProcess
  },
  {
    key: 'lobby',
    name: t('Toolkit.lobby'),
    icon: MessageFilled,
    component: Lobby
  },
  {
    key: 'misc',
    name: t('Toolkit.misc'),
    icon: SettingFilled,
    component: Misc
  },
  {
    key: 'claim-tools',
    name: t('Toolkit.claim-tools'),
    icon: GiftFilled,
    component: ClaimTools
  },
  ...(import.meta.env.DEV
    ? [
        {
          key: 'loot-tools',
          name: t('Toolkit.loot-tools'),
          icon: Box,
          component: LootTools
        }
      ]
    : []),
  {
    key: 'friend-tools',
    name: t('Toolkit.friend-tools'),
    icon: UserMultiple,
    component: FriendTools
  }
])
</script>
