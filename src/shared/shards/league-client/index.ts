export type LcConnectionStateType = 'connecting' | 'connected' | 'disconnected'

export interface InitializationProgress {
  currentId: string | null
  finished: string[]
  all: string[]
}
