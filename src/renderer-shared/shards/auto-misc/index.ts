import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type {
  AutoMiscRankedDivision,
  AutoMiscRankedStatus,
  AutoMiscRankedTier
} from '@shared/shards/auto-misc'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  AUTO_MISC_MAIN_NAMESPACE,
  AUTO_MISC_RENDERER_NAMESPACE,
  type AutoMiscRendererContext
} from './context'
import { syncAutoMiscSettings } from './settings-sync'
import { useAutoMiscStore } from './store'

const MAIN_SHARD_NAMESPACE = AUTO_MISC_MAIN_NAMESPACE

@Shard(AutoMiscRenderer.id)
export class AutoMiscRenderer implements IAkariShardInitDispose {
  static id = AUTO_MISC_RENDERER_NAMESPACE

  private readonly _context: AutoMiscRendererContext

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc: this._ipc,
      piniaMobxUtils,
      settingUtils: this._settingUtils
    }
  }

  setAutoReplyEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoReplyEnabled', enabled)
  }

  setAutoReplyText(text: string) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoReplyText', text)
  }

  setAutoReplyEnableOnAway(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoReplyEnableOnAway', enabled)
  }

  setLockOfflineStatus(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'lockOfflineStatus', enabled)
  }

  setAutoSetStatusMessageEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoSetStatusMessageEnabled', enabled)
  }

  setStatusMessage(message: string) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'statusMessage', message)
  }

  setAutoSetRankedStatusEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoSetRankedStatusEnabled', enabled)
  }

  setRankedStatus(rankedStatus: AutoMiscRankedStatus) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'rankedStatus', rankedStatus)
  }

  setRankedQueue(queue: string) {
    const store = useAutoMiscStore()
    return this.setRankedStatus({ ...store.settings.rankedStatus, queue })
  }

  setRankedTier(tier: AutoMiscRankedTier) {
    const store = useAutoMiscStore()
    return this.setRankedStatus({ ...store.settings.rankedStatus, tier })
  }

  setRankedDivision(division: AutoMiscRankedDivision) {
    const store = useAutoMiscStore()
    return this.setRankedStatus({ ...store.settings.rankedStatus, division })
  }

  applyStatusMessage(message?: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'applyStatusMessage', message)
  }

  applyRankedStatus(rankedStatus?: AutoMiscRankedStatus) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'applyRankedStatus', rankedStatus)
  }

  async onInit() {
    await syncAutoMiscSettings(this._context)
  }
}
