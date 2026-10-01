import type { FeatureGateDevOverride } from '@shared/shards/feature-gating'

import type { AkariIpcMain } from '../ipc'
import { FEATURE_GATING_MAIN_NAMESPACE } from './context'
import type { FeatureGateDevOverrideController } from './dev-override-controller'

export class FeatureGatingIpcHandlers {
  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _devOverrideController: FeatureGateDevOverrideController
  ) {}

  register() {
    this._ipc.onCall(
      FEATURE_GATING_MAIN_NAMESPACE,
      'setDevOverride',
      (_, key: string, value: FeatureGateDevOverride | null, previousKey?: string) =>
        this._devOverrideController.setDevOverride(key, value, previousKey)
    )
  }
}
