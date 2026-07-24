import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { isChampionNameMatch, isChampionNameMatchKeywords } from '@shared/utils/string-match'

export function useChampionNameMatch() {
  const resources = useAkariResourceProvider()

  const match = (pattern: string, label: string, value?: number) => {
    try {
      if (value !== undefined) {
        return (
          isChampionNameMatchKeywords(pattern, [
            label,
            ...resources.champions.searchKeywords(value)
          ]) || value.toString().includes(pattern)
        )
      }

      return isChampionNameMatch(pattern, label)
    } catch {
      return (
        isChampionNameMatch(pattern, label) || Boolean(value && value.toString().includes(pattern))
      )
    }
  }

  return { match }
}
