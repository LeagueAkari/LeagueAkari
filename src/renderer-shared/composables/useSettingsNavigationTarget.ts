import { useAkariNavigationTarget } from '@renderer-shared/composables/useAkariNavigation'
import {
  type MaybeRefOrGetter,
  type ShallowRef,
  nextTick,
  onScopeDispose,
  readonly,
  ref,
  toValue
} from 'vue'

export const SETTINGS_NAVIGATION_TARGET_SCOPE = 'settings-target'

const HIGHLIGHT_DURATION_MS = 2200

function isTargetVisible(element: HTMLElement) {
  return element.isConnected && element.getClientRects().length > 0
}

export function useSettingsNavigationTarget(
  settingId: MaybeRefOrGetter<string | undefined>,
  element: Readonly<ShallowRef<HTMLElement | null>>
) {
  const highlighted = ref(false)
  let highlightTimeout: ReturnType<typeof setTimeout> | null = null

  const clearHighlight = () => {
    highlighted.value = false
    if (highlightTimeout) {
      clearTimeout(highlightTimeout)
      highlightTimeout = null
    }
  }

  useAkariNavigationTarget({
    scope: SETTINGS_NAVIGATION_TARGET_SCOPE,
    destination: settingId,
    enabled: () => Boolean(toValue(settingId) && element.value),
    activate: async (_destination, { signal }) => {
      const targetElement = element.value
      if (!targetElement || !isTargetVisible(targetElement)) {
        return { status: 'unavailable', reason: 'settings-target-not-visible' }
      }

      if (highlighted.value) {
        clearHighlight()
        await nextTick()
      }
      if (signal.aborted) {
        return
      }

      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })
      highlighted.value = true
      highlightTimeout = setTimeout(() => {
        highlighted.value = false
        highlightTimeout = null
      }, HIGHLIGHT_DURATION_MS)

      return { status: 'ready' }
    }
  })

  onScopeDispose(clearHighlight)

  return readonly(highlighted)
}
