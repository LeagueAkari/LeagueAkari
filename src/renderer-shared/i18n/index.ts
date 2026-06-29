import commonEn from '@shared/i18n/en/common.yaml'
import automationEn from '@shared/i18n/en/renderer/automation.yaml'
import auxWindowEn from '@shared/i18n/en/renderer/aux-window.yaml'
import cdTimerEn from '@shared/i18n/en/renderer/cd-timer.yaml'
import gameAssetsEn from '@shared/i18n/en/renderer/game-assets.yaml'
import leagueClientEn from '@shared/i18n/en/renderer/league-client.yaml'
import matchCardEn from '@shared/i18n/en/renderer/match-card.yaml'
import notificationsEn from '@shared/i18n/en/renderer/notifications.yaml'
import ongoingGameEn from '@shared/i18n/en/renderer/ongoing-game.yaml'
import opggEn from '@shared/i18n/en/renderer/opgg.yaml'
import playerEn from '@shared/i18n/en/renderer/player.yaml'
import rankedEn from '@shared/i18n/en/renderer/ranked.yaml'
import settingsEn from '@shared/i18n/en/renderer/settings.yaml'
import shellEn from '@shared/i18n/en/renderer/shell.yaml'
import toolkitEn from '@shared/i18n/en/renderer/toolkit.yaml'
import commonZhCN from '@shared/i18n/zh-CN/common.yaml'
import automationZhCN from '@shared/i18n/zh-CN/renderer/automation.yaml'
import auxWindowZhCN from '@shared/i18n/zh-CN/renderer/aux-window.yaml'
import cdTimerZhCN from '@shared/i18n/zh-CN/renderer/cd-timer.yaml'
import gameAssetsZhCN from '@shared/i18n/zh-CN/renderer/game-assets.yaml'
import leagueClientZhCN from '@shared/i18n/zh-CN/renderer/league-client.yaml'
import matchCardZhCN from '@shared/i18n/zh-CN/renderer/match-card.yaml'
import notificationsZhCN from '@shared/i18n/zh-CN/renderer/notifications.yaml'
import ongoingGameZhCN from '@shared/i18n/zh-CN/renderer/ongoing-game.yaml'
import opggZhCN from '@shared/i18n/zh-CN/renderer/opgg.yaml'
import playerZhCN from '@shared/i18n/zh-CN/renderer/player.yaml'
import rankedZhCN from '@shared/i18n/zh-CN/renderer/ranked.yaml'
import settingsZhCN from '@shared/i18n/zh-CN/renderer/settings.yaml'
import shellZhCN from '@shared/i18n/zh-CN/renderer/shell.yaml'
import toolkitZhCN from '@shared/i18n/zh-CN/renderer/toolkit.yaml'
import i18next from 'i18next'

function mergeRendererResources(...resources: Record<string, unknown>[]) {
  const merged: Record<string, unknown> = {}

  for (const resource of resources) {
    for (const [key, value] of Object.entries(resource)) {
      if (key in merged) {
        throw new Error(`Duplicate renderer i18n root: ${key}`)
      }

      merged[key] = value
    }
  }

  return merged
}

const rendererEn = mergeRendererResources(
  shellEn,
  settingsEn,
  automationEn,
  leagueClientEn,
  rankedEn,
  matchCardEn,
  playerEn,
  toolkitEn,
  gameAssetsEn,
  ongoingGameEn,
  auxWindowEn,
  opggEn,
  cdTimerEn,
  notificationsEn
)

const rendererZhCN = mergeRendererResources(
  shellZhCN,
  settingsZhCN,
  automationZhCN,
  leagueClientZhCN,
  rankedZhCN,
  matchCardZhCN,
  playerZhCN,
  toolkitZhCN,
  gameAssetsZhCN,
  ongoingGameZhCN,
  auxWindowZhCN,
  opggZhCN,
  cdTimerZhCN,
  notificationsZhCN
)

i18next.init({
  lng: 'en',
  fallbackLng: 'zh-CN',
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false
  },
  ns: ['renderer', 'common'],
  defaultNS: 'renderer',
  resources: {
    'zh-CN': {
      renderer: rendererZhCN,
      common: commonZhCN
    },
    en: {
      renderer: rendererEn,
      common: commonEn
    }
  }
})

export { i18next }
