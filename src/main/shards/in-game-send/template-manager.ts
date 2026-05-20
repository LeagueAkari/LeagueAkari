import { i18next } from '@main/i18n'
import { isBotQueue } from '@shared/types/league-client/game-data'
import { isPveQueue } from '@shared/types/league-client/match-history'
import { formatError } from '@shared/utils/errors'
import { getSgpServerId } from '@shared/utils/sgp'
import fs from 'node:fs'
import vm from 'node:vm'

import {
  IN_GAME_SEND_AUTO_TEMPLATE_BOOTSTRAP_FLAG,
  IN_GAME_SEND_MAIN_NAMESPACE,
  IN_GAME_SEND_MAX_ITEMS,
  type InGameSendMainContext
} from './context'
import {
  JSContextV1,
  JS_TEMPLATE_CHECK_RESULT,
  JS_TEMPLATE_MIN_VERSION_SUPPORT,
  checkContextV1,
  getExampleTemplate
} from './js-template'
import { SendableItem, TemplateDef } from './state'
import defaultTemplate from './templates/default-template.js?asset'
import { TemplateEnv } from './templates/env-types'

export class InGameSendTemplateManager {
  private readonly _vmContexts: Record<string, vm.Context> = {}

  constructor(private readonly _context: InGameSendMainContext) {}

  checkAndInitTemplates() {
    const { settingService, settings } = this._context
    let somethingWrong = false

    for (const template of settings.templates) {
      const [isValid, metadata, error] = this._checkAndCreateContext(template)
      template.isValid = isValid
      template.type = metadata?.type ?? 'unknown'
      template.error = error ? formatError(error) : null

      if (!isValid) {
        somethingWrong = true
      }
    }

    if (somethingWrong) {
      settingService.set('templates', [...settings.templates])
    }
  }

  watchTemplateAutoDeprecation() {
    const { mobxUtils, settingService, settings } = this._context

    mobxUtils.reaction(
      () => settings.templates,
      (templates) => {
        const existingTemplateIds = new Set(templates.map((template) => template.id))

        let somethingWrong = false
        for (const item of settings.sendableItems) {
          if (item.content.type !== 'template') {
            continue
          }

          if (item.content.templateId && !existingTemplateIds.has(item.content.templateId)) {
            item.content.templateId = null
            somethingWrong = true
          }
        }

        if (somethingWrong) {
          settingService.set('sendableItems', [...settings.sendableItems])
        }
      },
      { fireImmediately: true }
    )
  }

  updateTemplate(id: string, data: Partial<TemplateDef>) {
    const { settingService, settings } = this._context
    const template = settings.templates.find((item) => item.id === id)

    if (!template) {
      return
    }

    if (data.code !== undefined) {
      template.code = data.code

      const [isValid, metadata, error] = this._checkAndCreateContext(template)
      template.isValid = isValid
      template.type = metadata?.type ?? 'unknown'
      template.error = error ? formatError(error) : null
    }

    if (data.name !== undefined) {
      template.name = data.name
    }

    settingService.set('templates', [...settings.templates])

    return template
  }

  removeTemplate(id: string) {
    const { settingService, settings } = this._context
    const index = settings.templates.findIndex((item) => item.id === id)

    if (index === -1) {
      return false
    }

    if (this._vmContexts[id]) {
      delete this._vmContexts[id]
    }

    settingService.set(
      'templates',
      settings.templates.filter((item) => item.id !== id)
    )

    return true
  }

  createTemplate(data?: Partial<TemplateDef>) {
    const { ipc, settingService, settings } = this._context

    if (settings.templates.length >= IN_GAME_SEND_MAX_ITEMS) {
      ipc.sendEvent(IN_GAME_SEND_MAIN_NAMESPACE, 'error-template-max-items-reached')
      return
    }

    const id = crypto.randomUUID()

    const template: TemplateDef = {
      id,
      name:
        data?.name ||
        i18next.t('in-game-send-main.newTemplate', { index: settings.templates.length + 1 }),
      code: data?.code || getExampleTemplate(),
      isValid: true,
      type: 'unknown',
      error: null
    }

    const [isValid, metadata, error] = this._checkAndCreateContext(template)
    template.isValid = isValid
    template.type = metadata?.type ?? 'unknown'
    template.error = error ? formatError(error) : null

    settingService.set('templates', [...settings.templates, template])

    return template
  }

  async createPresetTemplate(id: string) {
    switch (id) {
      case 'ongoing-game-default':
        return this.createTemplate({
          name: i18next.t('in-game-send-main.templatePresets.ongoing-game'),
          code: await fs.promises.readFile(defaultTemplate, 'utf-8')
        })
      default:
        return null
    }
  }

  async downloadTemplateFromRemote(id: string) {
    const { remoteConfig } = this._context
    const catalog = await remoteConfig.repo.getInGameSendTemplateCatalog({
      source: remoteConfig.settings.preferredSource,
      repo: 'akari-config'
    })
    const template = catalog.data.templates.find((item) => item.id === id)

    if (!template) {
      throw new Error(`Template ${id} not found`)
    }

    const { data: code } = await remoteConfig.repo.getRawContent(template.path, {
      source: remoteConfig.settings.preferredSource,
      repo: 'akari-config'
    })

    this.createTemplate({
      name: template.name,
      code,
      type: template.type
    })

    return template
  }

  async autoBootstrapTemplatesIfNeeded(createSendableItem: (data: Partial<SendableItem>) => void) {
    const { logger, remoteConfig, settingService, settings } = this._context
    const alreadyBootstrapped =
      (await settingService._getFromStorage(IN_GAME_SEND_AUTO_TEMPLATE_BOOTSTRAP_FLAG, false)) ===
      true

    if (alreadyBootstrapped) {
      return
    }

    const usableTemplateCount = settings.templates.filter((template) =>
      this._isTemplateUsable(template)
    ).length
    const shouldBootstrap = usableTemplateCount === 0

    if (!shouldBootstrap) {
      return
    }

    logger.info('Auto bootstrap remote templates')

    const repoRequest = {
      source: remoteConfig.settings.preferredSource,
      repo: 'akari-config' as const
    }

    try {
      const catalog = await remoteConfig.repo.getInGameSendTemplateCatalog(repoRequest)
      for (const templateMeta of catalog.data.templates) {
        try {
          const { data: code } = await remoteConfig.repo.getRawContent(
            templateMeta.path,
            repoRequest
          )
          const createdTemplate = this.createTemplate({
            name: `${templateMeta.name} - ${i18next.t('in-game-send-main.templateSuffix')}`,
            code,
            type: templateMeta.type
          })

          if (!createdTemplate) {
            continue
          }

          createSendableItem({
            name: templateMeta.name,
            content: {
              type: 'template',
              templateId: createdTemplate.id
            }
          })
        } catch (error) {
          logger.warn('Auto bootstrap template failed', templateMeta.id, error)
        }
      }
    } catch (error) {
      logger.warn('Auto bootstrap remote templates failed', error)
    } finally {
      await settingService
        ._saveToStorage(IN_GAME_SEND_AUTO_TEMPLATE_BOOTSTRAP_FLAG, true)
        .catch(() => {})
    }
  }

  getDryRunResult(templateId: string, target: 'ally' | 'enemy' | 'all') {
    const context = this._vmContexts[templateId] as JSContextV1
    const { logger } = this._context

    if (!context) {
      logger.warn('Template context not found', templateId)
      return {
        messages: [],
        error: 'Template context not found'
      }
    }

    try {
      return {
        messages: context.getMessages(this._createTemplateEnv({ target })),
        error: null
      }
    } catch (error) {
      logger.warn('Template execution failed', templateId, error)
      return {
        messages: [],
        error: formatError(error)
      }
    }
  }

  getTemplateMessages(templateId: string, target: 'ally' | 'enemy' | 'all') {
    const context = this._vmContexts[templateId] as JSContextV1

    if (!context) {
      this._context.logger.warn('Template context not found', templateId)
      return null
    }

    return context.getMessages(this._createTemplateEnv({ target }))
  }

  private _checkAndCreateContext(
    template: TemplateDef
  ): [boolean, any | null, JS_TEMPLATE_CHECK_RESULT | Error | null] {
    this._vmContexts[template.id] = vm.createContext({
      ...this._getAkariContext(template.id),
      template
    })

    try {
      const script = new vm.Script(template.code)
      script.runInContext(this._vmContexts[template.id])
      const checkResult = checkContextV1(this._vmContexts[template.id])
      if (checkResult !== JS_TEMPLATE_CHECK_RESULT.VALID) {
        return [false, null, checkResult]
      }
    } catch (error: any) {
      this._context.logger.warn('Script validation failed', template.id, error)
      return [false, null, error]
    }

    return [true, this._vmContexts[template.id].getMetadata(), null]
  }

  private _isTemplateUsable(template: TemplateDef) {
    return Boolean(template?.isValid) && template.type !== 'unknown'
  }

  private _createTemplateEnv(options: { target: 'ally' | 'enemy' | 'all' }): TemplateEnv {
    const { appCommon, leagueClient, ongoingGame } = this._context
    const selfPuuid = leagueClient.data.summoner.me?.puuid
    const teams = ongoingGame.state.teams || {}
    const teamEntries = Object.entries(teams)

    const selfTeamEntry = selfPuuid
      ? teamEntries.find(([, members]) => members.includes(selfPuuid))
      : null

    const selfTeamId = selfTeamEntry ? selfTeamEntry[0] : null
    const selfTeamMembers = selfTeamEntry ? selfTeamEntry[1] : null

    const allMembers = teamEntries.flatMap(([, members]) => members)

    const allyMembers = selfTeamMembers ? [...selfTeamMembers] : []
    const enemyMembers = selfTeamMembers
      ? teamEntries.filter(([teamId]) => teamId !== selfTeamId).flatMap(([, members]) => members)
      : allMembers

    const targetMembers =
      options.target === 'all' ? allMembers : options.target === 'ally' ? allyMembers : enemyMembers

    return {
      ...options,
      locale: appCommon.settings.locale,
      utils: {
        isBotQueue,
        isPveQueue
      },
      sgpServerId: getSgpServerId(
        leagueClient.state.auth?.region || 'UNKNOWN',
        leagueClient.state.auth?.rsoPlatformId
      ),
      region: leagueClient.state.auth?.region || 'UNKNOWN',
      rsoPlatformId: leagueClient.state.auth?.rsoPlatformId || 'UNKNOWN',
      selfPuuid: leagueClient.data.summoner.me?.puuid || 'UNKNOWN',
      selfTeamId: selfTeamId || 'UNKNOWN',
      allyMembers,
      enemyMembers,
      allMembers,
      targetMembers,
      gameData: leagueClient.data.gameData,
      settings: ongoingGame.settings,
      teams: ongoingGame.state.teams,
      matchHistory: ongoingGame.state.matchHistory,
      rankedStats: ongoingGame.state.rankedStats,
      summoner: ongoingGame.state.summoner,
      queryStage: ongoingGame.state.queryStage,
      championMastery: ongoingGame.state.championMastery,
      savedInfo: ongoingGame.state.savedInfo,
      championSelections: ongoingGame.state.championSelections,
      positionAssignments: ongoingGame.state.positionAssignments,
      analysis: ongoingGame.state.analysis,
      gameDetails: ongoingGame.state.gameDetails,
      teamParticipantGroups: ongoingGame.state.teamParticipantGroups,
      mergedPremadeTeamMap: ongoingGame.state.mergedPremadeTeamMap,
      additionalGame: ongoingGame.state.additionalGame,
      addition: ongoingGame.state.additional
    }
  }

  private _getAkariContext(templateId: string) {
    return {
      MIN_VERSION_SUPPORTED: JS_TEMPLATE_MIN_VERSION_SUPPORT,
      require,
      process,
      akariManager: this._context.shared.manager,
      console,
      module,
      templateId,
      __filename,
      __dirname,
      mainGlobal: global,
      Buffer,
      setTimeout,
      setInterval,
      setImmediate
    }
  }
}
