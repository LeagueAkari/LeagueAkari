import { NativeAddonBinding } from '../addon-binding'
import type {
  AkariToolsBinding,
  FixLeagueClientWindowConfig,
  LeagueClientWindowPlacementInfo
} from '../bindings'

export type { FixLeagueClientWindowConfig, LeagueClientWindowPlacementInfo }

const addon = new NativeAddonBinding<AkariToolsBinding>('tools', () =>
  require('../../addons/akari-tools-win64.node')
)

export class AkariNativeTools implements AkariToolsBinding {
  load(): void {
    addon.load()
  }

  isLoaded(): boolean {
    return addon.isLoaded()
  }

  fixWindowMethodA(clientZoom: number, config: FixLeagueClientWindowConfig) {
    return addon.get().fixWindowMethodA(clientZoom, config)
  }

  isElevated(): boolean {
    return addon.get().isElevated()
  }

  getLeagueClientWindowPlacementInfo(): LeagueClientWindowPlacementInfo | null {
    return addon.get().getLeagueClientWindowPlacementInfo()
  }

  getCommandLine1(pid: number): string {
    return addon.get().getCommandLine1(pid)
  }

  getPidsByName(processName: string): number[] {
    return addon.get().getPidsByName(processName)
  }

  terminateProcess(pid: number): boolean {
    return addon.get().terminateProcess(pid)
  }

  isProcessForeground(pid: number): boolean {
    return addon.get().isProcessForeground(pid)
  }

  isProcessRunning(pid: number): boolean {
    return addon.get().isProcessRunning(pid)
  }
}

const tools = new AkariNativeTools()

export default tools
