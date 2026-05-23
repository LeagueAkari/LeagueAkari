import type { SgpRendererContext } from './context'

export function exposeSgpApiForDebugging(context: SgpRendererContext) {
  // @ts-ignore
  window.sgpApi = context.api
}
