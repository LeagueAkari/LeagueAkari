import { useChampionData } from '@secondary-window/context'
import { useChampionDataStore } from '@secondary-window/shards/champion-data/store'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function useCurrentGameTabMenu(source: ChampionDataSourceId, isManaged: () => boolean) {
  const { t } = useTranslation()
  const store = useChampionDataStore()
  const { game, currentGame } = useChampionData()

  const options = computed(() => {
    if (!isManaged()) {
      return []
    }

    if (game.status === 'preset') {
      return [{ key: 'preset', label: t('opgg.automation.status.preset'), disabled: true }]
    }

    if (source === store.effectiveDefaultSource && game.status === 'applyError') {
      return [
        {
          key: 'retry-apply',
          label: t('opgg.automation.retryApply'),
          disabled: store.applying.runes
        }
      ]
    }

    return []
  })

  return { options, retryApplication: () => currentGame.retryApplication() }
}
