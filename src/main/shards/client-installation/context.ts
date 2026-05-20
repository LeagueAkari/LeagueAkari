import type { SharedGlobalShard } from '@shared/akari-shard'

import type { AppCommonMain } from '../app-common'
import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { ClientInstallationState } from './state'

export const CLIENT_INSTALLATION_MAIN_NAMESPACE = 'client-installation-main'

export const TENCENT_REG_INSTALL_PATH = 'HKCU\\Software\\Tencent\\LOL'
export const TENCENT_REG_INSTALL_VALUE = 'InstallPath'
export const TENCENT_INSTALL_DIRNAME = 'WeGameApps'
export const TENCENT_LOL_DIRNAME = '英雄联盟'
export const WEGAME_DEFAULTICON_PATH = 'HKCU\\wegame\\DefaultIcon'

export const LIVE_STREAMING_CLIENTS = [
  'obs32.exe',
  'obs64.exe',
  'obs.exe',
  'xsplit.core.exe',
  'livehime.exe',
  'yymixer.exe',
  'douyutool.exe',
  'huomaotool.exe',
  'AliceInCradle.exe'
]

export const LIVE_STREAMING_CLIENT_POLL_INTERVAL = 20 * 60 * 1000

export interface ClientInstallationMainContext {
  namespace: string
  state: ClientInstallationState
  logger: AkariLogger
  appCommon: AppCommonMain
  ipc: AkariIpcMain
  mobxUtils: MobxUtilsMain
  shared: SharedGlobalShard
}
