export interface NativeInputKeyEvent {
  _nameRaw: string
  name: string
  standardName: string
  keyId: string
  keyCode: number
  isModifier: boolean
  isCommonModifier: boolean
  isDown: boolean
}
