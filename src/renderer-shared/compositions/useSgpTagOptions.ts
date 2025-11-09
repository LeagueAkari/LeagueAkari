import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function useSgpTagOptions() {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()

  return computed(() => {
    return [
      {
        label: t('sgpMatchHistoryTags.all', { ns: 'common' }),
        value: 'all'
      },
      {
        label: lcs.gameData.queues[420]?.name || t('sgpMatchHistoryTags.q_420', { ns: 'common' }),
        value: `q_420`
      },
      {
        label: lcs.gameData.queues[430]?.name || t('sgpMatchHistoryTags.q_430', { ns: 'common' }),
        value: `q_430`
      },
      {
        label: lcs.gameData.queues[440]?.name || t('sgpMatchHistoryTags.q_440', { ns: 'common' }),
        value: `q_440`
      },
      {
        label: lcs.gameData.queues[450]?.name || t('sgpMatchHistoryTags.q_450', { ns: 'common' }),
        value: `q_450`
      },
      {
        label: lcs.gameData.queues[480]?.name || t('sgpMatchHistoryTags.q_480', { ns: 'common' }),
        value: `q_480`
      },
      {
        label: lcs.gameData.queues[1700]?.name || t('sgpMatchHistoryTags.q_1700', { ns: 'common' }),
        value: 'q_1700'
      },
      {
        label: lcs.gameData.queues[490]?.name || t('sgpMatchHistoryTags.q_490', { ns: 'common' }),
        value: `q_490`
      },
      {
        label: lcs.gameData.queues[1900]?.name || t('sgpMatchHistoryTags.q_1900', { ns: 'common' }),
        value: `q_1900`
      },
      {
        label: lcs.gameData.queues[900]?.name || t('sgpMatchHistoryTags.q_900', { ns: 'common' }),
        value: `q_900`
      },
      {
        label: lcs.gameData.queues[2300]?.name || t('sgpMatchHistoryTags.q_2300', { ns: 'common' }),
        value: `q_2300`
      },
      {
        label: lcs.gameData.queues[2400]?.name || t('sgpMatchHistoryTags.q_2400', { ns: 'common' }),
        value: `q_2400`
      }
    ]
  })
}
