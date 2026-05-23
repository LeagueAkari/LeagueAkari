export const AKARI_PROTOCOL_MAIN_NAMESPACE = 'akari-protocol-main'
export const AKARI_PROXY_PROTOCOL = 'akari'

export type AkariProtocolDomainHandler = (uri: string, req: Request) => Promise<Response> | Response
