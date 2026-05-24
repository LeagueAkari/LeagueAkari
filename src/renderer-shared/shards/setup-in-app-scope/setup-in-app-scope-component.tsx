import { useInstance } from '@renderer-shared/shards'
import { defineComponent } from 'vue'

import { SetupInAppScopeRenderer } from '.'

export const SetupInAppScope = defineComponent({
  name: '__AkariSetupInAppScope',
  setup() {
    const setupInAppScope = useInstance(SetupInAppScopeRenderer)

    setupInAppScope.runSetupFns()

    return () => <>{setupInAppScope.renderVNodes.map((fn) => fn())}</>
  }
})
