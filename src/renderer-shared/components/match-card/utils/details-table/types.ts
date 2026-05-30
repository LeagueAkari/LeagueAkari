import type { Participant } from '@shared/types/league-client/match-history'
import type { SgpParticipantLol } from '@shared/types/sgp/match-history'
import type { VNodeChild } from 'vue'

export type RenderGroupOptions = {
  key:
    | keyof SgpParticipantLol
    | keyof Participant['stats']
    | keyof SgpParticipantLol['challenges']
    | (string & {})

  /** 是否忽略这个字段 */
  hide?: boolean

  /** 各自渲染方式：数字、文本、自定义 */
  render?:
    | 'float'
    | 'integer'
    | 'text'
    | 'compat'
    | 'boolean'
    | 'game-time'
    | 'percentage'
    | 'position'
    | 'selectedRole'
    | 'auto'
    | ((value: any) => VNodeChild)
}

export type RenderGroup = {
  group: string
  items: RenderGroupOptions[]
}
