import { toRaw } from 'vue'

import {
  OPGG_RENDERER_NAMESPACE,
  type OpggPreferenceUpdate,
  type OpggRendererContext
} from './context'
import { useOpggStore } from './store'

export class OpggPreferencesService {
  constructor(private readonly context: OpggRendererContext) {}

  async restore() {
    const store = useOpggStore()
    const savedPreferences = await this.context.settingUtils.get(
      OPGG_RENDERER_NAMESPACE,
      'savedPreferences'
    )
    if (savedPreferences) {
      store.savedPreferences = savedPreferences
    }
  }

  async update(options: OpggPreferenceUpdate) {
    const store = useOpggStore()
    store.savedPreferences = { ...store.savedPreferences, ...options }
    return this.context.settingUtils.set(
      OPGG_RENDERER_NAMESPACE,
      'savedPreferences',
      toRaw(store.savedPreferences)
    )
  }

  async migrate() {
    const item = localStorage.getItem('opgg-flash-position')

    if (item !== null) {
      try {
        const flashPosition = JSON.parse(item) as 'auto' | 'd' | 'f'

        if (flashPosition !== 'auto' && flashPosition !== 'd' && flashPosition !== 'f') {
          return
        }

        await this.update({
          flashPosition
        })

        this.context.logger.info('opgg', 'Migrated flash position from local storage', {
          flashPosition
        })
      } catch (error) {
        this.context.logger.error('opgg', 'Failed to migrate flash position from local storage', {
          error
        })
      } finally {
        localStorage.removeItem('opgg-flash-position')
      }
    }
  }
}
