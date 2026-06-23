export interface NativeKeyState {
  vkCode: number
  pressed: boolean
  scanCode: number
}

export type NativeKeyEventCallback = (rawEvent: string) => void

export interface AkariInputBinding {
  install(): void
  uninstall(): void
  onKeyEvent(callback: NativeKeyEventCallback): void
  sendString(text: string): Promise<void>
  sendKey(virtualKeyCode: number, pressed: boolean): Promise<void>
  getKeyStates(): NativeKeyState[]
}

export interface FixLeagueClientWindowConfig {
  baseWidth?: number
  baseHeight?: number
}

export interface LeagueClientWindowPlacementInfo {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
  shownState: number
  isMinimized: boolean
  isMaximized: boolean
  isNormal: boolean
}

export interface AkariToolsBinding {
  fixWindowMethodA(clientZoom: number, config: FixLeagueClientWindowConfig): boolean | null
  isElevated(): boolean
  getLeagueClientWindowPlacementInfo(): LeagueClientWindowPlacementInfo | null
  getCommandLine1(pid: number): string
  getPidsByName(processName: string): number[]
  terminateProcess(pid: number): boolean
  isProcessForeground(pid: number): boolean
  isProcessRunning(pid: number): boolean
}
