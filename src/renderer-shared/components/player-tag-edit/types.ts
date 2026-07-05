import type { Summoner } from '@shared/data-adapter/summoner'

export type PlayerTagEditPanelSummoner = Pick<
  Summoner,
  'gameName' | 'tagLine' | 'profileIconId' | 'puuid'
>
