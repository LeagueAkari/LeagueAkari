import { formatI18nOrdinal } from '@shared/i18n'
import i18next from 'i18next'
import { useTranslation } from 'i18next-vue'

export function useGameResultName() {
  const { t } = useTranslation()

  return (subteamPlacement: number | null, result: string, isSurrender = false, locale: string) => {
    if (subteamPlacement !== null && subteamPlacement !== 0) {
      return formatI18nOrdinal(subteamPlacement, locale)
    }

    if (isSurrender && result !== 'remake') {
      return t('MatchCard.result.surrender')
    }

    return t(`MatchCard.result.${result}`, { defaultValue: result })
  }
}

export function useTeamName() {
  const { t } = useTranslation()

  return (teamIdentifier: string) => {
    const key = `teams.${teamIdentifier}`

    if (i18next.exists(key, { ns: 'common' })) {
      return t(key, { ns: 'common' })
    }

    return teamIdentifier
  }
}

export function useFrameEventType() {
  const { t } = useTranslation()

  return (type: string) => {
    return t(`MatchCard.frameEventType.${type}`, { defaultValue: type })
  }
}

export function useBuildingType() {
  const { t } = useTranslation()

  return (type: string) => {
    return t(`MatchCard.buildingType.${type}`, { defaultValue: type })
  }
}

export function useTowerType() {
  const { t } = useTranslation()

  return (type: string) => {
    return t(`MatchCard.towerType.${type}`, { defaultValue: type })
  }
}

export function useLaneType() {
  const { t } = useTranslation()

  return (type: string) => {
    return t(`MatchCard.laneType.${type}`, { defaultValue: type })
  }
}

export function usePosition() {
  const { t } = useTranslation()

  return (position: string) => {
    return t(`MatchCard.position.${position}`, { defaultValue: position })
  }
}
