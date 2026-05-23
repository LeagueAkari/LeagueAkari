import { EXTRA_ASSETS_MAIN_NAMESPACE, type ExtraAssetsRendererContext } from './context'
import { useExtraAssetsStore } from './store'

export async function syncExtraAssetsState(context: ExtraAssetsRendererContext) {
  const store = useExtraAssetsStore()

  await context.piniaMobxUtils.sync(EXTRA_ASSETS_MAIN_NAMESPACE, 'gtimg', store.gtimg)
  await context.piniaMobxUtils.sync(EXTRA_ASSETS_MAIN_NAMESPACE, 'fandom', store.fandom)
}
