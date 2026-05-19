import { i18next } from '@main/i18n'
import { TimeoutTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Friend } from '@shared/types/league-client/chat'
import { LcuEvent } from '@shared/types/league-client/event'
import { ChoiceMaker } from '@shared/utils/choice-maker'
import { formatError } from '@shared/utils/errors'
import { randomInt } from '@shared/utils/random'
import { comparer, computed } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoGameflowSettings, AutoGameflowState } from './state'

/**
 * 自动游戏流程相关功能
 */
@Shard(AutoGameflowMain.id)
export class AutoGameflowMain implements IAkariShardInitDispose {
  static id = 'auto-gameflow-main'

  public readonly settings = new AutoGameflowSettings()
  public readonly state: AutoGameflowState

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private _autoSearchMatchTimerId: NodeJS.Timeout | null = null
  private _autoSearchMatchCountdownTimerId: NodeJS.Timeout | null = null
  private _autoAcceptTask = new TimeoutTask(this._acceptMatch.bind(this))
  private _playAgainTask = new TimeoutTask(this._playAgainFn.bind(this))
  private _reconnectTask = new TimeoutTask(this._reconnectFn.bind(this))

  static HONOR_CATEGORY = ['HEART'] as const

  static PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT = 3250
  static PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT = 10000
  static PLAY_AGAIN_BUFFER_TIMEOUT = 1575

  constructor(
    readonly _loggerFactory: LoggerFactoryMain,
    readonly _settingFactory: SettingFactoryMain,
    private readonly _lc: LeagueClientMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._log = _loggerFactory.create(AutoGameflowMain.id)
    this.state = new AutoGameflowState(this._lc.data, this.settings)
    this._setting = _settingFactory.register(
      AutoGameflowMain.id,
      {
        autoAcceptDelaySeconds: { default: this.settings.autoAcceptDelaySeconds },
        autoAcceptEnabled: { default: this.settings.autoAcceptEnabled },
        autoHonorEnabled: { default: this.settings.autoHonorEnabled },
        autoHonorStrategy: { default: this.settings.autoHonorStrategy },
        autoMatchmakingDelaySeconds: { default: this.settings.autoMatchmakingDelaySeconds },
        autoMatchmakingEnabled: { default: this.settings.autoMatchmakingEnabled },
        autoMatchmakingMaximumMatchDuration: {
          default: this.settings.autoMatchmakingMaximumMatchDuration
        },
        autoMatchmakingMinimumMembers: { default: this.settings.autoMatchmakingMinimumMembers },
        playAgainEnabled: { default: this.settings.playAgainEnabled },
        autoReconnectEnabled: { default: this.settings.autoReconnectEnabled },
        autoMatchmakingRematchFixedDuration: {
          default: this.settings.autoMatchmakingRematchFixedDuration
        },
        autoSkipLeaderEnabled: {
          default: this.settings.autoSkipLeaderEnabled
        },
        autoMatchmakingRematchStrategy: { default: this.settings.autoMatchmakingRematchStrategy },
        autoMatchmakingWaitForInvitees: { default: this.settings.autoMatchmakingWaitForInvitees },
        autoHandleInvitationsEnabled: { default: this.settings.autoHandleInvitationsEnabled },
        invitationHandlingStrategies: { default: this.settings.invitationHandlingStrategies },
        rejectInvitationWhenAway: { default: this.settings.rejectInvitationWhenAway },
        autoSendARAMTeamSideEnabled: { default: this.settings.autoSendARAMTeamSideEnabled },
        autoSendARAMTeamSideVisibleToTeam: {
          default: this.settings.autoSendARAMTeamSideVisibleToTeam
        }
      },
      this.settings
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(AutoGameflowMain.id, 'cancelAutoAccept', () => {
      this.cancelAutoAccept('normal')
    })

    this._ipc.onCall(AutoGameflowMain.id, 'cancelAutoMatchmaking', () => {
      this.cancelAutoMatchmaking('normal')
    })

    this._ipc.onCall(AutoGameflowMain.id, 'setFriendsToBeInvited', (_, puuids: string[]) => {
      this.state.setFriendsToBeInvited(puuids)
    })
  }

  private _handleLogging() {
    // 监听 gameflow
    this._mobx.reaction(
      () => this._lc.data.gameflow.phase,
      (phase) => {
        this._log.info(`Gameflow phase changed: ${phase}`)
      }
    )
  }

  private _handleAutoAccept() {
    this._mobx.reaction(
      () => this._lc.data.gameflow.phase,
      (phase) => {
        if (!this.settings.autoAcceptEnabled) {
          return
        }

        if (phase === 'ReadyCheck') {
          const delay = this.settings.autoAcceptDelaySeconds * 1e3
          this.state.setAcceptAt(Date.now() + delay)
          this._autoAcceptTask.start({ delay })

          this._log.info(
            `ReadyCheck! Will accept in ${this.settings.autoAcceptDelaySeconds} seconds`
          )
        } else {
          if (this._autoAcceptTask.isStarted) {
            this._log.info(`Cancelled upcoming auto-accept - not in ReadyCheck phase`)
            this._autoAcceptTask.cancel()
          }
          this.state.clearAutoAccept()
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this.settings.autoAcceptEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoAccept('normal')
        }
      },
      { fireImmediately: true }
    )

    this._lc.events.on('/lol-matchmaking/v1/ready-check', (event) => {
      if (
        event.data &&
        (event.data.playerResponse === 'Declined' || event.data.playerResponse === 'Accepted')
      ) {
        this.cancelAutoAccept(event.data.playerResponse.toLowerCase())
      }
    })
  }

  private _handleAutoPlayAgain() {
    this._mobx.reaction(
      () => [this._lc.data.gameflow.phase, this.settings.playAgainEnabled] as const,
      async ([phase, enabled]) => {
        if (
          !enabled ||
          (phase !== 'WaitingForStats' && phase !== 'PreEndOfGame' && phase !== 'EndOfGame')
        ) {
          this._playAgainTask.cancel()
          return
        }

        // 如果停留在结算页面时间过长，将考虑返回
        if (phase === 'WaitingForStats' && enabled) {
          this._log.info(
            `In WaitingForStats, waiting for ${AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT} ms`
          )
          this._playAgainTask.start({ delay: AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT })
          return
        }

        // 在某些模式中，可能会出现仅有 PreEndOfGame 的情况，需要做一个计时器
        if (phase === 'PreEndOfGame' && enabled) {
          this._log.info(
            `Waiting for ballot event ${AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT} ms`
          )
          this._playAgainTask.start({ delay: AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT })
          return
        }

        if (phase === 'EndOfGame' && enabled) {
          this._log.info(`Will return to lobby in ${AutoGameflowMain.PLAY_AGAIN_BUFFER_TIMEOUT} ms`)
          this._playAgainTask.start({ delay: AutoGameflowMain.PLAY_AGAIN_BUFFER_TIMEOUT })
          return
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  private _handleAutoReconnect() {
    this._mobx.reaction(
      () => [this._lc.data.gameflow.phase, this.settings.autoReconnectEnabled] as const,
      ([phase, enabled]) => {
        if (phase === 'Reconnect' && enabled) {
          this._log.info('Will attempt to reconnect in a short delay')
          this.state.setReconnectAt(Date.now() + 10000)
          this._reconnectTask.start({ delay: 10000 })
        } else {
          this.state.setReconnectAt(-1)
          this._reconnectTask.cancel()
        }
      }
    )
  }

  private _handleAutoHandleInvitation() {
    this._mobx.reaction(
      () =>
        [
          this._lc.data.lobby.receivedInvitations,
          this.settings.autoHandleInvitationsEnabled,
          this.settings.invitationHandlingStrategies,
          this.settings.rejectInvitationWhenAway,
          this._lc.data.chat.me?.availability
        ] as const,
      async ([invitations, enabled, strategies, rejectWhenAway, availability]) => {
        if (!enabled || invitations.length === 0) {
          return
        }

        if (rejectWhenAway && availability === 'away') {
          this._log.info('Rejecting invitation: current status is away')
          return
        }

        this._log.info(
          `Handling invitations: ${JSON.stringify(invitations)}, ${JSON.stringify(strategies)}`
        )

        const availableInvitations = invitations.filter(
          (i) => i.state === 'Pending' && i.canAcceptInvitation
        )

        if (availableInvitations.length === 0) {
          return
        }

        // 先找到任意一个符合要求的, decline 或 accept 或 ignore
        const availableStrategies = availableInvitations
          .map((i) => {
            const strategy = strategies[i.gameConfig.inviteGameType]

            if (strategy) {
              return {
                id: i.invitationId,
                inviteGameType: i.gameConfig.inviteGameType,
                strategy: strategies[i.gameConfig.inviteGameType]
              }
            }

            return {
              id: i.invitationId,
              inviteGameType: i.gameConfig.inviteGameType,
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
            await this._lc.api.lobby.acceptReceivedInvitation(candidate.id)
            this._log.info(`Auto-handling invitation: ${candidate.id}, ${candidate.strategy}`)
          } else if (candidate.strategy === 'decline') {
            await this._lc.api.lobby.declineReceivedInvitation(candidate.id)
            this._log.info(`Auto-handling invitation: ${candidate.id}, ${candidate.strategy}`)
          } else {
            this._log.info(`Ignoring invitation: ${candidate.id}, ${candidate.strategy}`)
          }
        } catch (error) {
          this._log.warn(`Auto-handling invitation failed: ${formatError(error)}`)
        }
      }
    )
  }

  private _handleAutoSkipLeader() {
    const leaderInfo = computed(
      () => {
        const lobby = this._lc.data.lobby.lobby

        if (!lobby) {
          return null
        }

        const isLeader = lobby.localMember.isLeader

        const targetMembers = lobby.members.filter(
          (p) => p.summonerId !== lobby.localMember.summonerId && !p.isSpectator
        )

        const readyMembers = targetMembers.filter((p) => p.ready).map((p) => p.summonerId)
        const notReadyMembers = targetMembers.filter((p) => !p.ready).map((p) => p.summonerId)

        return {
          isLeader,
          readyMembers,
          notReadyMembers
        }
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => leaderInfo.get(),
      (info) => {
        if (!this.settings.autoSkipLeaderEnabled || !info || !info.isLeader) {
          return
        }

        if (!info.readyMembers.length && !info.notReadyMembers.length) {
          return
        }

        // 优先从 ready 的玩家中选择
        const fromMembers = info.readyMembers.length ? info.readyMembers : info.notReadyMembers
        const target = fromMembers[randomInt(0, fromMembers.length - 1)]

        this._log.info('Changing room leader', target)

        if (this._lc.data.chat.conversations.customGame) {
          this._lc.api.chat.chatSend(
            this._lc.data.chat.conversations.customGame.id,
            i18next.t('auto-gameflow-main.skip-leader'),
            'celebration'
          )
        }

        this._lc.api.lobby.promote(target).catch((e) => {
          this._log.warn('Failed to change room leader', e)
        })
      },
      { fireImmediately: true }
    )
  }

  private _handleAutoBallot() {
    const honorables = computed(() => {
      if (!this._lc.data.honor.ballot) {
        return null
      }

      const {
        eligibleAllies,
        eligibleOpponents,
        gameId,
        votePool: { votes }
      } = this._lc.data.honor.ballot

      return {
        allies: eligibleAllies.filter((p) => !p.botPlayer).map((p) => p.puuid),
        opponents: eligibleOpponents.filter((p) => !p.botPlayer).map((p) => p.puuid),
        votes,
        gameId
      }
    })

    this._mobx.reaction(
      () => [honorables.get(), this.settings.autoHonorEnabled] as const,
      async ([h, enabled]) => {
        if (h && h.gameId) {
          this._playAgainTask.cancel()
        }

        if (h && h.gameId && enabled) {
          try {
            const eogStatus = (await this._lc.api.lobby.getEogStatus()).data
            const lobbyMembers = [
              ...eogStatus.eogPlayers,
              ...eogStatus.leftPlayers,
              ...eogStatus.readyPlayers
            ]

            const candidates: string[] = []

            // 1. 优先从房间中的己方成员选择
            const lobbyAllies = h.allies.filter((p) => lobbyMembers.includes(p))
            const firstBatchVotes = Math.min(h.votes, lobbyAllies.length)
            if (firstBatchVotes > 0) {
              const weights = Array(lobbyAllies.length).fill(1)
              const maker = new ChoiceMaker(weights, lobbyAllies)
              const chosenLobbyAllies = maker.choose(firstBatchVotes)
              candidates.push(...chosenLobbyAllies)
            }

            // 2. 如果还有剩余点赞数，从非房间内的己方成员中选择
            const remainingVotesAfterFirst = h.votes - candidates.length
            if (remainingVotesAfterFirst > 0) {
              const nonLobbyAllies = h.allies.filter(
                (p) => !lobbyMembers.includes(p) && !candidates.includes(p)
              )
              const secondBatchVotes = Math.min(remainingVotesAfterFirst, nonLobbyAllies.length)
              if (secondBatchVotes > 0) {
                const weights = Array(nonLobbyAllies.length).fill(1)
                const maker = new ChoiceMaker(weights, nonLobbyAllies)
                const chosenNonLobbyAllies = maker.choose(secondBatchVotes)
                candidates.push(...chosenNonLobbyAllies)
              }
            }

            // 3. 如果还有剩余点赞数，从非房间内的敌方成员中选择
            const remainingVotesAfterSecond = h.votes - candidates.length
            if (remainingVotesAfterSecond > 0) {
              const nonLobbyOpponents = h.opponents.filter(
                (p) => !lobbyMembers.includes(p) && !candidates.includes(p)
              )
              const thirdBatchVotes = Math.min(remainingVotesAfterSecond, nonLobbyOpponents.length)
              if (thirdBatchVotes > 0) {
                const weights = Array(nonLobbyOpponents.length).fill(1)
                const maker = new ChoiceMaker(weights, nonLobbyOpponents)
                const chosenNonLobbyOpponents = maker.choose(thirdBatchVotes)
                candidates.push(...chosenNonLobbyOpponents)
              }
            }

            // 对选择出的candidates进行点赞
            for (const puuid of candidates) {
              await this._lc.api.honor.honor(
                AutoGameflowMain.HONOR_CATEGORY[
                  randomInt(0, AutoGameflowMain.HONOR_CATEGORY.length)
                ],
                puuid
              )
            }

            await this._lc.api.honor.ballot()
            this._log.info(`Auto-honor: voting for ${candidates.join(', ')}, game ID: ${h.gameId}`)
          } catch (error) {
            this._ipc.sendEvent(AutoGameflowMain.id, 'error-auto-honor', formatError(error))

            this._log.warn(`Auto-honor error: ${formatError(error)}`)
          }
        }
      },
      {
        equals: comparer.structural,
        fireImmediately: true
      }
    )
  }

  private _handleAutoSearchMatch() {
    this._mobx.reaction(
      () => this.settings.autoMatchmakingEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoMatchmaking('normal')
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => [this.state.activityStartStatus, this.settings.autoMatchmakingEnabled] as const,
      ([s, enabled]) => {
        if (!enabled) {
          this.cancelAutoMatchmaking('normal')
          return
        }

        if (s === 'can-start-activity') {
          this._log.info(
            `Now will start matchmaking in ${this.settings.autoMatchmakingDelaySeconds} seconds`
          )
          this.state.setSearchMatchAt(Date.now() + this.settings.autoMatchmakingDelaySeconds * 1e3)
          this._autoSearchMatchTimerId = setTimeout(
            () => this._startMatchmaking(),
            this.settings.autoMatchmakingDelaySeconds * 1e3
          )

          this._sendAutoSearchMatchInfoInChat()
          this._autoSearchMatchCountdownTimerId = setInterval(
            () => this._sendAutoSearchMatchInfoInChat(),
            1000
          )
        } else if (s === 'unavailable' || s === 'cannot-start-activity') {
          this.cancelAutoMatchmaking('normal')
        } else {
          this.cancelAutoMatchmaking(s)
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )

    const simplifiedSearchState = computed(() => {
      if (!this._lc.data.matchmaking.search) {
        return null
      }

      return {
        timeInQueue: this._lc.data.matchmaking.search.timeInQueue,
        estimatedQueueTime: this._lc.data.matchmaking.search.estimatedQueueTime,
        searchState: this._lc.data.matchmaking.search.searchState,
        lowPriorityData: this._lc.data.matchmaking.search.lowPriorityData,
        isCurrentlyInQueue: this._lc.data.matchmaking.search.isCurrentlyInQueue
      }
    })

    let penaltyTime = 0
    this._mobx.reaction(
      () => Boolean(simplifiedSearchState.get()),
      (hasSearchState) => {
        if (hasSearchState) {
          penaltyTime = simplifiedSearchState.get()?.lowPriorityData.penaltyTime || 0
        } else {
          penaltyTime = 0
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () =>
        [
          simplifiedSearchState.get(),
          this.settings.autoMatchmakingRematchStrategy,
          this.settings.autoMatchmakingRematchFixedDuration
        ] as const,
      ([s, st, d]) => {
        if (st === 'never' || !s || s.searchState !== 'Searching') {
          return
        }

        if (!s.isCurrentlyInQueue) {
          return
        }

        if (st === 'fixed-duration') {
          if (s.timeInQueue - penaltyTime >= d) {
            this._lc.api.lobby.deleteSearchMatch().catch((e) => {
              this._log.warn(`Failed to cancel matchmaking: ${formatError(e)}`)
            })
            return
          }
        } else if (st === 'estimated-duration') {
          if (s.timeInQueue - penaltyTime >= s.estimatedQueueTime) {
            this._lc.api.lobby.deleteSearchMatch().catch((e) => {
              this._log.warn(`Failed to cancel matchmaking: ${formatError(e)}`)
            })
          }
        }
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }

  private _handlePreEndOfGame() {
    this._lc.events.on('/lol-pre-end-of-game/v1/currentSequenceEvent', async (event) => {
      if (event.data) {
        // TODO: 暂时将 missions-celebration 合并到 play-again 逻辑设置下
        if (this.settings.playAgainEnabled && event.data.name === 'missions-celebration') {
          this._log.info(
            'PreEndOfGame currentSequenceEvent: missions-celebration, attempting to complete'
          )
          try {
            await this._lc.api.preEndOfGame.complete('missions-celebration')
          } catch (error) {
            this._log.warn(`Failed to complete missions-celebration: ${formatError(error)}`)
          }
        }
      }
    })
  }

  private _handleSendARAMTeamSide() {
    // 仅仅支持大乱斗和海克斯大乱斗
    const isAramLikeMode = computed(() => {
      if (!this._lc.data.gameflow.session || !this._lc.data.champSelect.session) {
        return false
      }

      return (
        this._lc.data.champSelect.session.benchEnabled &&
        (this._lc.data.gameflow.session.map.gameMode === 'ARAM' ||
          this._lc.data.gameflow.session.map.gameMode === 'KIWI')
      )
    })

    // 这里的 team 字段只有 1 和 2
    // 题外话：teamId 则是 100 和 200
    const localPlayerTeam = computed(() => {
      const localPlayerCellId = this._lc.data.champSelect.session?.localPlayerCellId
      const myTeam = this._lc.data.champSelect.session?.myTeam

      if (!myTeam || !localPlayerCellId) {
        return null
      }

      return myTeam.find((p) => p.cellId === localPlayerCellId)?.team ?? null
    })

    this._mobx.reaction(
      () =>
        [
          this._lc.data.chat.conversations.championSelect?.id,
          isAramLikeMode.get(),
          localPlayerTeam.get(),
          this.settings.autoSendARAMTeamSideEnabled
        ] as const,
      ([id, isAramLikeMode, localPlayerTeam, enabled]) => {
        if (!enabled) {
          return
        }

        if (!id) {
          return
        }

        if (!localPlayerTeam) {
          return
        }

        if (localPlayerTeam !== 1 && localPlayerTeam !== 2) {
          this._log.warn(`Invalid team: ${localPlayerTeam}, ignoring`)

          return
        }

        if (!isAramLikeMode) {
          return
        }

        // 这些模式, ARAM / 海克斯大乱斗 等，使用 AllRandomPickStrategy 模式，需告知所属方
        const isTw2 = this._lc.state.auth?.region === 'TW2'
        const key = isTw2
          ? `auto-gameflow-main.aram-team-side-${localPlayerTeam}-tw`
          : `auto-gameflow-main.aram-team-side-${localPlayerTeam}`

        this._lc.api.chat
          .chatSend(
            id,
            `${this.settings.autoSendARAMTeamSideVisibleToTeam ? '' : '[League Akari] '}${i18next.t(key)}`,
            this.settings.autoSendARAMTeamSideVisibleToTeam ? undefined : 'celebration'
          )
          .catch((error) => {
            this._log.warn(`Failed to send ARAM team side`, error)
          })
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  private _handleAutoInvitation() {
    this._mobx.reaction(
      () => Boolean(this._lc.data.lobby.lobby),
      (hasLobby) => {
        if (!hasLobby) {
          this.state.setFriendsToBeInvited([])
        }
      }
    )

    this._lc.events.on<LcuEvent<Friend>>(
      '/lol-chat/v1/friends/:id',
      async ({ data, eventType }) => {
        if (eventType === 'Delete') {
          this.state.setFriendsToBeInvited(
            this.state.friendsToBeInvited.filter((p) => p !== data.puuid)
          )
          return
        }

        // Create or Update is OK

        if (
          !data.puuid ||
          data.availability !== 'chat' ||
          !this._lc.data.lobby.lobby?.localMember.allowedInviteOthers ||
          !this.state.friendsToBeInvited.includes(data.puuid) ||
          this._lc.data.lobby.lobby.members.some((m) => m.puuid === data.puuid)
        ) {
          return
        }

        this._log.info(`Inviting friend ${data.gameName} #${data.gameTag}`, data.puuid)

        try {
          await this._lc.api.lobby.postInvitation([data.summonerId])

          if (this._lc.data.chat.conversations.customGame) {
            this._lc.api.chat.chatSend(
              this._lc.data.chat.conversations.customGame.id,
              i18next.t('auto-gameflow-main.auto-invitation-sent', {
                name: `${data.gameName} #${data.gameTag}`
              }),
              'celebration'
            )
          }
        } catch (error) {
          this._log.warn(`Failed to invite friend`, error)
        } finally {
          this.state.setFriendsToBeInvited(
            this.state.friendsToBeInvited.filter((p) => p !== data.puuid)
          )
        }
      }
    )
  }

  private async _acceptMatch() {
    try {
      await this._lc.api.matchmaking.accept()
    } catch (error) {
      this._ipc.sendEvent(AutoGameflowMain.id, 'error-accept-match', formatError(error))

      this._log.warn(`Failed to accept match`, error)
    }
    this.state.clearAutoAccept()
  }

  private async _startMatchmaking() {
    try {
      if (this._autoSearchMatchCountdownTimerId) {
        clearInterval(this._autoSearchMatchCountdownTimerId)
        this._autoSearchMatchCountdownTimerId = null
      }
      this.state.clearAutoSearchMatch()
      this._autoSearchMatchTimerId = null
      await this._lc.api.lobby.searchMatch()
    } catch (error) {
      this._ipc.sendEvent(AutoGameflowMain.id, 'error-matchmaking', formatError(error))

      this._log.warn(`Failed to start matchmaking`, error)
    }
  }

  private async _playAgainFn() {
    try {
      this._log.info('Play again, returning to lobby')
      await this._lc.api.lobby.playAgain()
    } catch (error) {
      this._log.warn(`Failed to play again`, error)
    }
  }

  private async _reconnectFn() {
    try {
      this._log.info('Reconnect! Attempting to reconnect')
      await this._lc.api.gameflow.reconnect()
    } catch (error) {
      this._log.warn(`Failed to reconnect`, error)
    } finally {
      this.state.setReconnectAt(-1)
    }
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._setting.onChange('autoAcceptEnabled', async (v, { setter }) => {
      if (!v) {
        this.cancelAutoAccept('normal')
      }

      this.settings.setAutoAcceptEnabled(v)
      await setter()
    })

    this._mobx.propSync(AutoGameflowMain.id, 'settings', this.settings, [
      'autoAcceptDelaySeconds',
      'autoAcceptEnabled',
      'autoHonorEnabled',
      'autoHonorStrategy',
      'autoMatchmakingDelaySeconds',
      'autoMatchmakingEnabled',
      'autoMatchmakingMinimumMembers',
      'autoMatchmakingRematchFixedDuration',
      'autoMatchmakingRematchStrategy',
      'autoMatchmakingWaitForInvitees',
      'autoSkipLeaderEnabled',
      'playAgainEnabled',
      'autoHandleInvitationsEnabled',
      'autoReconnectEnabled',
      'autoMatchmakingMaximumMatchDuration',
      'invitationHandlingStrategies',
      'rejectInvitationWhenAway',
      'autoSendARAMTeamSideEnabled',
      'autoSendARAMTeamSideVisibleToTeam'
    ])

    this._mobx.propSync(AutoGameflowMain.id, 'state', this.state, [
      'willAcceptAt',
      'willSearchMatch',
      'willSearchMatchAt',
      'activityStartStatus',
      'friendsToBeInvited'
    ])
  }

  cancelAutoAccept(reason?: string) {
    if (this.state.willAcceptAt > 0) {
      if (this._autoAcceptTask.isStarted) {
        this._autoAcceptTask.cancel()
        if (reason === 'accepted') {
          this._log.info(`Already accepted match`)
        } else if (reason === 'declined') {
          this._log.info(`Already declined match`)
        } else {
          this._log.info(`Auto-accept cancelled - ${reason || 'unknown reason'}`)
        }
      }
      this.state.clearAutoAccept()
    }
  }

  cancelAutoMatchmaking(reason?: string) {
    if (this.state.willSearchMatch) {
      if (this._autoSearchMatchTimerId) {
        clearTimeout(this._autoSearchMatchTimerId)
        this._autoSearchMatchTimerId = null
      }
      if (this._autoSearchMatchCountdownTimerId) {
        this._sendAutoSearchMatchInfoInChat(reason)
        clearInterval(this._autoSearchMatchCountdownTimerId)
        this._autoSearchMatchCountdownTimerId = null
      }

      this.state.clearAutoSearchMatch()
      this._log.info(`Auto-matchmaking cancelled - ${reason || 'unknown reason'}`)
    }
  }

  private async _sendAutoSearchMatchInfoInChat(cancel?: string) {
    if (this._lc.data.chat.conversations.customGame && this.state.willSearchMatch) {
      if (cancel === 'normal') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'waiting-for-invitee') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-wait-for-invitees')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'not-the-leader') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-not-leader')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'waiting-for-penalty-time') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-wait-for-penalty')}`,
            'celebration'
          )
          .catch(() => {})
        return
      }

      const time = (this.state.willSearchMatchAt - Date.now()) / 1e3
      this._lc.api.chat
        .chatSend(
          this._lc.data.chat.conversations.customGame.id,
          `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-in', { seconds: Math.abs(time).toFixed() })}`,
          'celebration'
        )
        .catch(() => {})
    }
  }

  async onInit() {
    await this._handleState()
    this._handleIpcCall()
    this._handleAutoBallot()
    this._handleAutoAccept()
    this._handleAutoPlayAgain()
    this._handleAutoReconnect()
    this._handleAutoHandleInvitation()
    this._handleAutoSkipLeader()
    this._handleLogging()
    this._handleAutoSearchMatch()
    this._handlePreEndOfGame()
    this._handleSendARAMTeamSide()
    this._handleAutoInvitation()
  }

  async onDispose() {}
}
