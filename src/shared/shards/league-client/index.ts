export type LcConnectionStateType = 'connecting' | 'connected' | 'disconnected'

export interface InitializationProgress {
  currentId: string | null
  finished: string[]
  all: string[]
}

export const lcuUrl = {
  championIcon: (id: number) => `/lol-game-data/assets/v1/champion-icons/${id}.png`
}
