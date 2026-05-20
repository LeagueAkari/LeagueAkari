import { i18next } from '@main/i18n'
import { comparer, computed } from 'mobx'

import type { AutoGameflowMainContext } from './context'

export class AutoGameflowAramTeamSideController {
  constructor(private readonly _context: AutoGameflowMainContext) {}

  watch() {
    const { leagueClient, logger, mobxUtils, settings } = this._context

    // 仅仅支持大乱斗和海克斯大乱斗
    const isAramLikeMode = computed(() => {
      if (!leagueClient.data.gameflow.session || !leagueClient.data.champSelect.session) {
        return false
      }

      return (
        leagueClient.data.champSelect.session.benchEnabled &&
        (leagueClient.data.gameflow.session.map.gameMode === 'ARAM' ||
          leagueClient.data.gameflow.session.map.gameMode === 'KIWI')
      )
    })

    // 这里的 team 字段只有 1 和 2
    // 题外话：teamId 则是 100 和 200
    const localPlayerTeam = computed(() => {
      const localPlayerCellId = leagueClient.data.champSelect.session?.localPlayerCellId
      const myTeam = leagueClient.data.champSelect.session?.myTeam

      if (!myTeam || !localPlayerCellId) {
        return null
      }

      return myTeam.find((player) => player.cellId === localPlayerCellId)?.team ?? null
    })

    mobxUtils.reaction(
      () =>
        [
          leagueClient.data.chat.conversations.championSelect?.id,
          isAramLikeMode.get(),
          localPlayerTeam.get(),
          settings.autoSendARAMTeamSideEnabled
        ] as const,
      ([conversationId, isAramLike, team, enabled]) => {
        if (!enabled) {
          return
        }

        if (!conversationId) {
          return
        }

        if (!team) {
          return
        }

        if (team !== 1 && team !== 2) {
          logger.warn(`Invalid team: ${team}, ignoring`)

          return
        }

        if (!isAramLike) {
          return
        }

        // 这些模式, ARAM / 海克斯大乱斗 等，使用 AllRandomPickStrategy 模式，需告知所属方
        const isTw2 = leagueClient.state.auth?.region === 'TW2'
        const key = isTw2
          ? `auto-gameflow-main.aram-team-side-${team}-tw`
          : `auto-gameflow-main.aram-team-side-${team}`

        leagueClient.api.chat
          .chatSend(
            conversationId,
            `${settings.autoSendARAMTeamSideVisibleToTeam ? '' : '[League Akari] '}${i18next.t(key)}`,
            settings.autoSendARAMTeamSideVisibleToTeam ? undefined : 'celebration'
          )
          .catch((error) => {
            logger.warn(`Failed to send ARAM team side`, error)
          })
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }
}
