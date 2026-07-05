import { AKARI_PROTOCOL_MAIN_NAMESPACE } from '@shared/akari-protocol/namespace'

export { AKARI_PROTOCOL_MAIN_NAMESPACE }
export const AKARI_PROXY_PROTOCOL = 'akari'

export interface AkariProtocolRequestContext {
  requestId?: string
  signal?: AbortSignal
}

export type AkariProtocolDomainHandler = (
  uri: string,
  req: Request,
  context: AkariProtocolRequestContext
) => Promise<Response> | Response
