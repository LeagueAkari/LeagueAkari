import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  AUTO_GAMEFLOW_MAIN_NAMESPACE,
  AUTO_GAMEFLOW_RENDERER_NAMESPACE,
  type AutoGameflowRendererContext
} from './context'
import { syncAutoGameflowState } from './state-sync'

const MAIN_SHARD_NAMESPACE = AUTO_GAMEFLOW_MAIN_NAMESPACE

@Shard(AutoGameflowRenderer.id)
export class AutoGameflowRenderer implements IAkariShardInitDispose {
  static id = AUTO_GAMEFLOW_RENDERER_NAMESPACE

  private readonly _context: AutoGameflowRendererContext

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc: _ipc,
      piniaMobxUtils,
      settingUtils: _settingUtils
    }
  }

  cancelAutoAccept() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'cancelAutoAccept')
  }

  cancelAutoMatchmaking() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'cancelAutoMatchmaking')
  }

  setAutoHonorEnabled(enabled: boolean) {
    this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoHonorEnabled', enabled)
  }

  setAutoHonorStrategy(strategy: string) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoHonorStrategy', strategy)
  }

  setPlayAgainEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'playAgainEnabled', enabled)
  }

  setAutoAcceptEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoAcceptEnabled', enabled)
  }

  setAutoAcceptDelaySeconds(seconds: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoAcceptDelaySeconds', seconds)
  }

  setAutoReconnectEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoReconnectEnabled', enabled)
  }

  setAutoSkipLeaderEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoSkipLeaderEnabled', enabled)
  }

  setAutoMatchmakingEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingEnabled', enabled)
  }

  setAutoMatchmakingMaximumMatchDuration(seconds: number) {
    return this._settingUtils.set(
      MAIN_SHARD_NAMESPACE,
      'autoMatchmakingMaximumMatchDuration',
      seconds
    )
  }

  setAutoMatchmakingDelaySeconds(seconds: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingDelaySeconds', seconds)
  }

  setAutoMatchmakingMinimumMembers(count: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingMinimumMembers', count)
  }

  setAutoMatchmakingWaitForInvitees(yes: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingWaitForInvitees', yes)
  }

  setAutoMatchmakingRematchStrategy(s: string) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingRematchStrategy', s)
  }

  setAutoMatchmakingRematchFixedDuration(seconds: number) {
    return this._settingUtils.set(
      MAIN_SHARD_NAMESPACE,
      'autoMatchmakingRematchFixedDuration',
      seconds
    )
  }

  setAutoHandleInvitationsEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoHandleInvitationsEnabled', enabled)
  }

  setRejectInvitationWhenAway(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'rejectInvitationWhenAway', enabled)
  }

  setDodgeAtLastSecondThreshold(threshold: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'dodgeAtLastSecondThreshold', threshold)
  }

  setInvitationHandlingStrategies(strategies: Record<string, string>) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'invitationHandlingStrategies', strategies)
  }

  setAutoSendARAMTeamSideEnabled(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoSendARAMTeamSideEnabled', enabled)
  }

  setAutoSendARAMTeamSideVisibleToTeam(visible: boolean) {
    return this._settingUtils.set(
      MAIN_SHARD_NAMESPACE,
      'autoSendARAMTeamSideVisibleToTeam',
      visible
    )
  }

  setFriendsToBeInvited(puuids: string[]) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setFriendsToBeInvited', puuids)
  }

  async onInit() {
    await syncAutoGameflowState(this._context)
  }
}
