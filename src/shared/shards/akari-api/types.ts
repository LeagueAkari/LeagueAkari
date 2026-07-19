export const DEFAULT_AKARI_API_BASE_URL = 'https://akari-api.yuru-yuri.com'
export const DEFAULT_AKARI_STATIC_BASE_URL = 'https://akari-static.yuru-yuri.com'

export interface AkariServiceBaseUrls {
  api: string
  static: string
}

export const DEFAULT_AKARI_SERVICE_BASE_URLS: Readonly<AkariServiceBaseUrls> = Object.freeze({
  api: DEFAULT_AKARI_API_BASE_URL,
  static: DEFAULT_AKARI_STATIC_BASE_URL
})

export interface AkariApiBootstrapDocument {
  schemaVersion: 1
  generation: number
  baseUrls: AkariServiceBaseUrls
}

export type AkariApiLanguage = 'zh-CN' | 'en'
export const DEFAULT_AKARI_API_LANGUAGE: AkariApiLanguage = 'zh-CN'

export type AkariNoticeSeverity = 'low' | 'medium' | 'high'

export interface AkariNotice {
  revision: string
  language: AkariApiLanguage
  severity: AkariNoticeSeverity
  summary: string
  contentType: 'text/markdown'
  content: string
  updatedAt: string
}

export interface AkariReleaseArtifact {
  platform: string
  arch: string
  fileName: string
  size: number
  contentType: string
  sha256: string | null
  downloadUrl: string
}

export interface AkariRelease {
  version: string
  publishedAt: string
  description: string
  artifacts: AkariReleaseArtifact[]
}

export interface AkariApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export interface AkariStatisticsRecordCreated {
  id: number
}

export interface AkariConfigMetadata {
  updatedAt: string
}

export interface AkariAutoSelectTargetGameMode {
  gameMode: string
  queueTypes: string[]
}

export interface AkariAutoSelectGroup {
  groupId: string
  name: {
    'zh-CN': string
    en: string
  }
  iconPath: string
  isCustom: boolean
  targetGameModes: AkariAutoSelectTargetGameMode[]
  positions: string[]
  additionalPicks: number[]
  additionalBans: number[]
  excludedPicks: number[]
  excludedBans: number[]
}

export interface AkariAutoSelectGroupsConfig extends AkariConfigMetadata {
  groups: AkariAutoSelectGroup[]
}

export interface AkariOngoingGameConfig extends AkariConfigMetadata {
  spotlight: {
    deobfuscation: boolean
    gsmByPuuid: boolean
    spectatorByPuuid: boolean
  }
}

export interface AkariLeagueServerEndpoint {
  matchHistory: string
  common: string
  isTencent: boolean
  regionPathParam?: string
}

export interface AkariLeagueServersConfig extends AkariConfigMetadata {
  servers: Record<string, AkariLeagueServerEndpoint>
  serverNames: Record<string, Record<string, string>>
}

export interface AkariSupportedQueuesConfig extends AkariConfigMetadata {
  queues: number[]
}

export interface AkariApiConfigResourceMap {
  'auto-select/groups': AkariAutoSelectGroupsConfig
  'ongoing-game/config': AkariOngoingGameConfig
  'sgp/league-servers': AkariLeagueServersConfig
  'sgp/supported-queues': AkariSupportedQueuesConfig
}

export type AkariApiConfigResource = keyof AkariApiConfigResourceMap
