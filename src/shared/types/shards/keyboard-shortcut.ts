export interface ShortcutDetails {
  keyCodes: number[]
  keys: {
    keyId: string
    isModifier: boolean
    keyCode: number
  }[]
  id: string
  unifiedId: string
}
