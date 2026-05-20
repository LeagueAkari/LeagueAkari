import type { InGameSendMainContext } from './context'
import { IN_GAME_SEND_MAIN_NAMESPACE } from './context'
import type { InGameSendExecutor } from './send-executor'
import type { InGameSendSendableItemManager } from './sendable-item-manager'
import { SendableItem, TemplateDef } from './state'
import type { InGameSendTemplateManager } from './template-manager'

export class InGameSendIpcHandlers {
  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _sendableItems: InGameSendSendableItemManager,
    private readonly _templates: InGameSendTemplateManager,
    private readonly _sendExecutor: InGameSendExecutor
  ) {}

  register() {
    const { ipc, remoteConfig } = this._context

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'createSendableItem',
      (_, data: Partial<SendableItem>) => {
        return this._sendableItems.createSendableItem(data)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'updateSendableItem',
      (_, id: string, data: Partial<SendableItem>) => {
        return this._sendableItems.updateSendableItem(id, data)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'removeSendableItem', (_, id: string) => {
      return this._sendableItems.removeSendableItem(id)
    })

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'createTemplate', (_, data?: Partial<TemplateDef>) => {
      return this._templates.createTemplate(data)
    })

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'createPresetTemplate', (_, id: string) => {
      return this._templates.createPresetTemplate(id)
    })

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'updateTemplate',
      (_, id: string, data: Partial<TemplateDef>) => {
        return this._templates.updateTemplate(id, data)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'removeTemplate', (_, id: string) => {
      this._templates.removeTemplate(id)
    })

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'getDryRunResult',
      (_, templateId: string, target: 'ally' | 'enemy' | 'all') => {
        return this._templates.getDryRunResult(templateId, target)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'sendTemplateInChampSelectChat',
      (_, templateId: string, target: 'ally' | 'enemy' | 'all') => {
        return this._sendExecutor.sendTemplateInChampSelectChat(templateId, target)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'getInGameSendTemplateCatalog', async () => {
      return (
        await remoteConfig.repo.getInGameSendTemplateCatalog({
          source: remoteConfig.settings.preferredSource,
          repo: 'akari-config'
        })
      ).data
    })

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'downloadTemplateFromRemote', (_, id: string) => {
      return this._templates.downloadTemplateFromRemote(id)
    })
  }
}
