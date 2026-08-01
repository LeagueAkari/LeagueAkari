import { useAkariNavigationStep } from '@renderer-shared/shards/akari-navigation'
import { type Ref, nextTick, onScopeDispose, readonly, ref } from 'vue'

const SETTINGS_NAVIGATION_TARGET_STEP_KEY_PREFIX = 'settings-target:'

export function createSettingsNavigationTargetStepKey(settingId: string) {
  return `${SETTINGS_NAVIGATION_TARGET_STEP_KEY_PREFIX}${settingId}`
}

const HIGHLIGHT_DURATION_MS = 3400

function isTargetVisible(element: HTMLElement) {
  return element.isConnected && element.getClientRects().length > 0
}

export function useSettingsNavigationTarget(
  settingId: string | undefined,
  element: Readonly<Ref<HTMLElement | null>>
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

  if (settingId) {
    useAkariNavigationStep({
      key: createSettingsNavigationTargetStepKey(settingId),
      activate: async (_payload, { signal }) => {
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
        return undefined
      }
    })
  }

  onScopeDispose(clearHighlight)

  return readonly(highlighted)
}
