import { i18next } from '@main/i18n'
import type { Friend } from '@shared/types/league-client/chat'
import type { LcuEvent } from '@shared/types/league-client/event'
import { formatError } from '@shared/utils/errors'
import { randomInt } from '@shared/utils/random'
import { comparer, computed } from 'mobx'

import type { AutoGameflowMainContext } from './context'

export class AutoGameflowInvitationController {
  constructor(private readonly _context: AutoGameflowMainContext) {}

  watch() {
    this._watchAutoHandleInvitation()
    this._watchAutoSkipLeader()
    this._watchAutoInvitation()
  }

  private _watchAutoHandleInvitation() {
    const { leagueClient, logger, mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () =>
        [
          leagueClient.data.lobby.receivedInvitations,
          settings.autoHandleInvitationsEnabled,
          settings.invitationHandlingStrategies,
          settings.rejectInvitationWhenAway,
          leagueClient.data.chat.me?.availability
        ] as const,
      async ([invitations, enabled, strategies, rejectWhenAway, availability]) => {
        if (!enabled || invitations.length === 0) {
          return
        }

        if (rejectWhenAway && availability === 'away') {
          logger.info('Rejecting invitation: current status is away')
          return
        }

        logger.info(
          `Handling invitations: ${JSON.stringify(invitations)}, ${JSON.stringify(strategies)}`
        )

        const availableInvitations = invitations.filter(
          (invitation) => invitation.state === 'Pending' && invitation.canAcceptInvitation
        )

        if (availableInvitations.length === 0) {
          return
        }

        // 先找到任意一个符合要求的, decline 或 accept 或 ignore
        const availableStrategies = availableInvitations
          .map((invitation) => {
            const strategy = strategies[invitation.gameConfig.inviteGameType]

            if (strategy) {
              return {
                id: invitation.invitationId,
                inviteGameType: invitation.gameConfig.inviteGameType,
                strategy: strategies[invitation.gameConfig.inviteGameType]
              }
            }

            return {
              id: invitation.invitationId,
              inviteGameType: invitation.gameConfig.inviteGameType,
              strategy: strategies['<DEFAULT>'] || 'ignore'
            }
          })
          .toSorted((a, b) => {
            if (a.strategy === 'accept' && b.strategy !== 'accept') {
              return -1
            } else if (a.strategy !== 'accept' && b.strategy === 'accept') {
              return 1
            } else if (a.strategy === 'decline' && b.strategy !== 'decline') {
              return -1
            } else if (a.strategy !== 'decline' && b.strategy === 'decline') {
              return 1
            } else {
              return 0
            }
          })

        if (availableStrategies.length === 0) {
          return
        }

        const candidate = availableStrategies[0]

        try {
          if (candidate.strategy === 'accept') {
            await leagueClient.api.lobby.acceptReceivedInvitation(candidate.id)
            logger.info(`Auto-handling invitation: ${candidate.id}, ${candidate.strategy}`)
          } else if (candidate.strategy === 'decline') {
            await leagueClient.api.lobby.declineReceivedInvitation(candidate.id)
            logger.info(`Auto-handling invitation: ${candidate.id}, ${candidate.strategy}`)
          } else {
            logger.info(`Ignoring invitation: ${candidate.id}, ${candidate.strategy}`)
          }
        } catch (error) {
          logger.warn(`Auto-handling invitation failed: ${formatError(error)}`)
        }
      }
    )
  }

  private _watchAutoSkipLeader() {
    const { leagueClient, logger, mobxUtils, settings } = this._context

    const leaderInfo = computed(
      () => {
        const lobby = leagueClient.data.lobby.lobby

        if (!lobby) {
          return null
        }

        const isLeader = lobby.localMember.isLeader

        const targetMembers = lobby.members.filter(
          (player) => player.summonerId !== lobby.localMember.summonerId && !player.isSpectator
        )

        const readyMembers = targetMembers
          .filter((player) => player.ready)
          .map((player) => player.summonerId)
        const notReadyMembers = targetMembers
          .filter((player) => !player.ready)
          .map((player) => player.summonerId)

        return {
          isLeader,
          readyMembers,
          notReadyMembers
        }
      },
      { equals: comparer.structural }
    )

    mobxUtils.reaction(
      () => leaderInfo.get(),
      (info) => {
        if (!settings.autoSkipLeaderEnabled || !info || !info.isLeader) {
          return
        }

        if (!info.readyMembers.length && !info.notReadyMembers.length) {
          return
        }

        // 优先从 ready 的玩家中选择
        const fromMembers = info.readyMembers.length ? info.readyMembers : info.notReadyMembers
        const target = fromMembers[randomInt(0, fromMembers.length - 1)]

        logger.info('Changing room leader', target)

        if (leagueClient.data.chat.conversations.customGame) {
          leagueClient.api.chat.chatSend(
            leagueClient.data.chat.conversations.customGame.id,
            i18next.t('auto-gameflow-main.skip-leader'),
            'celebration'
          )
        }

        leagueClient.api.lobby.promote(target).catch((error) => {
          logger.warn('Failed to change room leader', error)
        })
      },
      { fireImmediately: true }
    )
  }

  private _watchAutoInvitation() {
    const { leagueClient, logger, mobxUtils, state } = this._context

    mobxUtils.reaction(
      () => Boolean(leagueClient.data.lobby.lobby),
      (hasLobby) => {
        if (!hasLobby) {
          state.setFriendsToBeInvited([])
        }
      }
    )

    leagueClient.events.on<LcuEvent<Friend>>(
      '/lol-chat/v1/friends/:id',
      async ({ data, eventType }) => {
        if (eventType === 'Delete') {
          state.setFriendsToBeInvited(
            state.friendsToBeInvited.filter((puuid) => puuid !== data.puuid)
          )
          return
        }

        // Create or Update is OK

        if (
          !data.puuid ||
          data.availability !== 'chat' ||
          !leagueClient.data.lobby.lobby?.localMember.allowedInviteOthers ||
          !state.friendsToBeInvited.includes(data.puuid) ||
          leagueClient.data.lobby.lobby.members.some((member) => member.puuid === data.puuid)
        ) {
          return
        }

        logger.info(`Inviting friend ${data.gameName} #${data.gameTag}`, data.puuid)

        try {
          await leagueClient.api.lobby.postInvitation([data.summonerId])

          if (leagueClient.data.chat.conversations.customGame) {
            leagueClient.api.chat.chatSend(
              leagueClient.data.chat.conversations.customGame.id,
              i18next.t('auto-gameflow-main.auto-invitation-sent', {
                name: `${data.gameName} #${data.gameTag}`
              }),
              'celebration'
            )
          }
        } catch (error) {
          logger.warn(`Failed to invite friend`, error)
        } finally {
          state.setFriendsToBeInvited(
            state.friendsToBeInvited.filter((puuid) => puuid !== data.puuid)
          )
        }
      }
    )
  }
}
