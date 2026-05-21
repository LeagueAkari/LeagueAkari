import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatBytes, formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import { watch, watchEffect } from 'vue'

import { useInstance } from '..'
import { useAppCommonStore } from '../app-common/store'
import { useBackgroundTasksStore } from '../background-tasks/store'
import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { RemoteConfigRenderer } from '../remote-config'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import { WindowManagerRenderer } from '../window-manager'
import { useSelfUpdateStore } from './store'

const MAIN_SHARD_NAMESPACE = 'self-update-main'

@Shard(SelfUpdateRenderer.id)
export class SelfUpdateRenderer implements IAkariShardInitDispose {
  static id = 'self-update-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer,
    @Dep(RemoteConfigRenderer) readonly _remoteConfig: RemoteConfigRenderer
  ) {
    // @ts-ignore
    window.selfUpdateShard = this
  }

  private _watchUpdateProgressShow() {
    const store = useSelfUpdateStore()
    const taskStore = useBackgroundTasksStore()

    const windowManager = useInstance(WindowManagerRenderer)

    const { t } = useTranslation()
    const taskId = `${SelfUpdateRenderer.id}/update`

    watch(
      () => store.updateProgressInfo,
      (info) => {
        if (!info) {
          taskStore.removeTask(taskId)
          return
        }

        if (!taskStore.hasTask(taskId)) {
          taskStore.createTask(taskId, {
            name: () => t('self-update-renderer.self-update-task.name'),
            description: '',
            createAt: Date.now(),
            progress: 0,
            actions: [
              {
                label: () => t('self-update-renderer.self-update-task.cancelButton'),
                callback: () => {
                  this.cancelUpdate()
                },
                buttonProps: { type: 'warning' }
              }
            ]
          })
        }

        switch (info.phase) {
          case 'downloading':
            taskStore.updateTask(taskId, {
              progress: info.downloadingProgress,
              description: () =>
                t('self-update-renderer.self-update-task.downloading', {
                  progress: (info.downloadingProgress * 100).toFixed(2),
                  eta: formatSeconds(info.downloadTimeLeft),
                  avgSpeed: formatBytes(info.averageDownloadSpeed)
                })
            })
            break
          case 'download-failed':
            taskStore.updateTask(taskId, {
              progress: null,
              status: 'error',
              description: () => t('self-update-renderer.self-update-task.download-failed')
            })
            break
          case 'waiting-for-restart':
            taskStore.updateTask(taskId, {
              progress: 1,
              status: 'success',
              description: () => t('self-update-renderer.self-update-task.waiting-for-restart'),
              actions: [
                {
                  label: () => t('self-update-renderer.self-update-task.cancelButton'),
                  callback: () => {
                    this.cancelUpdate()
                  },
                  buttonProps: { type: 'warning' }
                },
                {
                  label: () => t('self-update-renderer.self-update-task.closeButton'),
                  callback: () => {
                    windowManager.mainWindow.closeForce()
                  },
                  buttonProps: { type: 'primary' }
                }
              ]
            })
        }
      },
      { immediate: true }
    )
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
            title: () => t('self-update-renderer.title'),
            content: () =>
              t('self-update-renderer.lastUpdateSuccess', {
                version: appCommonStore.version
              }),
            duration: 4000,
            closable: true
          })
        } else {
          notification.warning({
            title: () => t('self-update-renderer.title'),
            content: () => <div>{t('self-update-renderer.lastUpdateFailed')}</div>,
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

    this._setupInAppScope.addSetupFn(() => this._watchUpdateProgressShow())
    this._setupInAppScope.addSetupFn(() => this._watchLastUpdateResult())
  }
}
