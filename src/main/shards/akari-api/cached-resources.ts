import {
  type AkariApiConfigResource,
  AkariAutoSelectGroupsConfigSchema,
  AkariFeatureGateSnapshotSchema,
  AkariLeagueServersConfigSchema,
  AkariSupportedQueuesConfigSchema
} from '@shared/shards/akari-api'

import {
  AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
  AKARI_API_FEATURE_GATES_UPDATE_INTERVAL
} from './context'
import type { AkariApiState } from './state'

interface CachedResourceSchema<T extends object> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: unknown }
}

export interface CachedResource<T extends object> {
  id: string
  name: string
  resource: AkariApiConfigResource
  cachePath: string
  intervalMs: number
  schema: CachedResourceSchema<T>
  getTimestamp: (data: T) => string
  getCurrentTimestamp: (state: AkariApiState) => string
  apply: (state: AkariApiState, data: T) => void
  getUpdating: (state: AkariApiState) => boolean
  setUpdating: (state: AkariApiState, isUpdating: boolean) => void
}

export const AKARI_API_CACHED_RESOURCES: CachedResource<any>[] = [
  {
    id: 'featureGates',
    name: 'feature gates',
    resource: 'app/feature-gates',
    cachePath: 'config/v1/app/feature-gates.json',
    intervalMs: AKARI_API_FEATURE_GATES_UPDATE_INTERVAL,
    schema: AkariFeatureGateSnapshotSchema,
    getTimestamp: (data) => data.updatedAt,
    getCurrentTimestamp: (state) => state.featureGates?.updatedAt ?? '1970-01-01T00:00:00.000Z',
    apply: (state, data) => state.setFeatureGates(data),
    getUpdating: (state) => state.isUpdatingFeatureGates,
    setUpdating: (state, isUpdating) => state.setUpdatingFeatureGates(isUpdating)
  },
  {
    id: 'supportedQueues',
    name: 'supported queues',
    resource: 'sgp/supported-queues',
    cachePath: 'config/v1/sgp/supported-queues.json',
    intervalMs: AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AkariSupportedQueuesConfigSchema,
    getTimestamp: (data) => data.updatedAt,
    getCurrentTimestamp: (state) => state.supportedQueues.updatedAt,
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
    getTimestamp: (data) => data.updatedAt,
    getCurrentTimestamp: (state) => state.leagueServers.updatedAt,
    apply: (state, data) => state.setLeagueServers(data),
    getUpdating: (state) => state.isUpdatingLeagueServers,
    setUpdating: (state, isUpdating) => state.setUpdatingLeagueServers(isUpdating)
  },
  {
    id: 'autoSelectGroups',
    name: 'auto select groups',
    resource: 'auto-select/groups',
    cachePath: 'config/v1/auto-select/groups.json',
    intervalMs: AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL,
    schema: AkariAutoSelectGroupsConfigSchema,
    getTimestamp: (data) => data.updatedAt,
    getCurrentTimestamp: (state) => state.autoSelectGroups.updatedAt,
    apply: (state, data) => state.setAutoSelectGroups(data),
    getUpdating: (state) => state.isUpdatingAutoSelectGroups,
    setUpdating: (state, isUpdating) => state.setUpdatingAutoSelectGroups(isUpdating)
  }
]
