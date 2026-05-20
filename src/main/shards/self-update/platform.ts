export function shouldRunSelfUpdateLifecycle(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}

export function shouldDownloadUpdateArchive(platform: NodeJS.Platform = process.platform) {
  return shouldRunSelfUpdateLifecycle(platform)
}

export function shouldApplyDownloadedUpdate(platform: NodeJS.Platform = process.platform) {
  return shouldRunSelfUpdateLifecycle(platform)
}

export function shouldUninstallWithUpdater(platform: NodeJS.Platform = process.platform) {
  return shouldRunSelfUpdateLifecycle(platform)
}
