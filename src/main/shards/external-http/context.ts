import type { Session } from 'electron'

import type { AppCommonMain } from '../app-common'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'

export const EXTERNAL_HTTP_MAIN_NAMESPACE = 'external-http-main'
export const EXTERNAL_HTTP_SESSION_PARTITION = 'external-http'

export type ExternalHttpSession = Pick<
  Session,
  'fetch' | 'setProxy' | 'resolveProxy' | 'closeAllConnections'
>

export interface ExternalHttpMainContext {
  namespace: string
  appCommon: AppCommonMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  electronSession: ExternalHttpSession
}
