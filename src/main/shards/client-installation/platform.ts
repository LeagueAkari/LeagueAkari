export function shouldScanTencentInstallations(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}

export function shouldScanMacInstallations(platform: NodeJS.Platform = process.platform) {
  return platform === 'darwin'
}

export function shouldRegisterJumpList(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}

export function shouldWatchLiveStreamingClients(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}

export function shouldAllowWindowsOnlyLaunch(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}
