import type { AkariToolsBinding, FixLeagueClientWindowConfig, LeagueClientWindowPlacementInfo } from '../bindings';
export type { FixLeagueClientWindowConfig, LeagueClientWindowPlacementInfo };
export declare class AkariNativeTools implements AkariToolsBinding {
    load(): void;
    isLoaded(): boolean;
    fixWindowMethodA(clientZoom: number, config: FixLeagueClientWindowConfig): boolean | null;
    isElevated(): boolean;
    getLeagueClientWindowPlacementInfo(): LeagueClientWindowPlacementInfo | null;
    getCommandLine1(pid: number): string;
    getPidsByName(processName: string): number[];
    terminateProcess(pid: number): boolean;
    isProcessForeground(pid: number): boolean;
    isProcessRunning(pid: number): boolean;
}
declare const tools: AkariNativeTools;
export default tools;
