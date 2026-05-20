import { makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'

export type AutoHonorStrategy =
  | 'prefer-lobby-member' // 随机优先组队时房间内成员
  | 'only-lobby-member' // 随机仅限组队时房间内成员
  | 'all-member' // 随机所有可点赞玩家
  | 'opt-out' // 直接跳过
  | 'all-member-including-opponent' // 随机所有可点赞玩家，包括对手

export type AutoMatchmakingStrategy = 'never' | 'fixed-duration' | 'estimated-duration'

export class AutoGameflowSettings {
  autoHonorEnabled: boolean = false
  autoHonorStrategy: AutoHonorStrategy = 'prefer-lobby-member'

  playAgainEnabled: boolean = false

  autoAcceptEnabled: boolean = false
  autoAcceptDelaySeconds: number = 0

  autoReconnectEnabled: boolean = false

  autoMatchmakingEnabled: boolean = false
  autoMatchmakingMaximumMatchDuration: number = 0
  autoMatchmakingRematchStrategy: AutoMatchmakingStrategy = 'never'
  autoMatchmakingRematchFixedDuration: number = 2
  autoMatchmakingDelaySeconds: number = 5
  autoMatchmakingMinimumMembers = 1 // 最低满足人数
  autoMatchmakingWaitForInvitees: boolean = true // 等待邀请中的用户

  autoSkipLeaderEnabled: boolean = false

  autoHandleInvitationsEnabled: boolean = false
  rejectInvitationWhenAway: boolean = false

  invitationHandlingStrategies: Record<string, string> = {}

  autoSendARAMTeamSideEnabled: boolean = false
  autoSendARAMTeamSideVisibleToTeam: boolean = false

  setAutoHonorEnabled(enabled: boolean) {
    this.autoHonorEnabled = enabled
  }

  setAutoHonorStrategy(strategy: AutoHonorStrategy) {
    this.autoHonorStrategy = strategy
  }

  setPlayAgainEnabled(enabled: boolean) {
    this.playAgainEnabled = enabled
  }

  setAutoAcceptEnabled(enabled: boolean) {
    this.autoAcceptEnabled = enabled
  }

  setAutoAcceptDelaySeconds(seconds: number) {
    this.autoAcceptDelaySeconds = seconds
  }

  setAutoReconnectEnabled(enabled: boolean) {
    this.autoReconnectEnabled = enabled
  }

  setAutoMatchmakingEnabled(enabled: boolean) {
    this.autoMatchmakingEnabled = enabled
  }

  setAutoMatchmakingDelaySeconds(seconds: number) {
    this.autoMatchmakingDelaySeconds = seconds
  }

  setAutoMatchmakingMinimumMembers(count: number) {
    this.autoMatchmakingMinimumMembers = count
  }

  setAutoMatchmakingWaitForInvitees(yes: boolean) {
    this.autoMatchmakingWaitForInvitees = yes
  }

  setAutoMatchmakingRematchStrategy(s: AutoMatchmakingStrategy) {
    this.autoMatchmakingRematchStrategy = s
  }

  setAutoMatchmakingRematchFixedDuration(seconds: number) {
    this.autoMatchmakingRematchFixedDuration = seconds
  }

  setAutoHandleInvitationsEnabled(enabled: boolean) {
    this.autoHandleInvitationsEnabled = enabled
  }

  setRejectInvitationWhenAway(yes: boolean) {
    this.rejectInvitationWhenAway = yes
  }

  setInvitationHandlingStrategies(strategies: Record<string, string>) {
    this.invitationHandlingStrategies = strategies
  }

  setAutoSkipLeaderEnabled(enabled: boolean) {
    this.autoSkipLeaderEnabled = enabled
  }

  setAutoSendARAMTeamSideEnabled(enabled: boolean) {
    this.autoSendARAMTeamSideEnabled = enabled
  }

  setAutoSendARAMTeamSideVisibleToTeam(visible: boolean) {
    this.autoSendARAMTeamSideVisibleToTeam = visible
  }

  constructor() {
    makeAutoObservable(this, {
      invitationHandlingStrategies: observable.struct
    })
  }
}

export class AutoGameflowState {
  /**
   * 即将进行的自动接受操作将在指定时间戳完成
   */
  willAcceptAt: number = -1

  willSearchMatch: boolean = false

  /**
   * 即将进行的匹配开始的时间
   */
  willSearchMatchAt: number = -1

  /**
   * 即将进行的自动重连操作将在指定时间戳完成
   */
  willReconnectAt: number = -1

  /**
   * 即将被邀请的好友的 PUUID 列表
   */
  friendsToBeInvited: string[] = []

  get activityStartStatus() {
    if (!this._leagueClientData.lobby.lobby) {
      return 'unavailable'
    }

    if (this._leagueClientData.gameflow.session?.gameData.isCustomGame) {
      return 'unavailable'
    }

    const self = this._leagueClientData.lobby.lobby.members.find(
      (m) => m.puuid === this._leagueClientData.summoner.me?.puuid
    )

    if (self) {
      if (!self.isLeader) {
        return 'not-the-leader'
      }
    } else {
      return 'unavailable'
    }

    if (this._leagueClientData.matchmaking.search) {
      const errors = this._leagueClientData.matchmaking.search.errors
      const maxPenaltyTime = errors.reduce(
        (prev, cur) => Math.max(cur.penaltyTimeRemaining, prev),
        -Infinity
      )

      if (maxPenaltyTime > 0) {
        return 'waiting-for-penalty-time'
      }
    }

    if (this.settings.autoMatchmakingWaitForInvitees) {
      const hasPendingInvitation = this._leagueClientData.lobby.lobby.invitations.some(
        (i) => i.state === 'Pending'
      )
      if (hasPendingInvitation) {
        return 'waiting-for-invitees'
      }
    }

    if (
      this._leagueClientData.lobby.lobby.members.length <
      this.settings.autoMatchmakingMinimumMembers
    ) {
      return 'insufficient-members'
    }

    if (this._leagueClientData.lobby.lobby.canStartActivity) {
      return 'can-start-activity'
    } else {
      return 'cannot-start-activity'
    }
  }

  setAcceptAt(at: number) {
    this.willAcceptAt = at
  }

  setSearchMatchAt(at: number) {
    this.willSearchMatch = true
    this.willSearchMatchAt = at
  }

  clearAutoAccept() {
    this.willAcceptAt = -1
  }

  clearAutoSearchMatch() {
    this.willSearchMatch = false
    this.willSearchMatchAt = -1
  }

  setReconnectAt(at: number) {
    this.willReconnectAt = at
  }

  setFriendsToBeInvited(puuids: string[]) {
    this.friendsToBeInvited = puuids
  }

  constructor(
    private readonly _leagueClientData: LeagueClientData,
    private readonly settings: AutoGameflowSettings
  ) {
    makeAutoObservable(this)
  }
}
