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

export const AKARI_API_LANGUAGES = ['zh-CN', 'en'] as const
export type AkariApiLanguage = (typeof AKARI_API_LANGUAGES)[number]
export const DEFAULT_AKARI_API_LANGUAGE: AkariApiLanguage = 'zh-CN'

export function isAkariApiLanguage(value: unknown): value is AkariApiLanguage {
  return AKARI_API_LANGUAGES.includes(value as AkariApiLanguage)
}

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

export interface AkariReleaseNotes {
  revision: string
  language: AkariApiLanguage
  contentType: 'text/markdown'
  content: string
}

export interface AkariReleaseArtifact {
  platform: string
  arch: string
  fileName: string
  size: number | null
  contentType: string
  sha256: string | null
  downloadUrl: string
}

export interface AkariRelease {
  version: string
  publishedAt: string
  notes: AkariReleaseNotes
  artifacts: AkariReleaseArtifact[]
}

export interface AkariApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export interface AkariLastResortArchiveFile {
  name: string
  size: number
  downloadUrl: string
  contentType: string
}

/** Compatibility response used only while the legacy updater fallback remains available. */
export interface AkariLastResortRelease {
  version?: string
  publishedAt?: string
  descriptions?: Partial<Record<AkariApiLanguage, string>>
  archiveFileGitHub?: AkariLastResortArchiveFile
  archiveFileGitee?: AkariLastResortArchiveFile
}

export interface AkariConfigMetadata {
  schemaVersion: number
  updatedAt: string
}

export interface AkariAutoSelectTargetGameMode {
  gameMode: string
  queueTypes: string[]
}

export interface AkariAutoSelectGroup {
  groupId: string
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
  regionPathParam?: string
}

export interface AkariLeagueServersConfig extends AkariConfigMetadata {
  servers: Record<string, AkariLeagueServerEndpoint>
  tencentServerMatchHistoryInteroperability: string[]
  tencentServerSummonerInteroperability: string[]
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

export const AKARI_API_CONFIG_RESOURCES = [
  'auto-select/groups',
  'ongoing-game/config',
  'sgp/league-servers',
  'sgp/supported-queues'
] as const satisfies readonly AkariApiConfigResource[]

export function isAkariApiConfigResource(value: unknown): value is AkariApiConfigResource {
  return AKARI_API_CONFIG_RESOURCES.includes(value as AkariApiConfigResource)
}
