export const URL_PLACEHOLDER_SUB_ID = '@akari:sgpServerSubId@'
export const AKARI_HEADER_SGP_SERVER_ID = 'X-Akari-Sgp-Server-Id'
export const AKARI_HEADER_TOKEN_TYPE = 'X-Akari-Token-Type'

/**
 * 部分接口用  Transfer-Encoding: chunked 会出错
 *
 * 故用此 Header 来标记应该强制收集流并发送
 */
export const AKARI_HEADER_FORCE_STREAM_COLLECT = 'X-Akari-Force-Stream-Collect'
