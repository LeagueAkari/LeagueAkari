import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SendableItem, TemplateDef, useInGameSendStore } from './store'

const MAIN_SHARD_NAMESPACE = 'in-game-send-main'

// copied from main/shards/remote-config/repository.ts
export interface InGameSendTemplateCatalog {
  templates: Array<{
    id: string
    name: string
    type: string
    description: string
  }>
}

@Shard(InGameSendRenderer.id)
export class InGameSendRenderer implements IAkariShardInitDispose {
  static id = 'in-game-send-renderer'

  static CANCEL_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE}/cancel`

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  async onInit() {
    const store = useInGameSendStore()

    this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  getSendableItemShortcutTargetId(id: string) {
    return {
      ally: `${MAIN_SHARD_NAMESPACE}/sendable-item/${id}/send-ally`,
      enemy: `${MAIN_SHARD_NAMESPACE}/sendable-item/${id}/send-enemy`,
      all: `${MAIN_SHARD_NAMESPACE}/sendable-item/${id}/send-all`
    }
  }

  setCancelShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'cancelShortcut', shortcut)
  }

  createSendableItem(data?: Partial<SendableItem>): Promise<SendableItem | undefined> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'createSendableItem', data)
  }

  updateSendableItem(id: string, data: Partial<SendableItem>): Promise<SendableItem | undefined> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateSendableItem', id, data)
  }

  removeSendableItem(id: string): Promise<boolean> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'removeSendableItem', id)
  }

  shortcutTargetId(id: string) {
    return `${MAIN_SHARD_NAMESPACE}/custom-send/${id}`
  }

  setSendInterval(interval: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'sendInterval', interval)
  }

  dryRunStatsSend(target = 'all'): Promise<
    {
      data: string[]
    } & (
      | { error: true; reason: string; extra: string }
      | { error: false; reason: null; extra: string }
    )
  > {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'dryRunStatsSend', target)
  }

  createTemplate(data?: Partial<TemplateDef>): Promise<TemplateDef | undefined> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'createTemplate', data)
  }

  createPresetTemplate(key: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'createPresetTemplate', key)
  }

  updateTemplate(id: string, data: Partial<TemplateDef>): Promise<TemplateDef | undefined> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateTemplate', id, data)
  }

  removeTemplate(id: string): Promise<boolean> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'removeTemplate', id)
  }

  getDryRunResult(
    templateId: string,
    target: 'ally' | 'enemy' | 'all'
  ): Promise<{
    messages: string[]
    error: string | null
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getDryRunResult', templateId, target)
  }

  onTemplateExecutionFailed(callback: (data: { templateId: string; error: string }) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'error-template-execution-failed', callback)
  }

  onTemplateExecutionSucceeded(callback: (data: { templateId: string }) => void) {
    return this._ipc.onEventVue(
      MAIN_SHARD_NAMESPACE,
      'success-template-execution-succeeded',
      callback
    )
  }

  async getInGameSendTemplateCatalog(): Promise<InGameSendTemplateCatalog> {
    return await this._ipc.call(MAIN_SHARD_NAMESPACE, 'getInGameSendTemplateCatalog')
  }

  downloadTemplateFromRemote(id: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'downloadTemplateFromRemote', id)
  }
}
