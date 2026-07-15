import {
  type AkariApiConfigResource,
  AkariAutoSelectGroupsConfigSchema,
  type AkariConfigMetadata,
  AkariLeagueServersConfigSchema,
  AkariOngoingGameConfigSchema,
  AkariSupportedQueuesConfigSchema
} from '@shared/shards/akari-api'

import { AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL } from './context'
import type { AkariApiState } from './state'

interface CachedResourceSchema<T extends AkariConfigMetadata> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: unknown }
}

export interface CachedResource<T extends AkariConfigMetadata> {
  id: string
  name: string
  resource: AkariApiConfigResource
  cachePath: string
  intervalMs: number
  schema: CachedResourceSchema<T>
  getCurrentUpdatedAt: (state: AkariApiState) => string
  apply: (state: AkariApiState, data: T) => void
  getUpdating: (state: AkariApiState) => boolean
  setUpdating: (state: AkariApiState, isUpdating: boolean) => void
}

export const AKARI_API_CACHED_RESOURCES: CachedResource<any>[] = [
  {
    id: 'supportedQueues',
    name: 'supported queues',
    resource: 'sgp/supported-queues',
    cachePath: 'config/v1/sgp/supported-queues.json',
    intervalMs: AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AkariSupportedQueuesConfigSchema,
    getCurrentUpdatedAt: (state) => state.supportedQueues.updatedAt,
    apply: (state, data) => state.setSupportedQueues(data),
    getUpdating: (state) => state.isUpdatingSupportedQueues,
    setUpdating: (state, isUpdating) => state.setUpdatingSupportedQueues(isUpdating)
  },
  {
    id: 'leagueServers',
    name: 'league servers',
    resource: 'sgp/league-servers',
    cachePath: 'config/v1/sgp/league-servers.json',
    intervalMs: AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AkariLeagueServersConfigSchema,
    getCurrentUpdatedAt: (state) => state.leagueServers.updatedAt,
    apply: (state, data) => state.setLeagueServers(data),
    getUpdating: (state) => state.isUpdatingLeagueServers,
    setUpdating: (state, isUpdating) => state.setUpdatingLeagueServers(isUpdating)
  },
  {
    id: 'ongoingGameConfig',
    name: 'ongoing game config',
    resource: 'ongoing-game/config',
    cachePath: 'config/v1/ongoing-game/config.json',
    intervalMs: AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AkariOngoingGameConfigSchema,
    getCurrentUpdatedAt: (state) => state.ongoingGameConfig.updatedAt,
    apply: (state, data) => state.setOngoingGameConfig(data),
    getUpdating: (state) => state.isUpdatingOngoingGameConfig,
    setUpdating: (state, isUpdating) => state.setUpdatingOngoingGameConfig(isUpdating)
  },
  {
    id: 'autoSelectGroups',
    name: 'auto select groups',
    resource: 'auto-select/groups',
    cachePath: 'config/v1/auto-select/groups.json',
    intervalMs: AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AkariAutoSelectGroupsConfigSchema,
    getCurrentUpdatedAt: (state) => state.autoSelectGroups.updatedAt,
    apply: (state, data) => state.setAutoSelectGroups(data),
    getUpdating: (state) => state.isUpdatingAutoSelectGroups,
    setUpdating: (state, isUpdating) => state.setUpdatingAutoSelectGroups(isUpdating)
  }
]
