import {
  AutoSelectGroupsV1Schema,
  LeagueServersConfigV2Schema,
  OngoingGameConfigV1Schema,
  SupportedQueuesV1Schema
} from '@shared/schemas/remote-config'

import {
  REMOTE_CONFIG_AUTO_SELECT_GROUPS_RELATIVE_PATH,
  REMOTE_CONFIG_CACHED_RESOURCE_UPDATE_INTERVAL,
  REMOTE_CONFIG_LEAGUE_SERVERS_RELATIVE_PATH,
  REMOTE_CONFIG_ONGOING_GAME_CONFIG_RELATIVE_PATH,
  REMOTE_CONFIG_SUPPORTED_QUEUES_RELATIVE_PATH,
  type RemoteConfigMainContext
} from './context'
import type { RemoteConfigState } from './state'

export interface CachedResourceData {
  lastUpdate: number
}

export interface CachedResourceSchema<T extends CachedResourceData> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: unknown }
}

export interface CachedResource<T extends CachedResourceData> {
  id: string
  name: string
  cachePath: string
  intervalMs: number
  schema: CachedResourceSchema<T>
  fetchRemote: (context: RemoteConfigMainContext) => Promise<T>
  getCurrentLastUpdate: (state: RemoteConfigState) => number
  apply: (state: RemoteConfigState, data: T) => void
  getUpdating: (state: RemoteConfigState) => boolean
  setUpdating: (state: RemoteConfigState, isUpdating: boolean) => void
}

export const CACHED_RESOURCES: CachedResource<any>[] = [
  {
    id: 'supportedQueues',
    name: 'supported queues',
    cachePath: REMOTE_CONFIG_SUPPORTED_QUEUES_RELATIVE_PATH,
    intervalMs: REMOTE_CONFIG_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: SupportedQueuesV1Schema,
    fetchRemote: async ({ repository, settings }) => {
      const { data } = await repository.getSupportedQueues({
        repo: 'akari-config',
        source: settings.preferredSource
      })

      return data
    },
    getCurrentLastUpdate: (state) => state.supportedQueues.lastUpdate,
    apply: (state, data) => state.setSupportedQueues(data),
    getUpdating: (state) => state.isUpdatingSupportedQueues,
    setUpdating: (state, isUpdating) => state.setUpdatingSupportedQueues(isUpdating)
  },
  {
    id: 'leagueServers',
    name: 'league servers',
    cachePath: REMOTE_CONFIG_LEAGUE_SERVERS_RELATIVE_PATH,
    intervalMs: REMOTE_CONFIG_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: LeagueServersConfigV2Schema,
    fetchRemote: async ({ repository, settings }) => {
      const { data } = await repository.getSgpLeagueServersConfig({
        source: settings.preferredSource,
        repo: 'akari-config',
        branch: 'main'
      })

      return data
    },
    getCurrentLastUpdate: (state) => state.leagueServers.lastUpdate,
    apply: (state, data) => state.setLeagueServers(data),
    getUpdating: (state) => state.isUpdatingLeagueServers,
    setUpdating: (state, isUpdating) => state.setUpdatingLeagueServers(isUpdating)
  },
  {
    id: 'ongoingGameConfig',
    name: 'ongoing game config',
    cachePath: REMOTE_CONFIG_ONGOING_GAME_CONFIG_RELATIVE_PATH,
    intervalMs: REMOTE_CONFIG_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: OngoingGameConfigV1Schema,
    fetchRemote: async ({ repository, settings }) => {
      const { data } = await repository.getOngoingGameConfig({
        source: settings.preferredSource,
        repo: 'akari-config',
        branch: 'main'
      })

      return data
    },
    getCurrentLastUpdate: (state) => state.ongoingGameConfig.lastUpdate,
    apply: (state, data) => state.setOngoingGameConfig(data),
    getUpdating: (state) => state.isUpdatingOngoingGameConfig,
    setUpdating: (state, isUpdating) => state.setUpdatingOngoingGameConfig(isUpdating)
  },
  {
    id: 'autoSelectGroups',
    name: 'auto select groups',
    cachePath: REMOTE_CONFIG_AUTO_SELECT_GROUPS_RELATIVE_PATH,
    intervalMs: REMOTE_CONFIG_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AutoSelectGroupsV1Schema,
    fetchRemote: async ({ repository, settings }) => {
      const { data } = await repository.getAutoSelectGroups({
        source: settings.preferredSource,
        repo: 'akari-config',
        branch: 'main'
      })

      return data
    },
    getCurrentLastUpdate: (state) => state.autoSelectGroups.lastUpdate,
    apply: (state, data) => state.setAutoSelectGroups(data),
    getUpdating: (state) => state.isUpdatingAutoSelectGroups,
    setUpdating: (state, isUpdating) => state.setUpdatingAutoSelectGroups(isUpdating)
  }
]
