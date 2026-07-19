import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'

export type UpdateStatusKind = 'available' | UpdateProgressInfo['phase']
export type UpdateStatusPhase = 'available' | 'downloading' | 'ready'

export interface UpdateStatusDisplay {
  kind: UpdateStatusKind
  phase: UpdateStatusPhase
  progress: number
}

export function resolveUpdateStatusDisplay(
  release: SelfUpdateReleaseInfo | null,
  updateProgressInfo: UpdateProgressInfo | null,
  ignoreVersion: string | null
): UpdateStatusDisplay | null {
  if (!release?.isUpdateSupported) {
    return null
  }

  if (updateProgressInfo) {
    switch (updateProgressInfo.phase) {
      case 'downloading':
        return {
          kind: 'downloading',
          phase: 'downloading',
          progress: Math.min(100, Math.max(0, updateProgressInfo.downloadingProgress * 100))
        }
      case 'waiting-for-restart':
        return {
          kind: 'waiting-for-restart',
          phase: 'ready',
          progress: 100
        }
      case 'download-failed':
        return {
          kind: 'download-failed',
          phase: 'available',
          progress: 100
        }
    }
  }

  if (release.isNew && release.version !== ignoreVersion) {
    return {
      kind: 'available',
      phase: 'available',
      progress: 100
    }
  }

  return null
}
