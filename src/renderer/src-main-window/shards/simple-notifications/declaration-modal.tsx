import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { defineComponent, watchEffect } from 'vue'

import { type SimpleNotificationsRendererContext } from './context'
import DeclarationModal from './modals/DeclarationModal.vue'
import { useSimpleNotificationsStore } from './store'

export function registerDeclarationModal(context: SimpleNotificationsRendererContext) {
  const Component = defineComponent({
    setup() {
      const appCommonStore = useAppCommonStore()
      const appCommon = useInstance(AppCommonRenderer)
      const simpleNotificationsStore = useSimpleNotificationsStore()

      watchEffect(() => {
        if (appCommonStore.settings.showFreeSoftwareDeclaration) {
          simpleNotificationsStore.showDeclarationModal = true
        }
      })

      return () => (
        <DeclarationModal
          {...{
            show: simpleNotificationsStore.showDeclarationModal,
            'onUpdate:show': (value: boolean) =>
              (simpleNotificationsStore.showDeclarationModal = value),
            onConfirm: () => {
              appCommon.setShowFreeSoftwareDeclaration(false)
              simpleNotificationsStore.showDeclarationModal = false
            },
            onExit: () => {
              appCommon.exit()
            }
          }}
        />
      )
    }
  })

  context.setupInAppScope.addRenderVNode(() => <Component />)
}
