import type { LoggerRenderer } from '@renderer-shared/shards/logger'

export const AKARI_NAVIGATION_RENDERER_NAMESPACE = 'akari-navigation-renderer'
export const AKARI_NAVIGATION_DEFAULT_DEADLINE_MS = 10_000

export interface AkariNavigationRendererContext {
  namespace: string
  logger: LoggerRenderer
}
