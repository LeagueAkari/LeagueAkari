export type LcConnectionStateType = 'connecting' | 'connected' | 'disconnected'

export interface UxCommandLine {
  port: number
  pid: number
  authToken: string
  certificate: string
  region: string
  rsoPlatformId: string
  riotClientPort: number
  riotClientAuthToken: string
}

export interface InitializationProgress {
  currentId: string | null
  finished: string[]
  all: string[]
}
