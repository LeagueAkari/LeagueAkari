import type { HttpApiRequestOptions } from '../request-options'

export interface SgpRegionParam extends HttpApiRequestOptions {
  /** 透传供跨区特性的查询方式，akari 魔法头 */
  __sgpServerId?: string
}
