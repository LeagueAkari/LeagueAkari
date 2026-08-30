import type { FeatureGateDevOverride } from '@shared/shards/feature-gating'

import type { AkariIpcMain } from '../ipc'
import type { FeatureGateDevOverrideController } from './dev-override-controller'

export class FeatureGatingIpcHandlers {
  constructor(
    private readonly _namespace: string,
    private readonly _ipc: AkariIpcMain,
    private readonly _devOverrideController: FeatureGateDevOverrideController
  ) {}

  register() {
    this._ipc.onCall(
      this._namespace,
      'setDevOverride',
      (_, key: string, value: FeatureGateDevOverride | null) =>
        this._devOverrideController.setDevOverride(key, value)
    )
  }
}
