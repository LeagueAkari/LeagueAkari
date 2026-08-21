import { useAutoChampConfigStore } from '@renderer-shared/shards/auto-champ-config/store'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import type {
  NavigateToSettingOptions,
  SettingsNavigationTargetId
} from '@main-window/settings-navigation'

import {
  countConfiguredChampions,
  getEnabledAutoSelectGroups,
  getPreferredAutoSelectGroupId
} from './automation-status-model'
import type { AutomationStatusItem } from './types'

export interface EnabledAutomation extends AutomationStatusItem {
  readonly targetId: SettingsNavigationTargetId
  readonly navigationOptions?: NavigateToSettingOptions
}

export function useEnabledAutomations() {
  const { t } = useTranslation()
  const autoGameflow = useAutoGameflowStore()
  const autoSelect = useAutoSelectStore()
  const autoChampConfig = useAutoChampConfigStore()
  const autoMisc = useAutoMiscStore()
  const sgp = useSgpStore()

  return computed<EnabledAutomation[]>(() => {
    const automations: EnabledAutomation[] = []
    const add = (enabled: boolean, automation: EnabledAutomation) => {
      if (enabled) {
        automations.push(automation)
      }
    }

    add(autoGameflow.settings.autoAcceptEnabled, {
      id: 'auto-accept',
      label: t('titlebar.automation.items.autoAccept'),
      targetId: 'automation.gameflow.ready-check.enabled'
    })
    add(autoGameflow.settings.autoHonorEnabled, {
      id: 'auto-honor',
      label: t('titlebar.automation.items.autoHonor'),
      targetId: 'automation.gameflow.auto-honor.enabled'
    })
    add(autoGameflow.settings.playAgainEnabled, {
      id: 'play-again',
      label: t('titlebar.automation.items.playAgain'),
      targetId: 'automation.gameflow.play-again.enabled'
    })
    add(autoGameflow.settings.autoMatchmakingEnabled, {
      id: 'auto-matchmaking',
      label: t('titlebar.automation.items.autoMatchmaking'),
      targetId: 'automation.gameflow.auto-matchmaking.enabled'
    })
    add(autoGameflow.settings.autoReconnectEnabled, {
      id: 'auto-reconnect',
      label: t('titlebar.automation.items.autoReconnect'),
      targetId: 'automation.gameflow.auto-reconnect.enabled'
    })
    add(autoGameflow.settings.autoSkipLeaderEnabled, {
      id: 'auto-skip-leader',
      label: t('titlebar.automation.items.autoSkipLeader'),
      targetId: 'automation.gameflow.leader.enabled'
    })
    add(autoGameflow.settings.autoHandleInvitationsEnabled, {
      id: 'auto-handle-invitations',
      label: t('titlebar.automation.items.autoHandleInvitations'),
      targetId: 'automation.gameflow.invitations.enabled'
    })
    add(autoGameflow.settings.autoSendARAMTeamSideEnabled, {
      id: 'aram-team-side',
      label: t('titlebar.automation.items.aramTeamSide'),
      targetId: 'automation.gameflow.aram-team-side.enabled'
    })

    const autoSelectOptions = {
      groups: autoSelect.groups,
      pickConfig: autoSelect.settings.pickConfig,
      banConfig: autoSelect.settings.banConfig,
      sgpServerId: sgp.availability.sgpServerId,
      leagueServers: sgp.leagueServers.servers
    }
    const autoPickBanGroups = getEnabledAutoSelectGroups(autoSelectOptions, 'pick-or-ban')
    const autoTradeGroups = getEnabledAutoSelectGroups(autoSelectOptions, 'trade')

    const addAutoSelectAutomation = (
      id: string,
      labelKey: string,
      targetId: SettingsNavigationTargetId,
      groups: typeof autoPickBanGroups
    ) => {
      const groupId = getPreferredAutoSelectGroupId(groups, autoSelect.activeGroupConfigId)
      if (!groupId) {
        return
      }

      automations.push({
        id,
        label: t(labelKey),
        detail: t('titlebar.automation.configuredModes', { count: groups.length }),
        targetId,
        navigationOptions: { autoSelectGroupId: groupId }
      })
    }

    const preferredPickBanGroupId = getPreferredAutoSelectGroupId(
      autoPickBanGroups,
      autoSelect.activeGroupConfigId
    )
    if (preferredPickBanGroupId) {
      addAutoSelectAutomation(
        'auto-pick-ban',
        'titlebar.automation.items.autoPickBan',
        autoSelect.settings.pickConfig[preferredPickBanGroupId]?.enabled
          ? 'automation.champ-select.pick.enabled'
          : 'automation.champ-select.ban.enabled',
        autoPickBanGroups
      )
    }
    addAutoSelectAutomation(
      'auto-trade',
      'titlebar.automation.items.autoTrade',
      'automation.champ-select.pick.bench-handle-trade',
      autoTradeGroups
    )

    const configuredChampionCount = countConfiguredChampions(
      autoChampConfig.settings.runesV2,
      autoChampConfig.settings.summonerSpells
    )
    add(autoChampConfig.settings.enabled, {
      id: 'auto-champ-config',
      label: t('titlebar.automation.items.autoChampConfig'),
      detail: t('titlebar.automation.configuredChampions', {
        count: configuredChampionCount
      }),
      targetId: 'automation.champ-config.enabled'
    })

    add(autoMisc.settings.autoReplyEnabled, {
      id: 'auto-reply',
      label: t('titlebar.automation.items.autoReply'),
      targetId: 'automation.misc.auto-reply.enabled'
    })
    add(autoGameflow.friendsToBeInvited.length > 0, {
      id: 'scheduled-invitation',
      label: t('titlebar.automation.items.scheduledInvitation'),
      detail: t('titlebar.automation.scheduledFriends', {
        count: autoGameflow.friendsToBeInvited.length
      }),
      targetId: 'automation.misc.auto-invitation'
    })
    add(autoMisc.settings.lockOfflineStatus, {
      id: 'lock-offline',
      label: t('titlebar.automation.items.lockOffline'),
      targetId: 'toolkit.misc.chat-availability.lock-offline'
    })
    add(autoMisc.settings.autoSetStatusMessageEnabled, {
      id: 'reset-status-message',
      label: t('titlebar.automation.items.resetStatusMessage'),
      targetId: 'toolkit.misc.chat-status-message.reset-on-login'
    })
    add(autoMisc.settings.autoSetRankedStatusEnabled, {
      id: 'reset-ranked-status',
      label: t('titlebar.automation.items.resetRankedStatus'),
      targetId: 'toolkit.misc.fake-ranked.reset-on-login'
    })

    return automations
  })
}
