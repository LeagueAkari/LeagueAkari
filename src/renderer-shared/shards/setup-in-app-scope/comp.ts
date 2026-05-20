import { useInstance } from '@renderer-shared/shards'
import { defineComponent } from 'vue'
import { Fragment, h } from 'vue'

import { SetupInAppScopeRenderer } from '.'

export const SetupInAppScope = defineComponent({
  name: '__AkariSetupInAppScope',
  setup() {
    const setupInAppScope = useInstance(SetupInAppScopeRenderer)

    setupInAppScope.runSetupFns()

    return () =>
      h(
        Fragment,
        setupInAppScope.renderVNodes.map((fn) => fn())
      )
  }
})
