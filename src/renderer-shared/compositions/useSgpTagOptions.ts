import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const QUEUE_IDS = [420, 430, 440, 450, 480, 1700, 490, 1900, 900, 2300, 4210, 4220, 4250]

export function useSgpTagOptions() {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()

  return computed(() => {
    return [
      {
        label: t('sgpMatchHistoryTags.all', { ns: 'common' }),
        value: 'all'
      },
      ...QUEUE_IDS.map((id) => ({
        label: lcs.gameData.queues[id]?.name || id,
        value: `q_${id}`
      }))
    ]
  })
}
