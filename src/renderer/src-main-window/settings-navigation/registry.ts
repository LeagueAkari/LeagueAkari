import type {
  MainWindowNavigationOptions,
  MainWindowTargetId
} from '@renderer-shared/components/settings-navigation/targets'
import { createSettingsNavigationTargetStepKey } from '@renderer-shared/components/settings-navigation/useSettingsNavigationTarget'
import type {
  AkariNavigationPath,
  AkariNavigationStep
} from '@renderer-shared/shards/akari-navigation'
import type { RouteLocationRaw } from 'vue-router'

import {
  APP_SETTINGS_NAVIGATION_STEP_KEY,
  type AppSettingsNavigationPayload,
  MISC_SETTINGS_NAVIGATION_STEP_KEY,
  type MiscSettingsNavigationPayload,
  SETTINGS_MODAL_NAVIGATION_STEP_KEY,
  type SettingsTabName
} from '@main-window/components/settings-modal/navigation'
import {
  STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
  type StorageSettingsTabName
} from '@main-window/components/settings-modal/storage-settings/navigation'
import {
  MAIN_WINDOW_ROUTE_STEP_KEY,
  createMainPageNavigationStepKey
} from '@main-window/routes/navigation-steps'
import {
  AUTO_SELECT_NAVIGATION_STEP_KEY,
  type AutoSelectNavigationPayload
} from '@main-window/views/automation/auto-select-navigation'

export type SettingsModalNavigationRoute =
  | {
      tab: Exclude<SettingsTabName, 'storage'>
      subTab?: never
    }
  | {
      tab: 'storage'
      subTab: StorageSettingsTabName
    }

export type MainWindowSettingsNavigationRoute =
  | {
      name: 'automation'
      section: 'auto-gameflow' | 'auto-select' | 'auto-champ-config' | 'misc'
    }
  | {
      name: 'toolkit'
      section: 'client' | 'in-game-send' | 'misc'
    }

export type SettingsNavigationRoute =
  SettingsModalNavigationRoute | MainWindowSettingsNavigationRoute

interface SettingsDestination {
  route: SettingsNavigationRoute
  fallbackId?: MainWindowTargetId
  prepareStep?: AkariNavigationStep
  terminalId?: MainWindowTargetId
}

interface SettingsNavigationTarget extends SettingsDestination {
  id: string
}

const destinations = {
  'app.basic': { route: { tab: 'basic' } },
  'app.basic.close-action': { route: { tab: 'basic' } },
  'app.basic.locale': { route: { tab: 'basic' } },
  'app.basic.preferred-lol-source': { route: { tab: 'basic' } },
  'app.basic.theme': { route: { tab: 'basic' } },
  'app.self-update': { route: { tab: 'basic' } },
  'app.self-update.auto-check': { route: { tab: 'basic' } },
  'app.self-update.auto-download': { route: { tab: 'basic' } },
  'app.self-update.check': { route: { tab: 'basic' } },
  'app.main-window-ui': { route: { tab: 'basic' } },
  'app.main-window-ui.background': { route: { tab: 'basic' } },
  'app.main-window-ui.custom-background': {
    route: { tab: 'basic' },
    fallbackId: 'app.main-window-ui.background'
  },
  'app.lcu-connection': { route: { tab: 'basic' } },
  'app.lcu-connection.auto-connect': { route: { tab: 'basic' } },
  'app.lcu-connection.use-wmi': {
    route: { tab: 'basic' },
    fallbackId: 'app.lcu-connection.auto-connect',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'windows-only' satisfies AppSettingsNavigationPayload
    }
  },
  'app.lcu-connection.rebuild-wmi': {
    route: { tab: 'basic' },
    fallbackId: 'app.lcu-connection.auto-connect',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'windows-only' satisfies AppSettingsNavigationPayload
    }
  },
  'app.http-proxy': { route: { tab: 'basic' } },
  'app.misc.http-proxy.strategy': { route: { tab: 'basic' } },
  'app.misc.http-proxy.host': {
    route: { tab: 'basic' },
    fallbackId: 'app.misc.http-proxy.strategy',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'forced-http-proxy' satisfies AppSettingsNavigationPayload
    }
  },
  'app.misc.http-proxy.port': {
    route: { tab: 'basic' },
    fallbackId: 'app.misc.http-proxy.strategy',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'forced-http-proxy' satisfies AppSettingsNavigationPayload
    }
  },
  'app.misc': { route: { tab: 'basic' } },
  'app.misc.log-level': { route: { tab: 'basic' } },
  'app.misc.disable-hardware-acceleration': { route: { tab: 'basic' } },
  'app.misc.uninstall': { route: { tab: 'basic' } },
  'match-history': { route: { tab: 'player-tabs' } },
  'match-history.refresh-after-game': { route: { tab: 'player-tabs' } },
  'match-history.load-count': { route: { tab: 'player-tabs' } },
  'ongoing-game.common': { route: { tab: 'ongoing-game' } },
  'ongoing-game.enabled': { route: { tab: 'ongoing-game' } },
  'ongoing-game.auto-route': { route: { tab: 'ongoing-game' } },
  'ongoing-game.match-history-load-count': { route: { tab: 'ongoing-game' } },
  'ongoing-game.concurrency': { route: { tab: 'ongoing-game' } },
  'ongoing-game.game-details-load-count': { route: { tab: 'ongoing-game' } },
  'ongoing-game.queue-filter': { route: { tab: 'ongoing-game' } },
  'ongoing-game.query-in-lobby': { route: { tab: 'ongoing-game' } },
  'ongoing-game.premade-threshold': { route: { tab: 'ongoing-game' } },
  'ongoing-game.player-card': { route: { tab: 'ongoing-game' } },
  'ongoing-game.player-card.champion-usage': { route: { tab: 'ongoing-game' } },
  'ongoing-game.player-card.match-border': { route: { tab: 'ongoing-game' } },
  'ongoing-game.player-card.jungle-pathing': { route: { tab: 'ongoing-game' } },
  'ongoing-game.player-card.tags': { route: { tab: 'ongoing-game' } },
  'multi-window.secondary': { route: { tab: 'multi-window' } },
  'multi-window.secondary.enabled': { route: { tab: 'multi-window' } },
  'multi-window.secondary.auto-show-lobby': { route: { tab: 'multi-window' } },
  'multi-window.secondary.auto-show-champ-select': { route: { tab: 'multi-window' } },
  'multi-window.secondary.shortcut': { route: { tab: 'multi-window' } },
  'multi-window.secondary.opacity': { route: { tab: 'multi-window' } },
  'multi-window.secondary.skin-selector': { route: { tab: 'multi-window' } },
  'multi-window.secondary.reset-position': { route: { tab: 'multi-window' } },
  'multi-window.ongoing-game': { route: { tab: 'multi-window' } },
  'multi-window.ongoing-game.enabled': { route: { tab: 'multi-window' } },
  'multi-window.ongoing-game.shortcut': { route: { tab: 'multi-window' } },
  'multi-window.cd-timer': { route: { tab: 'multi-window' } },
  'multi-window.cd-timer.enabled': { route: { tab: 'multi-window' } },
  'multi-window.cd-timer.shortcut': { route: { tab: 'multi-window' } },
  'multi-window.cd-timer.reset-position': { route: { tab: 'multi-window' } },
  'multi-window.cd-timer.type': { route: { tab: 'multi-window' } },
  'multi-window.cd-timer.reverse-adjustment': { route: { tab: 'multi-window' } },
  'misc.respawn-timer': { route: { tab: 'misc' } },
  'misc.respawn-timer.enabled': { route: { tab: 'misc' } },
  'misc.streamer-mode': { route: { tab: 'misc' } },
  'misc.streamer-mode.enabled': { route: { tab: 'misc' } },
  'misc.streamer-mode.akari-name': {
    route: { tab: 'misc' },
    fallbackId: 'misc.streamer-mode.enabled',
    prepareStep: {
      key: MISC_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'streamer-mode-enabled' satisfies MiscSettingsNavigationPayload
    }
  },
  'misc.streamer-mode.content-protection': { route: { tab: 'misc' } },
  'storage.tagged-players': { route: { tab: 'storage', subTab: 'tagged-players' } },
  'storage.saved-settings': { route: { tab: 'storage', subTab: 'settings' } },
  'storage.saved-settings.export': { route: { tab: 'storage', subTab: 'settings' } },
  'storage.saved-settings.import': { route: { tab: 'storage', subTab: 'settings' } },
  'automation.gameflow.ready-check': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.ready-check.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.ready-check.delay': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-honor': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.auto-honor.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.play-again': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.play-again.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking.minimum-members': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking.delay': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking.wait-for-invitees': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking.rematch-strategy': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-matchmaking.rematch-fixed-duration': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.auto-reconnect': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.auto-reconnect.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.leader': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.leader.enabled': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.invitations': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.invitations.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.invitations.reject-when-away': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.invitations.strategies': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.aram-team-side': { route: { name: 'automation', section: 'auto-gameflow' } },
  'automation.gameflow.aram-team-side.enabled': {
    route: { name: 'automation', section: 'auto-gameflow' }
  },
  'automation.gameflow.aram-team-side.visible-to-team': {
    route: { name: 'automation', section: 'auto-gameflow' },
    terminalId: 'automation.gameflow.aram-team-side.enabled'
  },
  'automation.champ-select': { route: { name: 'automation', section: 'auto-select' } },
  'automation.champ-select.pick': {
    route: { name: 'automation', section: 'auto-select' },
    terminalId: 'automation.champ-select'
  },
  'automation.champ-select.pick.enabled': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.expected-champions': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.show-intent': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.ignore-intent': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.strategy': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.delay': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.bench-swap-delay': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.bench-first': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.pick.bench-handle-trade': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.ban': {
    route: { name: 'automation', section: 'auto-select' },
    terminalId: 'automation.champ-select'
  },
  'automation.champ-select.ban.enabled': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.ban.expected-champions': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.ban.strategy': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-select.ban.delay': {
    route: { name: 'automation', section: 'auto-select' },
    fallbackId: 'automation.champ-select'
  },
  'automation.champ-config': { route: { name: 'automation', section: 'auto-champ-config' } },
  'automation.champ-config.enabled': {
    route: { name: 'automation', section: 'auto-champ-config' }
  },
  'automation.champ-config.configure': {
    route: { name: 'automation', section: 'auto-champ-config' }
  },
  'automation.misc.auto-reply': { route: { name: 'automation', section: 'misc' } },
  'automation.misc.auto-reply.enabled': { route: { name: 'automation', section: 'misc' } },
  'automation.misc.auto-reply.enable-on-away': {
    route: { name: 'automation', section: 'misc' },
    terminalId: 'automation.misc.auto-reply.enabled'
  },
  'automation.misc.auto-reply.text': { route: { name: 'automation', section: 'misc' } },
  'automation.misc.auto-invitation': { route: { name: 'automation', section: 'misc' } },
  'toolkit.client.game-client': { route: { name: 'toolkit', section: 'client' } },
  'toolkit.client.game-client.terminate-shortcut-enabled': {
    route: { name: 'toolkit', section: 'client' }
  },
  'toolkit.client.game-client.terminate-shortcut': {
    route: { name: 'toolkit', section: 'client' }
  },
  'toolkit.client.game-client.settings-file-mode': {
    route: { name: 'toolkit', section: 'client' }
  },
  'toolkit.client.league-client-ux': { route: { name: 'toolkit', section: 'client' } },
  'toolkit.client.league-client-ux.adjust-window-size': {
    route: { name: 'toolkit', section: 'client' }
  },
  'toolkit.in-game-send.presets': { route: { name: 'toolkit', section: 'in-game-send' } },
  'toolkit.in-game-send.settings': { route: { name: 'toolkit', section: 'in-game-send' } },
  'toolkit.in-game-send.settings.cancel-shortcut': {
    route: { name: 'toolkit', section: 'in-game-send' }
  },
  'toolkit.in-game-send.settings.send-interval': {
    route: { name: 'toolkit', section: 'in-game-send' }
  },
  'toolkit.misc.chat-availability': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.chat-availability.availability': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.chat-availability.lock-offline': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.chat-status-message': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.chat-status-message.text': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.chat-status-message.reset-on-login': {
    route: { name: 'toolkit', section: 'misc' },
    terminalId: 'toolkit.misc.chat-status-message.text'
  },
  'toolkit.misc.fake-ranked': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.fake-ranked.status': { route: { name: 'toolkit', section: 'misc' } },
  'toolkit.misc.fake-ranked.reset-on-login': {
    route: { name: 'toolkit', section: 'misc' },
    terminalId: 'toolkit.misc.fake-ranked.status'
  },
  'debug.files': { route: { tab: 'debug' } },
  'debug.files.logs': { route: { tab: 'debug' } },
  'debug.files.app-data': { route: { tab: 'debug' } },
  'debug.test-page': { route: { tab: 'debug' } }
} satisfies Record<MainWindowTargetId, SettingsDestination>

const registry = new Map<string, SettingsNavigationTarget>(
  Object.entries(destinations).map(([id, destination]) => [id, { id, ...destination }])
)

export function getSettingsNavigationTarget(id: string) {
  return registry.get(id)
}

function getAutoSelectPayload(
  targetId: string,
  groupId?: string
): AutoSelectNavigationPayload | undefined {
  if (
    targetId === 'automation.champ-select.pick' ||
    targetId.startsWith('automation.champ-select.pick.')
  ) {
    return groupId ? { tab: 'pick', groupId } : { tab: 'pick' }
  }
  if (
    targetId === 'automation.champ-select.ban' ||
    targetId.startsWith('automation.champ-select.ban.')
  ) {
    return groupId ? { tab: 'ban', groupId } : { tab: 'ban' }
  }

  return undefined
}

export function createSettingsNavigationPath(
  target: SettingsNavigationTarget,
  options: MainWindowNavigationOptions = {}
): AkariNavigationPath {
  const path: AkariNavigationStep[] = []

  if ('tab' in target.route) {
    path.push({ key: SETTINGS_MODAL_NAVIGATION_STEP_KEY, payload: target.route.tab })

    if (target.route.tab === 'storage') {
      path.push({
        key: STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
        payload: target.route.subTab
      })
    }
  } else {
    path.push(
      {
        key: MAIN_WINDOW_ROUTE_STEP_KEY,
        payload: {
          name: target.route.name,
          params: { section: target.route.section }
        } satisfies RouteLocationRaw
      },
      {
        key: createMainPageNavigationStepKey(target.route.name),
        payload: target.route.section
      }
    )

    if (target.route.name === 'automation' && target.route.section === 'auto-select') {
      const autoSelectPayload = target.terminalId
        ? undefined
        : getAutoSelectPayload(target.id, options.autoSelectGroupId)
      if (autoSelectPayload) {
        path.push({ key: AUTO_SELECT_NAVIGATION_STEP_KEY, payload: autoSelectPayload })
      }
    }
  }

  if (target.prepareStep) {
    path.push(target.prepareStep)
  }

  path.push({ key: createSettingsNavigationTargetStepKey(target.terminalId ?? target.id) })
  return path
}
