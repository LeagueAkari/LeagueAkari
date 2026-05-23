import { STORAGE_MAIN_NAMESPACE, type StorageRendererContext } from './context'
import { useStorageStore } from './store'

export async function syncStorageState(context: StorageRendererContext) {
  const store = useStorageStore()

  await context.piniaMobxUtils.sync(STORAGE_MAIN_NAMESPACE, 'state', store)
}
