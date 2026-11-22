import { FLASH_POSITION_TARGET_ID } from '@renderer-shared/components/settings-navigation/targets/secondary-window'
import { createSettingsNavigationTargetStepKey } from '@renderer-shared/components/settings-navigation/useSettingsNavigationTarget'
import { useInstance } from '@renderer-shared/shards'
import {
  AkariNavigationRenderer,
  useAkariNavigationStep
} from '@renderer-shared/shards/akari-navigation'
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'

const SETTINGS_PAGE_STEP_KEY = 'secondary-window.settings'

export function useSecondarySettingsNavigation() {
  const navigation = useInstance(AkariNavigationRenderer)
  const router = useRouter()

  useAkariNavigationStep({
    key: SETTINGS_PAGE_STEP_KEY,
    activate: async () => {
      await router.replace({ name: 'settings' })
      await nextTick()
    }
  })

  navigation.onNavigationRequest(({ targetId }) => {
    if (targetId === FLASH_POSITION_TARGET_ID) {
      void navigation.runtime.navigate([
        { key: SETTINGS_PAGE_STEP_KEY },
        { key: createSettingsNavigationTargetStepKey(targetId) }
      ])
    }
  })
}
