import { useInstance } from '@renderer-shared/shards'
import { defineComponent } from 'vue'
import { Fragment, h } from 'vue'

import { SetupInAppScopeRenderer } from '.'

export const SetupInAppScope = defineComponent({
  name: '__AkariSetupInAppScope',
  setup() {
    const inst = useInstance(SetupInAppScopeRenderer)

    inst.setup()

    return () =>
      h(
        Fragment,
        inst.renderVNodes.map((fn) => fn())
      )
  }
})
