import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStorageStore = defineStore('shard:storage-renderer', () => {
  const usingHigherVersionDb = ref(false)

  return {
    usingHigherVersionDb
  }
})
