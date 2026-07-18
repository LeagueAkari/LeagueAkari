const DEFAULT_CONNECTED_COMMAND_LINE_POLL_INTERVAL = 60 * 1000
const DARWIN_CONNECTED_COMMAND_LINE_POLL_INTERVAL = 5 * 1000

export function getConnectedClientCommandLinePollInterval(
  platform: NodeJS.Platform = process.platform
) {
  return platform === 'darwin'
    ? DARWIN_CONNECTED_COMMAND_LINE_POLL_INTERVAL
    : DEFAULT_CONNECTED_COMMAND_LINE_POLL_INTERVAL
}
