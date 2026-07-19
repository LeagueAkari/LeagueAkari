export function shouldRunSelfUpdateLifecycle(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
) {
  return platform === 'win32' && arch === 'x64'
}

export function shouldDownloadUpdateArchive(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
) {
  return shouldRunSelfUpdateLifecycle(platform, arch)
}

export function shouldApplyDownloadedUpdate(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
) {
  return shouldRunSelfUpdateLifecycle(platform, arch)
}

export function shouldLaunchUpdaterOnQuit(
  isPackaged: boolean,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
) {
  return isPackaged && shouldApplyDownloadedUpdate(platform, arch)
}

export function shouldUninstallWithUpdater(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
) {
  return shouldRunSelfUpdateLifecycle(platform, arch)
}
