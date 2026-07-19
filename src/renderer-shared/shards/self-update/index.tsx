import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import { watchEffect } from 'vue'

import { useAppCommonStore } from '../app-common/store'
import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import { useSelfUpdateStore } from './store'

const MAIN_SHARD_NAMESPACE = 'self-update-main'

@Shard(SelfUpdateRenderer.id)
export class SelfUpdateRenderer implements IAkariShardInitDispose {
  static id = 'self-update-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    // @ts-ignore
    window.selfUpdateShard = this
  }

  private _watchLastUpdateResult() {
    const appCommonStore = useAppCommonStore()
    const selfUpdateStore = useSelfUpdateStore()
    const { t } = useTranslation()
    const notification = useNotification()

    watchEffect(() => {
      if (selfUpdateStore.lastUpdateResult) {
        if (selfUpdateStore.lastUpdateResult.success) {
          notification.success({
            title: () => t('selfUpdate.tasks.title'),
            content: () =>
              t('selfUpdate.tasks.lastUpdateSuccess', {
                version: appCommonStore.version
              }),
            duration: 4000,
            closable: true
          })
        } else {
          notification.warning({
            title: () => t('selfUpdate.tasks.title'),
            content: () => <div>{t('selfUpdate.tasks.lastUpdateFailed')}</div>,
            duration: 1e10,
            closable: true
          })
        }
      }
    })
  }

  checkUpdates() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'checkUpdates')
  }

  startUpdate() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'startUpdate')
  }

  forceStartUpdate() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'forceStartUpdate')
  }

  cancelUpdate() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'cancelUpdate')
  }

  openNewUpdatesDir() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'openNewUpdatesDir')
  }

  setAutoDownloadUpdates(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoDownloadUpdates', enabled)
  }

  setIgnoreVersion(version: string | null) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'ignoreVersion', version)
  }

  uninstallApp() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'uninstallApp')
  }

  async onInit() {
    const store = useSelfUpdateStore()

    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._setupInAppScope.addSetupFn(() => this._watchLastUpdateResult())
  }
}
