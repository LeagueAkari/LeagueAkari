const WINDOWS_GAME_CLIENT_PROCESS_NAME = 'League of Legends.exe'
const DARWIN_GAME_CLIENT_PROCESS_NAME = 'LeagueofLegends'

export function getGameClientProcessName(platform: NodeJS.Platform = process.platform) {
  return platform === 'darwin' ? DARWIN_GAME_CLIENT_PROCESS_NAME : WINDOWS_GAME_CLIENT_PROCESS_NAME
}
