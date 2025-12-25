import { AdditionalResult } from '@shared/types/shards/ongoing-game'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useAdditionalInfoStore = defineStore('additional-info', () => {
  const additional = shallowRef<AdditionalResult>({
    teams: {},
    selections: {},
    teamParticipantGroups: {},
    spells: {}
  })

  return {
    additional
  }
})
