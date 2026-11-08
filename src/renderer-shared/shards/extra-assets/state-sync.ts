import { OPGG_ARAM_BALANCE_SYNC_NAMESPACE } from '@shared/shards/extra-assets'

import {
  EXTRA_ASSETS_MAIN_NAMESPACE,
  type ExtraAssetsRendererConfig,
  type ExtraAssetsRendererContext
} from './context'
import { useExtraAssetsStore } from './store'

export async function syncExtraAssetsState(
  context: ExtraAssetsRendererContext,
  config?: ExtraAssetsRendererConfig
) {
  const store = useExtraAssetsStore()

  await context.piniaMobxUtils.sync(EXTRA_ASSETS_MAIN_NAMESPACE, 'gtimg', store.gtimg)

  if (config?.subscribeAramBalance) {
    await context.piniaMobxUtils.sync(OPGG_ARAM_BALANCE_SYNC_NAMESPACE, 'resources', store.opgg)
  }
}
